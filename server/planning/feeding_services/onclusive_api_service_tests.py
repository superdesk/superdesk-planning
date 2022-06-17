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
                "name": "onclusiveapi",
                "feed_parser": "onclusiveapi",
            }
            events = list(service.update(provider, {}))
            self.assertEqual(len(events), 1)
