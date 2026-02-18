import importlib
from datetime import timedelta

from superdesk import get_resource_service
from superdesk.services import BaseService
from superdesk.utc import utcnow
from planning.tests import TestCase


now = utcnow()
DataUpdate = importlib.import_module("planning.data_updates.00037_20260216-140530_events_planning").DataUpdate


class FixAnpaCategorySchemeTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.data_update = DataUpdate()

    def assertItemsToFix(self, service: BaseService, item_ids: set[str]):
        self.assertEqual(set([item["_id"] for item in self.data_update.iterate_items(service)]), item_ids)

    async def test_upgrade_events(self):
        service: BaseService = get_resource_service("events")
        dates = {"start": now, "end": now + timedelta(hours=1)}
        service.post(
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
            ]
        )

        self.assertItemsToFix(service, {"e2", "e3"})
        self.data_update._fix_events()
        self.assertItemsToFix(service, set())
        events = {event["_id"]: event for event in service.get(req=None, lookup={})}
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
        service: BaseService = get_resource_service("planning")
        service.post(
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
            ]
        )

        self.assertItemsToFix(service, {"p2", "p3", "p4"})
        self.data_update._fix_planning()
        self.assertItemsToFix(service, set())

        planning = {planning["_id"]: planning for planning in service.get(req=None, lookup={})}
        self.assertDictContains(planning["p2"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]})
        self.assertDictContains(planning["p3"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]})
        self.assertDictContains(
            planning["p3"]["coverages"][0]["planning"], {"anpa_category": [{"qcode": "b", "name": "B", "scheme": None}]}
        )
        self.assertDictContains(
            planning["p4"]["coverages"][0]["planning"], {"anpa_category": [{"qcode": "c", "name": "C", "scheme": None}]}
        )

    async def test_upgrade_assignments(self):
        service: BaseService = get_resource_service("assignments")
        service.post(
            [
                {"_id": "a1", "planning_date": now},
                {
                    "_id": "a2",
                    "planning_date": now,
                    "planning": {
                        "scheduled": now,
                        "anpa_category": [{"qcode": "a", "name": "A", "scheme": "categories"}],
                    },
                },
            ]
        )

        self.assertItemsToFix(service, {"a2"})
        self.data_update._fix_assignments()
        self.assertItemsToFix(service, set())
        assignments = {assignment["_id"]: assignment for assignment in service.get(req=None, lookup={})}
        self.assertDictContains(
            assignments["a2"]["planning"], {"anpa_category": [{"qcode": "a", "name": "A", "scheme": None}]}
        )
