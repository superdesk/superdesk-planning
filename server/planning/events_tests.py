import unittest
from planning.events import generate_recurring_dates
import datetime
import pytz


class EventTestCase(unittest.TestCase):
    def test_recurring_dates_generation(self):
        # Every other thurdsay and friday afternoon on January 2016
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 1, 15, 0),
            frequency='WEEKLY',
            byday='TH FR',
            interval=2,
            until=datetime.datetime(2016, 2, 1),
            endRepeatMode='until',
        )), [
            datetime.datetime(2016, 1, 1, 15, 0),  # friday 1st
            datetime.datetime(2016, 1, 14, 15, 0),  # thursday 14th
            datetime.datetime(2016, 1, 15, 15, 0),  # friday 15th
            datetime.datetime(2016, 1, 28, 15, 0),  # thursday 28th
            datetime.datetime(2016, 1, 29, 15, 0),  # friday 29th
        ])
        # Every working day
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 1),
            frequency='WEEKLY',
            byday='MO TU WE TH FR',
            count=5,
            endRepeatMode='count',
        )), [
            datetime.datetime(2016, 1, 1),  # friday
            datetime.datetime(2016, 1, 4),  # monday
            datetime.datetime(2016, 1, 5),
            datetime.datetime(2016, 1, 6),
            datetime.datetime(2016, 1, 7),
        ])
        # Next 4 Summer Olympics
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 1, 2),
            frequency='YEARLY',
            interval=4,
            count=4,
            endRepeatMode='count',
        )), [
            datetime.datetime(2016, 1, 2),
            datetime.datetime(2020, 1, 2),
            datetime.datetime(2024, 1, 2),
            datetime.datetime(2028, 1, 2)
        ])
        # All my birthdays
        my_birthdays = generate_recurring_dates(
            start=datetime.datetime(1989, 12, 13),
            frequency='YEARLY',
            endRepeatMode='unlimited',
        )
        self.assertTrue(datetime.datetime(1989, 12, 13) in my_birthdays)
        self.assertTrue(datetime.datetime(2016, 12, 13) in my_birthdays)
        self.assertTrue(datetime.datetime(9999, 12, 13) in my_birthdays)
        # Time zone
        self.assertEquals(list(generate_recurring_dates(
            start=datetime.datetime(2016, 11, 17, 23, 00),
            frequency='WEEKLY',
            byday='FR',
            count=3,
            endRepeatMode='count',
            tz=pytz.timezone('Europe/Berlin')
        )), [
            datetime.datetime(2016, 11, 17, 23, 00),  # it's friday in Berlin
            datetime.datetime(2016, 11, 24, 23, 00),  # it's friday in Berlin
            datetime.datetime(2016, 12, 1, 23, 00),  # it's friday in Berlin
        ])
