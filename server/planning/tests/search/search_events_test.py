from datetime import datetime
from zoneinfo import ZoneInfo
from unittest import mock

from superdesk.tests import setup_db_user, utils as test_utils, fixtures
from planning.tests import TestCase, fixtures as planning_fixtures


class SearchEventsTestCase(TestCase):
    headers: list

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.headers = []
        await setup_db_user(self, fixtures.users.admin().to_dict())

    @mock.patch("planning.search.queries.elastic.datetime", wraps=datetime)
    async def test_search_all_day_events_with_negative_timezone_offset(self, mock_datetime):
        mock_datetime.now.return_value = datetime(2026, 10, 21, 20, 30, tzinfo=ZoneInfo("America/Toronto"))
        await test_utils.post_items(
            "events",
            [
                {
                    **planning_fixtures.events.event1(),
                    "dates": {
                        "start": "2026-10-21T00:00:00+0000",
                        "end": "2026-10-21T00:00:00+0000",
                        "timezone": "America/Toronto",
                        "all_day": True,
                    },
                },
                {
                    **planning_fixtures.events.event1(),
                    "_id": "event2",
                    "guid": "event2",
                    "dates": {
                        "start": "2026-10-21T00:00:00+0000",
                        "end": "2026-10-21T00:00:00+0000",
                        "timezone": "America/Toronto",
                        "all_day": True,
                    },
                    "_time_to_be_confirmed": True,
                },
            ],
        )

        async def assert_events_in_result(params: dict) -> None:
            response = await self.test_client.get(
                "/api/events_planning_search", query_string=params, headers=self.headers
            )
            self.assertEqual(response.status_code, 200, await response.get_data(as_text=True))
            data = await response.get_json()
            self.assertEqual(2, data["_meta"]["total"])
            self.assertEqual({"event1", "event2"}, {item["_id"] for item in data["_items"]})

        await assert_events_in_result(dict(only_future=True, time_zone="America/Toronto", repo="combined"))
        await assert_events_in_result(dict(date_filter="today", time_zone="America/Toronto", repo="combined"))
        await assert_events_in_result(dict(date_filter="this_week", time_zone="America/Toronto", repo="combined"))

    @mock.patch("planning.search.queries.elastic.datetime", wraps=datetime)
    async def test_week_filters_use_local_date_across_utc_week_boundary(self, mock_datetime):
        now = datetime(2026, 10, 25, 1, 0, tzinfo=ZoneInfo("UTC"))
        mock_datetime.now.side_effect = lambda tz: now.astimezone(tz)
        dates = {
            "saturday": ("2026-10-24T00:00:00+0000", "2026-10-24T00:00:00+0000", True),
            "sunday": ("2026-10-25T00:00:00+0000", "2026-10-25T00:00:00+0000", True),
            "spanning": ("2026-10-17T00:00:00+0000", "2026-11-02T00:00:00+0000", True),
            "saturday_timed": ("2026-10-25T02:00:00+0000", "2026-10-25T03:00:00+0000", False),
            "sunday_timed": ("2026-10-25T05:30:00+0000", "2026-10-25T06:30:00+0000", False),
        }
        await test_utils.post_items(
            "events",
            [
                {
                    **planning_fixtures.events.event1(),
                    "_id": event_id,
                    "guid": event_id,
                    "dates": {"start": start, "end": end, "tz": "America/Toronto", "all_day": all_day},
                }
                for event_id, (start, end, all_day) in dates.items()
            ],
        )

        for date_filter, expected in (
            ("this_week", {"saturday", "saturday_timed", "spanning"}),
            ("next_week", {"sunday", "sunday_timed", "spanning"}),
        ):
            response = await self.test_client.get(
                "/api/events_planning_search",
                query_string={"date_filter": date_filter, "time_zone": "America/Toronto", "repo": "combined"},
                headers=self.headers,
            )
            self.assertEqual(response.status_code, 200, await response.get_data(as_text=True))
            data = await response.get_json()
            self.assertEqual(expected, {item["_id"] for item in data["_items"]})
            self.assertEqual(len(expected), data["_meta"]["total"])
