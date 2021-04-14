from planning.feed_parsers.superdesk_event_json import EventJsonFeedParser
import os
from planning.tests import TestCase


class EventJsonFeedParserTestCase(TestCase):

    sample_json = {}

    def setUp(self):
        super().setUp()
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.sample_json = os.path.join(dir_path, 'event_format_sample.json')

    def test_event_json_feed_parser_can_parse(self):
        self.assertEqual(True, EventJsonFeedParser().can_parse(self.sample_json))

    def test_event_json_feed_parser_parse(self):
        with self.app.app_context():
            events = EventJsonFeedParser().parse(self.sample_json)
            self.assertTrue(events[0]['guid'] == '835d5175-a2bc-41ad-a906-baf3f2281a5c')
