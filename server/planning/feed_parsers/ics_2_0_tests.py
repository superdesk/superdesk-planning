
from planning.feed_parsers.ics_2_0 import IcsTwoFeedParser
import os
from icalendar import Calendar
from planning.tests import TestCase


class IcsTwoFeedParserTestCase(TestCase):

    def setUp(self):
        super().setUp()
        dir_path = os.path.dirname(os.path.realpath(__file__))
        calendar = open(os.path.join(dir_path, 'events.ics'))
        self.calendar = Calendar.from_ical(calendar.read())

    def test_ntb_event_xml_feed_parser_can_parse(self):
        self.assertEqual(True, IcsTwoFeedParser().can_parse(self.calendar))

    def test_ntb_event_xml_feed_parser_parse(self):
        with self.app.app_context():
            events = IcsTwoFeedParser().parse(self.calendar)
            self.assertTrue(len(events) >= 2)
