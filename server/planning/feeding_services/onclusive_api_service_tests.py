from planning.feeding_services.onclusive_api_service import OnclusiveApiService
from planning.tests import TestCase


class OnclusiveApiServiceTestCase(TestCase):
    def setUp(self):
        super().setUp()

    def test_update(self):
        with self.app.app_context():

            service = OnclusiveApiService()
            provider = {
                "_id": "onclusive_api",
                "name": "onclusive",
                "feed_parser": "onclusive_api",
                "config": {"url": "https://api.abc.com", "username": "user", "password": "pass", "days": "30"},
            }
            with self.assertRaises(Exception) as error:
                list(service._update(provider, {}))
            self.assertEqual(
                "404 Client Error: Not Found for url: https://api.abc.com/api/v2/auth", error.exception.args[0]
            )
