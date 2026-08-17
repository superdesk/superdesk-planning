from unittest import mock

from planning.tests import TestCase
from planning.planning_article_export import get_items, EXPORT_FETCH_PAGE_SIZE


class PlanningArticleExportTest(TestCase):
    planning_items = [
        {
            "_id": "plan1",
            "planning_date": "2016-01-02T14:00:00+0000",
            "type": "planning",
        },
        {
            "_id": "plan2",
            "planning_date": "2016-01-03T14:00:00+0000",
            "type": "planning",
        },
        {
            "_id": "plan3",
            "planning_date": "2016-01-04T14:00:00+0000",
            "type": "planning",
        },
    ]

    event_items = [
        {
            "_id": "event1",
            "dates": {
                "start": "2016-01-02T14:00:00+0000",
                "end": "2016-01-03T14:00:00+0000",
            },
            "type": "event",
        },
        {
            "_id": "event2",
            "dates": {
                "start": "2016-01-04T14:00:00+0000",
                "end": "2016-01-05T14:00:00+0000",
            },
            "type": "event",
        },
        {
            "_id": "event3",
            "dates": {
                "start": "2016-01-06T14:00:00+0000",
                "end": "2016-01-07T14:00:00+0000",
            },
            "type": "event",
        },
    ]

    async def test_get_items_in_supplied_order(self):
        async with self.app.app_context():
            await self.app.data.insert_async("planning", self.planning_items)
            await self.app.data.insert_async("events", self.event_items)

            items = await get_items(["plan1", "plan2", "plan3"], "planning")
            assert items[0]["_id"] == "plan1"
            assert items[1]["_id"] == "plan2"
            assert items[2]["_id"] == "plan3"

            items = await get_items(["plan3", "plan2", "plan1"], "planning")
            assert items[0]["_id"] == "plan3"
            assert items[1]["_id"] == "plan2"
            assert items[2]["_id"] == "plan1"

            items = await get_items(["plan2", "plan1", "plan3"], "planning")
            assert items[0]["_id"] == "plan2"
            assert items[1]["_id"] == "plan1"
            assert items[2]["_id"] == "plan3"

            items = await get_items(["event1", "event2", "event3"], "event")
            assert items[0]["_id"] == "event1"
            assert items[1]["_id"] == "event2"
            assert items[2]["_id"] == "event3"

            items = await get_items(["event3", "event2", "event1"], "event")
            assert items[0]["_id"] == "event3"
            assert items[1]["_id"] == "event2"
            assert items[2]["_id"] == "event1"

            items = await get_items(["event2", "event1", "event3"], "event")
            assert items[0]["_id"] == "event2"
            assert items[1]["_id"] == "event1"
            assert items[2]["_id"] == "event3"

    async def test_get_items_uses_export_page_size(self):
        search_service = mock.AsyncMock()

        async def async_iterator():
            yield {"_id": "plan1", "type": "planning"}

        search_service.search_repos.return_value = async_iterator()
        events_service = mock.AsyncMock()

        def get_service(name):
            if name == "events_planning_search":
                return search_service
            if name == "events":
                return events_service
            raise AssertionError("Unexpected service requested: {}".format(name))

        with mock.patch("planning.planning_article_export.get_resource_service", side_effect=get_service):
            items = await get_items(["plan1"], "planning")

        assert items == [{"_id": "plan1", "type": "planning"}]
        search_service.search_repos.assert_called_once_with(
            "planning",
            {"item_ids": "plan1", "only_future": False},
            page_size=EXPORT_FETCH_PAGE_SIZE,
        )
