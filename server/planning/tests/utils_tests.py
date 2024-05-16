from planning.tests import TestCase
from datetime import datetime
from planning.utils import get_event_formatted_dates
from planning.search.queries import elastic


class TestGetEventFormattedDates(TestCase):
    def test_multi_day_event(self):
        start = datetime(2024, 5, 28, 5, 00, 00)
        end = datetime(2024, 5, 29, 6, 00, 00)
        event = {"dates": {"start": start, "end": end}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "05:00 28/05/2024 - 06:00 29/05/2024")

    def test_all_day_event(self):
        start = datetime(2024, 4, 27, 22, 00, 00)
        end = datetime(2024, 4, 28, 21, 59, 59)
        event = {"dates": {"start": start, "end": end}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "ALL DAY 27/04/2024")

    def test_same_start_end(self):
        start = datetime(2024, 4, 1, 14, 45)
        end = datetime(2024, 4, 1, 14, 45)
        event = {"dates": {"start": start, "end": end}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "14:45 01/04/2024")

    def test_dates_same_and_different_time(self):
        start = datetime(2024, 5, 28, 6, 00, 00)
        end = datetime(2024, 5, 28, 5, 00, 00)
        event = {"dates": {"start": start, "end": end}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "06:00 - 05:00, 28/05/2024")


class TestDateRangeFunctions(TestCase):
    def get_start_date_and_weekday(self, start_date_str):
        start_date = datetime.strptime(start_date_str.split("||")[0], "%Y-%m-%d")
        return start_date.weekday()

    def test_start_of_next_week(self):
        # Test with default start_of_week
        start_date_str = elastic.start_of_next_week()
        expected_weekday = self.get_start_date_and_weekday(start_date_str)
        self.assertEqual(expected_weekday, 6)  # Sunday

        # Test with default start_of_week = 1
        start_date_str = elastic.start_of_next_week(start_of_week=1)
        expected_weekday = self.get_start_date_and_weekday(start_date_str)
        self.assertEqual(expected_weekday, 0)  # Monday

    def test_end_of_next_week(self):
        # Test with default start_of_week
        start_date = datetime(2024, 5, 6)  # Assuming today is May 6, 2024 (Sunday)
        end_date_str = elastic.end_of_next_week(date=start_date)
        expected_weekday = self.get_start_date_and_weekday(end_date_str)
        self.assertEqual(expected_weekday, 6)  # Sunday

        # Test with default start_of_week = 1
        start_date = datetime(2024, 5, 6)  # Assuming today is May 6, 2024 (Sunday)
        end_date_str = elastic.end_of_next_week(date=start_date, start_of_week=1)
        expected_weekday = self.get_start_date_and_weekday(end_date_str)
        self.assertEqual(expected_weekday, 0)  # Monday

    def test_events_within_current_week(self):
        # Test events that start and end within the current week
        start_date = datetime(2024, 5, 15)  # Assuming today is May 15, 2024 (Wed)
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-13||/d")
        self.assertEqual(end, "2024-05-20||/d")

    def test_events_within_current_week_monday(self):
        # Test case for Monday
        start_date = datetime(2024, 5, 13)  # May 13, 2024 is a Monday
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-13||/d")
        self.assertEqual(end, "2024-05-20||/d")

    def test_events_within_current_week_sunday(self):
        # Test case for Sunday
        start_date = datetime(2024, 5, 19)  # May 19, 2024 is a Sunday
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-20||/d")
        self.assertEqual(end, "2024-05-27||/d")
