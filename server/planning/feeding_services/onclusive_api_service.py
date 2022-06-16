import logging
from datetime import datetime
import requests
from superdesk.io.feeding_services.http_base_service import HTTPFeedingServiceBase
from flask import current_app as app

logger = logging.getLogger(__name__)


class OnclusiveApiService(HTTPFeedingServiceBase):
    """
    Feeding Service class which can read events using HTTP
    """

    NAME = "Onclusive_api"
    label = "Onclusive api feed"
    service = "events"

    fields = []

    HTTP_AUTH = False
    session = requests.Session()

    current_date = datetime.now()

    def _update(self, provider, update):
        """
        Fetch events from external API.

        :param provider: Ingest Provider Details.
        :type provider: dict
        :param update: Any update that is required on provider.
        :type update: dict
        :return: a list of events which can be saved.
        """
        URL = app.config["ONCLUSIVE_URL"]
        USERNAME = app.config["ONCLUSIVE_USERNAME"]
        PASSWORD = app.config["ONCLUSIVE_PASSWORD"]
        TOKEN = app.config["ONCLUSIVE_TOKEN"]
        REF_TOKEN = app.config["ONCLUSIVE_REF_TOKEN"]

        # authntication get token
        if not TOKEN:
            auth_url = URL + "api/v2/auth"
            body = {"username": USERNAME, "password": PASSWORD}
            resp = self.session.post(auth_url, body)

            resp.raise_for_status()
            if resp.status_code == 200 and resp.content:
                data = resp.json()
                if data.get("token") and data.get("refreshToken"):
                    TOKEN = data["token"]
                    REF_TOKEN = data["refreshToken"]

        if TOKEN:
            current_url = "{}/api/v2/events/date?date={}".format(URL, self.current_date.strftime("%Y%m%d"))
            latest_url = "{}/api/v2/events/latest?date={}".format(URL, self.current_date.strftime("%Y%m%d"))
            headers = {"Content-Type": "application/json", "Authorization": "Bearer " + TOKEN}
            current_event_response = self.session.get(url=current_url, headers=headers)
            latest_event_response = self.session.get(url=latest_url, headers=headers)
            current_event_response.raise_for_status()
            latest_event_response.raise_for_status()
            if current_event_response.status_code == 401 and latest_event_response.status_code == 401:
                # Need to renew Token
                url = URL + "api/v2/auth/renew"
                body = {"refreshToken": REF_TOKEN}
                renew_response = self.session.post(url=url, data=body)
                if renew_response.status_code == 200:
                    new_token = renew_response.json()
                    TOKEN = new_token["token"]

            parser = self.get_feed_parser(provider)

            logger.info("Ingesting events with {} parser".format(parser.__class__.__name__))
            logger.info("Ingesting content: {} ...".format(str(current_event_response.content)[:4000]))

            content = current_event_response.json() + latest_event_response.json()

            if hasattr(parser, "parse_http"):
                items = parser.parse_http(content, provider)
            else:
                items = parser.parse(content, provider)

            if isinstance(items, list):
                yield items
            else:
                yield [items]
