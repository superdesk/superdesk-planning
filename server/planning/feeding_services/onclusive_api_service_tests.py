from planning.feed_parsers.onclusive import OnclusiveFeedParser
from .onclusive_api_service import OnclusiveApiService
from unittest.mock import MagicMock
from datetime import datetime, timedelta

import flask
import unittest
import requests_mock


parser = MagicMock(OnclusiveFeedParser)


class OnclusiveApiServiceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.app = flask.Flask(__name__)

    def test_update(self):
        event = {"versioncreated": datetime.fromisoformat("2023-03-01T08:00:00")}
        with self.app.app_context():
            now = datetime.utcnow()
            service = OnclusiveApiService()
            service.get_feed_parser = MagicMock(return_value=parser)
            parser.parse.return_value = [event]

            provider = {
                "_id": "onclusive_api",
                "name": "onclusive",
                "feed_parser": "onclusive_api",
                "config": {"url": "https://api.abc.com", "username": "user", "password": "pass", "days": "30"},
            }

            updates = {}
            with requests_mock.Mocker() as m:
                m.post(
                    "https://api.abc.com/api/v2/auth",
                    json={
                        "token": "tok",
                        "refreshToken": "refresh",
                        "productId": 10,
                    },
                )
                m.get(
                    "https://api.abc.com/api/v2/events/date?date={}".format(now.strftime("%Y%m%d")),
                    json=[{"versioncreated": event["versioncreated"].isoformat()}],
                )  # first returns an item
                m.get("https://api.abc.com/api/v2/events/date", json=[])  # ones won't
                items = list(service._update(provider, updates))
            self.assertIn("tokens", updates)
            self.assertEqual("refresh", updates["tokens"]["refreshToken"])
            self.assertIn("import_finished", updates["tokens"])
            self.assertEqual(updates["last_updated"], updates["tokens"]["next_start"])
            self.assertEqual("fr-CA", items[0][0]["language"])

            provider.update(updates)
            updates = {}
            with requests_mock.Mocker() as m:
                m.post(
                    "https://api.abc.com/api/v2/auth/renew",
                    json={
                        "token": "tok2",
                        "refreshToken": "refresh2",
                    },
                )
                m.get("https://api.abc.com/api/v2/events/latest", json=[])
                list(service._update(provider, updates))
            self.assertEqual("refresh2", updates["tokens"]["refreshToken"])
