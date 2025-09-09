import logging
import requests

from typing import Optional
from datetime import timedelta, datetime
from quart_babel import lazy_gettext
from superdesk.io.registry import register_feeding_service_parser
from superdesk.io.feeding_services.http_base_service import HTTPFeedingServiceBase
from superdesk.timer import timer
from superdesk.utc import utcnow
from urllib.parse import urljoin
from superdesk.errors import ProviderError
from celery.exceptions import SoftTimeLimitExceeded
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import touch

logger = logging.getLogger(__name__)

REFRESH_TOKEN_KEY = "refreshToken"


class OnclusiveApiService(HTTPFeedingServiceBase):
    """
    Feeding Service class which can read events using HTTP
    """

    NAME = "onclusive_api"
    label = "Onclusive api feed"
    service = "events"
    FeedParser = "onclusive_api"
    fields = [
        {
            "id": "url",
            "type": "text",
            "label": "Feed URL",
            "placeholder": "Feed URL",
            "required": True,
            "default": "https://api.forwardplanner.com/",
        },
        {
            "id": "username",
            "type": "text",
            "label": lazy_gettext("Username"),
            "placeholder": lazy_gettext("Username"),
            "required": True,
        },
        {
            "id": "password",
            "type": "password",
            "label": lazy_gettext("Password"),
            "placeholder": lazy_gettext("Password"),
            "required": True,
        },
        {
            "id": "days_to_ingest",
            "type": "text",
            "label": lazy_gettext("Days to Ingest"),
            "placeholder": lazy_gettext("Days"),
            "required": False,
            "default": 365,
        },
        {
            "id": "days_to_reingest",
            "type": "text",
            "label": lazy_gettext("Days in the past to Reingest"),
            "placeholder": lazy_gettext("Days"),
            "required": False,
        },
    ]

    HTTP_AUTH = False
    timeout = (5, 60)

    def _update(self, provider, update):
        """
        Fetch events from external API.

        :param provider: Ingest Provider Details.
        :type provider: dict
        :param update: Any update that is required on provider.
        :type update: dict
        :return: a list of events which can be saved.
        """
        BASE_URL = provider["config"]["url"]
        LIMIT = 2000
        self.session = requests.Session()
        self.language = "en-CA"  # make sure there is some default
        parser = self.get_feed_parser(provider)
        update["tokens"] = provider.get("tokens") or {}
        with timer("onclusive:update"):
            self.authenticate(provider, update["tokens"])
            if not self.token:
                return
            update["last_updated"] = utcnow().replace(
                second=0
            )  # next time start from here, onclusive api does not use seconds

            # force reingest starting from now - days_to_reingest
            if provider["config"].get("days_to_reingest"):
                start_date = datetime.now() - timedelta(days=int(provider["config"]["days_to_reingest"]))
                logger.info("Reingesting from %s", start_date.date().isoformat())
                update["config"] = provider["config"].copy()
                update["config"]["days_to_reingest"] = ""
                # override to reset
                update["tokens"]["start_date"] = start_date
                update["tokens"]["next_start"] = start_date
                update["tokens"]["reingesting"] = True
                update["tokens"]["import_finished"] = None
                update["tokens"]["date"] = ""

            if update["tokens"].get("import_finished"):
                # populate it for cases when import was done before we introduced the field
                update["tokens"].setdefault("next_start", update["tokens"]["import_finished"] - timedelta(hours=5))
                url = urljoin(BASE_URL, "/api/v2/events/latest")
                start = update["tokens"]["next_start"] - timedelta(
                    hours=3,  # add a buffer, also not sure about timezone there
                )
                update["tokens"]["next_start"] = update["last_updated"]
                logger.info("Fetching updates since %s", start.isoformat())
                params = dict(
                    date=start.strftime("%Y%m%d"),
                    time=start.strftime("%H%M"),
                    limit=LIMIT,
                )
                iterations = range(0, LIMIT, LIMIT)
                iterations_param = "offset"
            else:
                iterations_param = "date"
                days = int(provider["config"].get("days_to_ingest") or 365)
                logger.info("Fetching %d days", days)
                url = urljoin(BASE_URL, "/api/v2/events/date")
                update["tokens"].setdefault("start_date", update["last_updated"])  # keep for next round
                update["tokens"].setdefault("next_start", update["last_updated"])  # after import continue from start
                start_date = update["tokens"]["start_date"].date()
                params = dict(
                    limit=LIMIT,
                )
                processed_date = update["tokens"].get(iterations_param, "")
                iterations = (
                    date
                    for date in ((start_date + timedelta(days=i)).strftime("%Y%m%d") for i in range(0, days))
                    if date > processed_date  # when continuing skip previously ingested days
                )
            logger.info("ingest from onclusive %s with params %s", url, params)
            lock_name = get_lock_id("ingest", provider["name"], provider["_id"])
            try:
                for i in iterations:
                    if not touch(lock_name, expire=60 * 15):
                        break
                    params[iterations_param] = i
                    logger.info("Onclusive PARAMS %s", params)
                    content = self._fetch(url, params, provider, update["tokens"])
                    items = parser.parse(content, provider)
                    logger.info("Onclusive returned %d items", len(items))
                    for item in items:
                        item.setdefault("language", self.language)
                    if items:
                        yield items
                    update["tokens"][iterations_param] = i
                else:
                    # there was no break so we are done
                    update["tokens"]["import_finished"] = utcnow()
            except SoftTimeLimitExceeded:
                logger.warning("stopped due to time limit, tokens=%s", update["tokens"])

    def _fetch(self, url, params, provider, tokens):
        for i in range(5):
            with timer("onclusive:fetch"):
                response = self.session.get(url=url, params=params, headers=self.headers, timeout=self.timeout)

            if response.status_code == 200:
                return response.json()

            if response.status_code == 401:
                self.authenticate(provider, tokens)

            if response.status_code == 400:
                logger.error("error from api %s", response.text)

        logger.error("could not fetch data from api params=%s", params)
        raise ProviderError.ingestError()

    @property
    def headers(self):
        assert self.token, "Missing auth token"
        return {"Content-Type": "application/json", "Authorization": "Bearer {}".format(self.token)}

    def authenticate(self, provider, tokens):
        self.token = None
        if tokens.get(REFRESH_TOKEN_KEY):
            self.renew_token(provider, tokens)
            if self.token:
                return self.token
        self.credentials(provider, tokens)
        return self.token

    def credentials(self, provider, tokens) -> Optional[str]:
        auth_url = urljoin(provider["config"]["url"], "/api/v2/auth")
        body = {"username": provider["config"]["username"], "password": provider["config"]["password"]}
        with timer("onclusive:auth"):
            resp = self.session.post(auth_url, body, timeout=self.timeout)
        resp.raise_for_status()
        data = resp.json()
        if data.get("refreshToken"):
            tokens[REFRESH_TOKEN_KEY] = data["refreshToken"]
        self.set_language(data)
        if data.get("token"):
            self.token = data["token"]
            return self.token
        logger.error("Could not authenticate using username and password")
        return None

    def renew_token(self, provider, tokens):
        url = urljoin(provider["config"]["url"], "/api/v2/auth/renew")
        body = {"refreshToken": tokens[REFRESH_TOKEN_KEY]}
        with timer("onclusive:auth-renew"):
            renew_response = self.session.post(url=url, data=body, timeout=self.timeout)
        try:
            renew_response.raise_for_status()
        except Exception as e:
            logger.error("error %s body %s", e, renew_response.content)
        if renew_response.status_code == 400:
            tokens[REFRESH_TOKEN_KEY] = None
            return
        if renew_response.status_code == 200:
            new_token = renew_response.json()
            if new_token.get("refreshToken"):
                tokens[REFRESH_TOKEN_KEY] = new_token["refreshToken"]
            self.token = new_token["token"]
            self.set_language(new_token)
            return self.token

    def set_language(self, data):
        if data.get("productId") and data["productId"] == 10:
            self.language = "fr-CA"
        else:
            self.language = "en-CA"


register_feeding_service_parser(OnclusiveApiService.NAME, OnclusiveApiService.FeedParser)
