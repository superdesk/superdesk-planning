from planning.tests import TestCase
from .common import get_local_end_of_day
from datetime import datetime
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
