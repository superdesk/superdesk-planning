from planning.feeding_services.event_http_service import EventHTTPFeedingService
from planning.tests import TestCase


class EventHTTPFeedingServiceTestCase(TestCase):

    def setUp(self):
        super().setUp()

    def test_update(self):
        with self.app.app_context():

            service = EventHTTPFeedingService()
            provider = {
                'feed_parser': 'ics20',
                'config': {
                    'url': 'https://gist.github.com/vied12/9efa0655704c05b6e442c581c9eb1f89/' +
                    'raw/539d2911052f5d03713811ebe19ca594391d6b80/event.ics',
                }
            }
            events = list(service._update(provider, None))
            self.assertEqual(len(events), 1)

    def test_update_ntb(self):
        with self.app.app_context():

            service = EventHTTPFeedingService()
            provider = {
                'feed_parser': 'ntb_event_xml',
                'config': {
                    'url': 'https://gist.github.com/vied12/d390cd5f245faa8311f70562a71e7820/' +
                    'raw/0f74b78c124482d6c897dcfc24202981cd4428b2/NTBEvent.xml',
                }
            }
            events = list(service._update(provider, None))
            self.assertEqual(len(events), 1)
