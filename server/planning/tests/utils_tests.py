import pytz
from dateutil.parser import parse as parse_datetime

from planning.tests import TestCase
from datetime import datetime
from planning.utils import get_event_formatted_dates
from planning.search.queries import elastic
from planning.search.queries import common, combined


class TestGetEventFormattedDates(TestCase):
    def test_multi_day_event(self):
        start = datetime(2024, 5, 28, 5, 00, 00, tzinfo=pytz.UTC)
        end = datetime(2024, 5, 29, 6, 00, 00, tzinfo=pytz.UTC)
        event = {"dates": {"start": start, "end": end, "tz": "Asia/Calcutta"}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "10:30 28/05/2024 - 11:30 29/05/2024")

    def test_all_day_event(self):
        start = datetime(2024, 4, 27, 18, 30, 00, tzinfo=pytz.UTC)
        end = datetime(2024, 4, 28, 18, 29, 59, tzinfo=pytz.UTC)
        event = {"dates": {"start": start, "end": end, "tz": "Asia/Calcutta"}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "ALL DAY 28/04/2024")

    def test_same_start_end(self):
        start = datetime(2024, 4, 1, 14, 45, tzinfo=pytz.UTC)
        end = datetime(2024, 4, 1, 14, 45, tzinfo=pytz.UTC)
        event = {"dates": {"start": start, "end": end, "tz": "Asia/Calcutta"}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "20:15 01/04/2024")

    def test_dates_same_and_different_time(self):
        start = datetime(2024, 5, 28, 5, 00, 00, tzinfo=pytz.UTC)
        end = datetime(2024, 5, 28, 6, 00, 00, tzinfo=pytz.UTC)
        event = {"dates": {"start": start, "end": end, "tz": "Asia/Calcutta"}}
        result = get_event_formatted_dates(event)
        self.assertEqual(result, "10:30 - 11:30, 28/05/2024")


class TestDateRangeFunctions(TestCase):
    def get_weekday(self, start_date_str):
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d")
        return start_date.weekday()

    def test_start_of_next_week(self):
        # Test with default start_of_week
        start_date_str = elastic.start_of_next_week()
        expected_weekday = self.get_weekday(start_date_str)
        self.assertEqual(expected_weekday, 6)  # Sunday

        # Test with default start_of_week = 1
        start_date_str = elastic.start_of_next_week(start_of_week=1)
        expected_weekday = self.get_weekday(start_date_str)
        self.assertEqual(expected_weekday, 0)  # Monday

    def test_end_of_next_week(self):
        # Test with default start_of_week
        start_date = datetime(2024, 5, 6)  # Assuming today is May 6, 2024 (Sunday)
        end_date_str = elastic.end_of_next_week(date=start_date)
        expected_weekday = self.get_weekday(end_date_str)
        self.assertEqual(expected_weekday, 6)  # Sunday

        # Test with default start_of_week = 1
        start_date = datetime(2024, 5, 6)  # Assuming today is May 6, 2024 (Sunday)
        end_date_str = elastic.end_of_next_week(date=start_date, start_of_week=1)
        expected_weekday = self.get_weekday(end_date_str)
        self.assertEqual(expected_weekday, 0)  # Monday

    def test_events_within_current_week(self):
        # Test events that start and end within the current week
        start_date = datetime(2024, 5, 15)  # Assuming today is May 15, 2024 (Wed)
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-13")
        self.assertEqual(end, "2024-05-20")

    def test_events_within_current_week_monday(self):
        # Test case for Monday
        start_date = datetime(2024, 5, 13)  # May 13, 2024 is a Monday
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-13")
        self.assertEqual(end, "2024-05-20")

    def test_events_within_current_week_sunday(self):
        # Test case for Sunday
        start_date = datetime(2024, 5, 19)  # May 19, 2024 is a Sunday
        start = elastic.start_of_this_week(date=start_date, start_of_week=1)
        end = elastic.start_of_next_week(date=start_date, start_of_week=1)

        self.assertEqual(start, "2024-05-13")
        self.assertEqual(end, "2024-05-20")


class TestCreatedDateSearch(TestCase):
    def test_get_created_date_params_preserves_timestamps(self):
        params = {
            "created_start_date": "2026-04-08T22:00:00+0000",
            "created_end_date": "2026-04-10T21:59:59+0000",
        }
        created_start_date, created_end_date = common.get_created_date_params(params)

        self.assertEqual(parse_datetime(created_start_date), parse_datetime(params["created_start_date"]))
        self.assertEqual(parse_datetime(created_end_date), parse_datetime(params["created_end_date"]))

    def test_combined_search_created_date_adds_created_range(self):
        query = elastic.ElasticQuery()

        params = {
            "created_start_date": "2026-04-08T22:00:00+0000",
            "created_end_date": "2026-04-10T21:59:59+0000",
        }

        combined.search_created_date(params, query)

        filters = query.build()["query"]["bool"]["filter"]
        expected_start, expected_end = common.get_created_date_params(params)

        self.assertTrue(any(item.get("range", {}).get("_created", {}).get("gte") == expected_start for item in filters))
        self.assertTrue(any(item.get("range", {}).get("_created", {}).get("lte") == expected_end for item in filters))
