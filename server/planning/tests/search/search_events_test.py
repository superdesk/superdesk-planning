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
