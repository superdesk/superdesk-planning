import importlib
from datetime import timedelta

from bson import ObjectId

from superdesk.core.resources import AsyncResourceService
from superdesk.utc import utcnow
from planning.types import EventResourceModel, PlanningResourceModel, AssignmentResourceModel
from planning.tests import TestCase


now = utcnow()
DataUpdate = importlib.import_module("planning.data_updates.00037_20260216-140530_events_planning").DataUpdate


class FixAnpaCategorySchemeTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.data_update = DataUpdate()

    async def assertItemsToFix(self, service: AsyncResourceService, item_ids: set[str]):
        self.assertEqual(set([item["_id"] async for item in self.data_update.iterate_items(service)]), item_ids)

    async def test_upgrade_events(self):
        service = EventResourceModel.get_service()
        dates = {"start": now, "end": now + timedelta(hours=1)}
        await self.app.data.insert_async(
            "events",
            [
                {"_id": "e1", "dates": dates},
                {"_id": "e2", "dates": dates, "anpa_category": [{"qcode": "a", "name": "A", "scheme": "categories"}]},
                {
                    "_id": "e3",
                    "dates": dates,
                    "anpa_category": [
                        {"qcode": "a", "name": "A", "scheme": "categories"},
                        {"qcode": "b", "name": "B"},
                        {"qcode": "c", "name": "C", "scheme": "test"},
                    ],
                },
            ],
        )

        await self.assertItemsToFix(service, {"e2", "e3"})
        await self.data_update._fix_events()
        await self.assertItemsToFix(service, set())
        events = await service.get_all_map_raw()
        self.assertDictContains(events["e2"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]})
        self.assertDictContains(
            events["e3"],
            {
                "anpa_category": [
                    {"qcode": "a", "name": "A", "scheme": None},
                    {"qcode": "b", "name": "B"},
                    {"qcode": "c", "name": "C", "scheme": None},
                ]
            },
        )

    async def test_upgrade_planning(self):
        service = PlanningResourceModel.get_service()
        await self.app.data.insert_async(
            "planning",
            [
                {"_id": "p1", "planning_date": now},
                {
                    "_id": "p2",
                    "planning_date": now,
                    "anpa_category": [{"qcode": "a", "name": "A", "scheme": "categories"}],
                },
                {
                    "_id": "p3",
                    "planning_date": now,
                    "anpa_category": [{"qcode": "a", "name": "A", "scheme": "categories"}],
                    "coverages": [
                        {
                            "coverage_id": "c1",
                            "planning": {
                                "anpa_category": [{"qcode": "b", "name": "B", "scheme": "categories"}],
                            },
                        }
                    ],
                },
                {
                    "_id": "p4",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c2",
                            "planning": {
                                "anpa_category": [{"qcode": "c", "name": "C", "scheme": "categories"}],
                            },
                        }
                    ],
                },
            ],
        )

        await self.assertItemsToFix(service, {"p2", "p3", "p4"})
        await self.data_update._fix_planning()
        await self.assertItemsToFix(service, set())

        planning = await service.get_all_map_raw()
        self.assertDictContains(planning["p2"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]})
        self.assertDictContains(planning["p3"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]})
        self.assertDictContains(
            planning["p3"]["coverages"][0]["planning"], {"anpa_category": [{"qcode": "b", "name": "B", "scheme": None}]}
        )
        self.assertDictContains(
            planning["p4"]["coverages"][0]["planning"], {"anpa_category": [{"qcode": "c", "name": "C", "scheme": None}]}
        )

    async def test_upgrade_assignments(self):
        service = AssignmentResourceModel.get_service()
        oids = [ObjectId(), ObjectId()]
        self.app.data.insert(
            "assignments",
            [
                {"_id": oids[0], "planning_date": now},
                {
                    "_id": oids[1],
                    "planning_date": now,
                    "planning": {
                        "scheduled": now,
                        "anpa_category": [{"qcode": "a", "name": "A", "scheme": "categories"}],
                    },
                },
            ],
        )

        await self.assertItemsToFix(service, {str(oids[1])})
        await self.data_update._fix_assignments()
        await self.assertItemsToFix(service, set())
        assignments = await service.get_all_map_raw()
        self.assertDictContains(
            assignments[oids[1]]["planning"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]}
        )
