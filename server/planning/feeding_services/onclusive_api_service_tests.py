import flask
import unittest
import responses

from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
from planning.feed_parsers.onclusive import OnclusiveFeedParser

from .onclusive_api_service import OnclusiveApiService


parser = MagicMock(OnclusiveFeedParser)


class OnclusiveApiServiceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.app = flask.Flask(__name__)
        self.service = OnclusiveApiService()
        self.service.get_feed_parser = MagicMock(return_value=parser)
        event = {"versioncreated": datetime(2023, 3, 1, 8, 0, 0)}

        parser.parse.return_value = [
            event.copy(),
        ]

        # for requests.json we need to convert datetime to string
        self.event = {"versioncreated": event["versioncreated"].isoformat()}

        self.provider = {
            "_id": "onclusive_api",
            "name": "onclusive",
            "feed_parser": "onclusive_api",
            "config": {"url": "https://api.abc.com", "username": "user", "password": "pass", "days": "30"},
        }

    @responses.activate
    @patch("planning.feeding_services.onclusive_api_service.touch")
    def test_update(self, lock_touch):
        responses.post(
            url="https://api.abc.com/api/v2/auth",
            json={
                "token": "tok",
                "refreshToken": "refresh",
                "productId": 10,
            },
        )

        now = datetime.now()
        responses.get(
            "https://api.abc.com/api/v2/events/date?date={}".format(now.strftime("%Y%m%d")),
            json=[self.event],
        )  # first returns an item
        responses.get("https://api.abc.com/api/v2/events/date", json=[])  # ones won't

        with self.app.app_context():
            updates = {}
            items = list(self.service._update(self.provider, updates))
            self.assertIn("tokens", updates)
            self.assertEqual("refresh", updates["tokens"]["refreshToken"])
            self.assertIn("import_finished", updates["tokens"])
            self.assertEqual(updates["last_updated"], updates["tokens"]["next_start"])
            self.assertEqual("fr-CA", items[0][0]["language"])

            self.provider.update(updates)
            updates = {}
            responses.post(
                "https://api.abc.com/api/v2/auth/renew",
                json={
                    "token": "tok2",
                    "refreshToken": "refresh2",
                },
            )
            responses.get("https://api.abc.com/api/v2/events/latest", json=[])
            list(self.service._update(self.provider, updates))
            self.assertEqual("refresh2", updates["tokens"]["refreshToken"])

    @patch("planning.feeding_services.onclusive_api_service.touch")
    def test_reingest(self, lock_touch):
        with self.app.app_context():
            start = datetime.now() - timedelta(days=30)
            self.provider["config"]["days_to_reingest"] = "30"
            self.provider["config"]["days_to_ingest"] = "10"
            updates = {}
            with responses.RequestsMock() as rsps:  # checks if all requests were fired
                rsps.add(
                    responses.POST,
                    url="https://api.abc.com/api/v2/auth",
                    json={
                        "token": "tok",
                        "refreshToken": "refresh",
                        "productId": 10,
                    },
                )

                for i in range(0, 10):
                    rsps.add(
                        responses.GET,
                        "https://api.abc.com/api/v2/events/date?limit=2000&date={}".format(
                            (start + timedelta(days=i)).strftime("%Y%m%d")
                        ),
                        json=[self.event],
                    )

                items = list(self.service._update(self.provider, updates))
                assert 10 == len(items)
                assert 1 == len(items[0])
                assert items[0][0]["versioncreated"].isoformat() > self.event["versioncreated"]
                assert updates["tokens"]["import_finished"]
                assert not updates["tokens"]["reingesting"]
