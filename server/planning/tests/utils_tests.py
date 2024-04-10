from planning.tests import TestCase
from datetime import datetime
from planning.utils import get_event_formatted_dates


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
