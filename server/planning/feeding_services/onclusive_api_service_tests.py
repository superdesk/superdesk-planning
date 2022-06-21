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
                "feed_parser": "onclusiveapi",
                "config": {"url": "https://api.abc.com/", "username": "user", "password": "pass"},
            }
            self.assertEqual(list(service._update(provider, {})), [])
