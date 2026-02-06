import importlib

from bson import ObjectId
from bson.errors import InvalidId

from superdesk.utc import utcnow
from planning.types import SearchItemType, EventPlanningFilter
from planning.tests import TestCase

DataUpdate = importlib.import_module("planning.data_updates.00036_20260206-095639_events_planning_filters").DataUpdate


class FixFilterIdsDataUpdateTestCase(TestCase):
    async def test_upgrade(self):
        mongo_db = self.async_app.mongo.get_db_async(DataUpdate.resource)
        mongo_collection = self.async_app.mongo.get_collection_async(DataUpdate.resource)
        service = EventPlanningFilter.get_service()

        filter_1_id = ObjectId()
        filter_2_id = "abcd-something-not-working"

        search_filters = [
            {
                "_id": filter_1_id,
                "name": "Valid ID",
                "item_type": SearchItemType.EVENT,
                "_created": utcnow(),
                "_updated": utcnow(),
                "_type": "events_planning_filters",
                "_etag": "a28d1efb44ea8aec575e35ccc239026c96351aaa",
                "original_creator": ObjectId(),
                "version_creator": ObjectId(),
                "params": {"calendars": [{"name": "finance", "qcode": "finance"}]},
                "schedules": [
                    {
                        "frequency": "daily",
                        "hours": ["14:30", "08:05"],
                        "hour": 14,
                        "day": 10,
                        "week_days": ["Monday"],
                        "desk": ObjectId(),
                    }
                ],
            },
            {
                "_id": filter_2_id,
                "name": "Invalid ID",
                "item_type": SearchItemType.PLANNING,
                "_created": utcnow(),
                "_updated": utcnow(),
                "_type": "events_planning_filters",
                "_etag": "a28d1efb44ea8aec575e35ccc239026c96351aab",
                "original_creator": ObjectId(),
                "version_creator": ObjectId(),
                "params": {"urgency": {"qcode": 2, "name": "2"}},
                "schedules": [
                    {
                        "frequency": "daily",
                        "hours": ["14:30", "08:05"],
                        "hour": 14,
                        "day": 10,
                        "week_days": ["Tuesday"],
                        "desk": ObjectId(),
                    }
                ],
            },
        ]
        await mongo_collection.insert_many(search_filters)

        with self.assertRaises(InvalidId):
            await service.get_all().asend(None)

        item_ids = {item["_id"] async for item in mongo_collection.find({})}
        self.assertEqual(item_ids, {filter_1_id, filter_2_id})

        await DataUpdate().forwards(mongo_collection, mongo_db)
        await service.get_all().asend(None)
        items = {item["_id"]: item async for item in mongo_collection.find({})}

        new_filter_2_id = next((item_id for item_id in items.keys() if item_id != filter_1_id), None)
        self.assertNotEqual(set(items.keys()), {filter_1_id, filter_2_id})
        self.assertEqual(set(items.keys()), {filter_1_id, new_filter_2_id})

        self.assertDictEqual(items[filter_1_id], search_filters[0])
        self.assertDictEqual(items[new_filter_2_id], {**search_filters[1], "_id": new_filter_2_id})
