import logging
from datetime import datetime, date, timedelta
from flask_babel import lazy_gettext
from flask import current_app as app
import requests
import superdesk
from superdesk.io.feeding_services.http_base_service import HTTPFeedingServiceBase

logger = logging.getLogger(__name__)


class OnclusiveApiService(HTTPFeedingServiceBase):
    """
    Feeding Service class which can read events using HTTP
    """

    NAME = "Onclusive_api"
    label = "Onclusive api feed"
    service = "events"
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
            "id": "days",
            "type": "text",
            "label": lazy_gettext("Days"),
            "placeholder": lazy_gettext("Days"),
            "required": True,
        },
    ]

    HTTP_AUTH = False

    def _update(self, provider, update):
        """
        Fetch events from external API.

        :param provider: Ingest Provider Details.
        :type provider: dict
        :param update: Any update that is required on provider.
        :type update: dict
        :return: a list of events which can be saved.
        """
        session = requests.Session()
        current_date = datetime.now()
        content = []
        TIMEOUT = (5, 30)
        ONCLUSIVE_MAX_OFFSET = app.config["ONCLUSIVE_MAX_OFFSET"]
        URL = provider["config"]["url"]

        if provider["config"].get("refreshToken"):
            TOKEN = self.renew_token(provider, session)
        else:
            TOKEN = self.authentication(TIMEOUT, session, provider)

        if TOKEN:
            headers = {"Content-Type": "application/json", "Authorization": "Bearer " + TOKEN}

            if provider.get("last_updated") is None or (
                provider.get("last_updated") and provider["last_updated"].date() != current_date.date()
            ):
                current_url = "{}/api/v2/events/date?date={}".format(URL, current_date.strftime("%Y%m%d"))
                current_event_response = session.get(url=current_url, headers=headers, timeout=TIMEOUT)
                current_event_response.raise_for_status()

                if current_event_response.status_code == 401:
                    TOKEN = self.renew_token(provider, session)
                content = current_event_response.json()
                self.parse_data(provider, content)

            end_date = current_date + timedelta(days=int(provider["config"]["days"]))
            for offset in range(100, ONCLUSIVE_MAX_OFFSET, 10000):
                print("loop started", offset)
                between_url = "{}/api/v2/events/between?startDate={}&endDate={}&limit={}".format(
                    URL, current_date.strftime("%Y%m%d"), end_date.strftime("%Y%m%d"), offset
                )
                between_event_response = session.get(url=between_url, headers=headers, timeout=TIMEOUT)
                between_event_response.raise_for_status()
                content.append(between_event_response.json())

                if between_event_response.status_code == 401:
                    TOKEN = self.renew_token(provider, session)
                if between_event_response.json() == []:
                    break

            else:
                logger.warning("some items were not fetched due to the limit")

            parser = self.get_feed_parser(provider)

            logger.info("Ingesting events with {} parser".format(parser.__class__.__name__))
            logger.info("Ingesting content: {} ...".format(str(between_event_response.content)[:4000]))

            if hasattr(parser, "parse_http"):
                items = parser.parse_http(content, provider)
            else:
                items = parser.parse(content, provider)

            if isinstance(items, list):
                yield items
            else:
                yield [items]

    def authentication(self, TIMEOUT, session, provider):
        # authntication get token
        auth_url = provider["config"]["url"] + "/api/v2/auth"
        body = {"username": provider["config"]["username"], "password": provider["config"]["password"]}
        resp = session.post(auth_url, body, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        if data.get("token") and data.get("refreshToken"):
            provider["config"]["refreshToken"] = data["refreshToken"]
            superdesk.get_resource_service("ingest_providers").patch(provider["_id"], provider)
            return data["refreshToken"]

    def renew_token(self, provider, session):
        # Need to renew Token
        url = provider["config"]["url"] + "/api/v2/auth/renew"
        body = {"refreshToken": provider["config"]["refreshToken"]}
        renew_response = session.post(url=url, data=body, timeout=5)
        renew_response.raise_for_status()
        if renew_response.status_code == 200:
            new_token = renew_response.json()
            return new_token["token"]
