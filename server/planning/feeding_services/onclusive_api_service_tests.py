from planning.tests import TestCase
from .onclusive_api_service import OnclusiveApiService

import flask
import unittest
import requests_mock


class OnclusiveApiServiceTestCase(unittest.TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.app = flask.Flask(__name__)

    def test_update(self):
        with self.app.app_context():

            service = OnclusiveApiService()
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
                    },
                )
                m.get("https://api.abc.com/api/v2/events/between", json=[])
                list(service._update(provider, updates))
            self.assertIn("tokens", updates)
            self.assertEqual("refresh", updates["tokens"]["refreshToken"])
            self.assertIn("import_finished", updates["tokens"])

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
