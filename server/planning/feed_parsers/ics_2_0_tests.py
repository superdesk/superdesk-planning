from planning.feed_parsers.ics_2_0 import IcsTwoFeedParser
import os
from icalendar import Calendar
from eve.utils import config
from planning.tests import TestCase
from datetime import datetime, timezone
import mock
from pytz import timezone as pytimezone


def mock_utcnow():
    localtz = pytimezone(config.DEFAULT_TIMEZONE)
    return localtz.localize(datetime(2018, 2, 20, 10, 10))


class IcsTwoFeedParserTestCase(TestCase):
    vocab = [{'_id': 'eventoccurstatus', 'items': [{
        "is_active": True,
        "qcode": "eocstat:eos5",
        "name": "Planned, occurs certainly"
    }]}]

    def setUp(self):
        super().setUp()
        self.app.data.insert('vocabularies', self.vocab)
        dir_path = os.path.dirname(os.path.realpath(__file__))
        calendar = open(os.path.join(dir_path, 'events.ics'))
        self.calendar = Calendar.from_ical(calendar.read())

    def test_event_ical_feed_parser_can_parse(self):
        self.assertEqual(True, IcsTwoFeedParser().can_parse(self.calendar))

    def test_event_ical_feed_parser_parse(self):
        with self.app.app_context():
            events = IcsTwoFeedParser().parse(self.calendar)
            self.assertTrue(len(events) >= 2)

    @mock.patch('planning.feed_parsers.ics_2_0.utcnow', mock_utcnow)
    def test_parl_ical(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        calendar = open(os.path.join(dir_path, 'parl_cal.ics'))
        self.calendar = Calendar.from_ical(calendar.read())
        with self.app.app_context():
            events = IcsTwoFeedParser().parse(self.calendar)
            self.assertTrue(len(events) >= 2)
            self.assertEqual(events[0].get('dates').get('start'), datetime(2018, 3, 1, 23, tzinfo=timezone.utc))
            self.assertEqual(events[0].get('dates').get('end'),
                             datetime(2018, 3, 2, 22, 59, 59, 0, tzinfo=timezone.utc))

    @mock.patch('planning.feed_parsers.ics_2_0.utcnow', mock_utcnow)
    def test_aus_timezone_parl_ical(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        calendar = open(os.path.join(dir_path, 'parl_cal.ics'))
        self.calendar = Calendar.from_ical(calendar.read())
        with self.app.app_context():
            self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
            events = IcsTwoFeedParser().parse(self.calendar)
            self.assertTrue(len(events) >= 2)
            self.assertEqual(events[0].get('dates').get('start'), datetime(2018, 3, 1, 13, tzinfo=timezone.utc))
            self.assertEqual(events[0].get('dates').get('end'),
                             datetime(2018, 3, 2, 12, 59, 59, 0, tzinfo=timezone.utc))
