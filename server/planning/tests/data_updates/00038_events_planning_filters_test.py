import importlib

from bson import ObjectId

from superdesk.utc import utcnow
from planning.types import SearchItemType
from planning.tests import TestCase

DataUpdate = importlib.import_module("planning.data_updates.00038_20260324-131530_events_planning_filters").DataUpdate


class FixFilterScheduleParamsDataUpdateTestCase(TestCase):
    async def test_upgrade(self):
        mongo_db = self.async_app.mongo.get_db_async(DataUpdate.resource)
        mongo_collection = self.async_app.mongo.get_collection_async(DataUpdate.resource)

        filter_1_id = ObjectId()
        desk_id = ObjectId()

        search_filters = [
            {
                "_id": filter_1_id,
                "name": "Invalid Hourly Schema",
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
                        "frequency": "hourly",
                        "hours": ["00:00"],
                        "hour": 14,
                        "day": 10,
                        "week_days": ["Monday"],
                        "desk": desk_id,
                    },
                ],
            },
        ]
        await mongo_collection.insert_many(search_filters)

        item = await mongo_collection.find_one({"_id": filter_1_id})
        self.assertEqual(
            item["schedules"][0],
            {
                "frequency": "hourly",
                "hours": ["00:00"],
                "hour": 14,
                "day": 10,
                "week_days": ["Monday"],
                "desk": desk_id,
            },
        )
        await DataUpdate().forwards(mongo_collection, mongo_db)
        item = await mongo_collection.find_one({"_id": filter_1_id})
        self.assertEqual(
            item["schedules"][0],
            {
                "frequency": "hourly",
                "hours": [],
                "hour": -1,
                "day": -1,
                "week_days": [],
                "desk": desk_id,
            },
        )
