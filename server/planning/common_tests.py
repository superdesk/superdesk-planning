from planning.tests import TestCase
from .common import get_local_end_of_day, set_actioned_date_to_event
from datetime import datetime, timedelta
from superdesk.utc import utcnow
import pytz


class CommonTestCase(TestCase):
    def test_get_local_end_of_day(self):
        # Australia/Sydney
        # Daylight Savings End
        self.assertUTCEndOfDay(datetime(2017, 4, 1), datetime(2017, 4, 1, 12, 59, 59), 'Australia/Sydney')
        self.assertUTCEndOfDay(datetime(2017, 4, 2), datetime(2017, 4, 2, 13, 59, 59), 'Australia/Sydney')
        # Daylight Savings Start
        self.assertUTCEndOfDay(datetime(2017, 9, 30), datetime(2017, 9, 30, 13, 59, 59), 'Australia/Sydney')
        self.assertUTCEndOfDay(datetime(2017, 10, 1), datetime(2017, 10, 1, 12, 59, 59), 'Australia/Sydney')
        # Daylight Savings End
        self.assertUTCEndOfDay(datetime(2018, 3, 30), datetime(2018, 3, 30, 12, 59, 59), 'Australia/Sydney')
        self.assertUTCEndOfDay(datetime(2018, 4, 1), datetime(2018, 4, 1, 13, 59, 59), 'Australia/Sydney')

        # Europe/Prague
        # Daylight Savings Start
        self.assertUTCEndOfDay(datetime(2017, 3, 25), datetime(2017, 3, 25, 22, 59, 59), 'Europe/Prague')
        self.assertUTCEndOfDay(datetime(2017, 3, 26), datetime(2017, 3, 26, 21, 59, 59), 'Europe/Prague')
        # Daylight Savings End
        self.assertUTCEndOfDay(datetime(2017, 10, 28), datetime(2017, 10, 28, 21, 59, 59), 'Europe/Prague')
        self.assertUTCEndOfDay(datetime(2017, 10, 29), datetime(2017, 10, 29, 22, 59, 59), 'Europe/Prague')
        # Daylight Savings Start
        self.assertUTCEndOfDay(datetime(2018, 3, 24), datetime(2018, 3, 24, 22, 59, 59), 'Europe/Prague')
        self.assertUTCEndOfDay(datetime(2018, 3, 25), datetime(2018, 3, 25, 21, 59, 59), 'Europe/Prague')

    def assertUTCEndOfDay(self, day, result, timezone):
        date = datetime(day.year, day.month, day.day, tzinfo=pytz.timezone(timezone)).date()
        dt = get_local_end_of_day(date, timezone)
        self.assertEqual(
            dt,
            datetime(
                result.year,
                result.month,
                result.day,
                result.hour,
                result.minute,
                result.second,
                tzinfo=pytz.utc
            )
        )

    def test_actioned_day(self):
        # Test to ensure if the multi-day event spans current day,
        # Then, current date should be the actioned date
        now = utcnow()
        updates = {}
        original = {
            'dates': {
                'start': now - timedelta(days=3),
                'end': now + timedelta(days=3),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get('actioned_date').date(), now.date())

        # Test to ensure if the multi-day event is entirely in past,
        # Then, current date should be event start date
        updates = {}
        start = now - timedelta(days=3)
        original = {
            'dates': {
                'start': start,
                'end': now - timedelta(days=2),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates.get('actioned_date').date(), start.date())

        # Test to ensure nothing happens if event is not multi-day
        updates = {}
        original = {
            'dates': {
                'start': datetime(2029, 9, 30),
                'end': datetime(2029, 9, 30, 23, 59),
            }
        }
        set_actioned_date_to_event(updates, original)
        self.assertEqual(updates, {})
