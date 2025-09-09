# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from pytest import mark

from datetime import timedelta

from superdesk import get_resource_service
from superdesk.utc import utcnow
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase
from planning.common import WORKFLOW_STATE
from .delete_spiked_items import delete_spiked_items_handler

now = utcnow()
yesterday = now - timedelta(hours=48)
two_days_ago = now - timedelta(hours=96)

active = {
    "event": {
        "dates": {"start": now - timedelta(hours=1), "end": now},
        "state": WORKFLOW_STATE.SPIKED,
    },
    "overnightEvent": {
        "dates": {"start": yesterday, "end": now},
        "state": WORKFLOW_STATE.SPIKED,
    },
    "plan": {"planning_date": now, "state": WORKFLOW_STATE.SPIKED},
    "coverage": {"planning": {"scheduled": now}},
    "assignment_d1": {
        "workflow_status": "draft",
        "news_coverage_status": {"qcode": "ncostat:int"},
        "planning": {"scheduled": now},
        "assigned_to": {"desk": "d1", "state": "draft"},
    },
    "assignment_d2": {
        "workflow_status": "draft",
        "news_coverage_status": {"qcode": "ncostat:int"},
        "planning": {"scheduled": now},
        "assigned_to": {"desk": "d2", "state": "draft"},
    },
}

expired = {
    "event": {
        "dates": {"start": yesterday, "end": yesterday + timedelta(hours=1)},
        "state": WORKFLOW_STATE.SPIKED,
    },
    "plan": {"planning_date": yesterday, "state": WORKFLOW_STATE.SPIKED},
    "coverage": {"planning": {"scheduled": yesterday}},
    "assignment_d1": {
        "workflow_status": "draft",
        "news_coverage_status": {"qcode": "ncostat:int"},
        "planning": {"scheduled": yesterday},
        "assigned_to": {"desk": "d1", "state": "draft"},
    },
    "assignment_d2": {
        "workflow_status": "draft",
        "news_coverage_status": {"qcode": "ncostat:int"},
        "planning": {"scheduled": yesterday},
        "assigned_to": {"desk": "d2", "state": "draft"},
    },
}


class BaseDeleteSpikedItemsTest(TestCase):
    app_config = {
        **TestCase.app_config.copy(),
        # Expire items that are scheduled more than 24 hours from now
        "PLANNING_DELETE_SPIKED_MINUTES": 1440,
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()

        self.event_service = get_resource_service("events")
        self.planning_service = get_resource_service("planning")
        self.assignment_service = get_resource_service("assignments")

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("desks", fixtures.desks.all_desks())

    async def insert(self, item_type, items):
        service = self.event_service if item_type == "events" else self.planning_service
        await service.post_async(items)

    async def assertDeleteOperation(self, item_type, ids, not_deleted=False):
        service = self.event_service if item_type == "events" else self.planning_service

        for item_id in ids:
            item = await service.find_one_async(guid=item_id, req=None)
            if not_deleted:
                self.assertIsNotNone(item)
            else:
                self.assertIsNone(item)

    async def assertAssignmentDeleted(self, assignment_ids, not_deleted=False):
        for assignment_id in assignment_ids:
            assignment = await self.assignment_service.find_one_async(_id=assignment_id, req=None)
            if not_deleted:
                self.assertIsNotNone(assignment)
            else:
                self.assertIsNone(assignment)

    async def get_assignments_count(self):
        results = await self.assignment_service.find_async({"_id": {"$exists": 1}})
        return await results.count()


class DeleteSpikedItemsTest(BaseDeleteSpikedItemsTest):
    async def test_event(self):
        await self.insert(
            "events",
            [
                {"guid": "e1", **active["event"]},
                {"guid": "e2", **active["overnightEvent"]},
                {"guid": "e3", **expired["event"]},
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("events", ["e3"])
        await self.assertDeleteOperation("events", ["e1", "e2"], not_deleted=True)

    async def test_event_series_expiry_check(self):
        await self.insert(
            "events",
            [
                {"guid": "e1", **active["event"], "recurrence_id": "r123"},
                {"guid": "e2", **active["overnightEvent"], "recurrence_id": "r123"},
                {"guid": "e3", **expired["event"], "recurrence_id": "r123"},
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("events", ["e1", "e2", "e3"], not_deleted=True)

    async def test_event_series_spike_check(self):
        await self.insert(
            "events",
            [
                {"guid": "e1", **expired["event"], "recurrence_id": "r123"},
                {
                    "guid": "e2",
                    "recurrence_id": "r123",
                    "dates": {
                        "start": two_days_ago,
                        "end": two_days_ago + timedelta(hours=1),
                    },
                    "state": "draft",
                },
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("events", ["e1", "e2"], not_deleted=True)

    async def test_event_series_successful_delete(self):
        await self.insert(
            "events",
            [
                {"guid": "e1", **expired["event"], "recurrence_id": "r123"},
                {
                    "guid": "e2",
                    "recurrence_id": "r123",
                    "dates": {
                        "start": two_days_ago,
                        "end": two_days_ago + timedelta(hours=1),
                    },
                    "state": WORKFLOW_STATE.SPIKED,
                },
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("events", ["e1", "e2"])

    async def test_planning(self):
        await self.insert(
            "planning",
            [
                {"guid": "p1", **active["plan"], "coverages": []},
                {"guid": "p2", **active["plan"], "coverages": [active["coverage"]]},
                {
                    "guid": "p3",
                    **active["plan"],
                    "coverages": [expired["coverage"]],
                },
                {
                    "guid": "p4",
                    **active["plan"],
                    "coverages": [active["coverage"], expired["coverage"]],
                },
                {"guid": "p5", **expired["plan"], "coverages": []},
                {
                    "guid": "p6",
                    **expired["plan"],
                    "coverages": [active["coverage"]],
                },
                {
                    "guid": "p7",
                    **expired["plan"],
                    "coverages": [expired["coverage"]],
                },
                {
                    "guid": "p8",
                    **expired["plan"],
                    "coverages": [active["coverage"], expired["coverage"]],
                },
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("planning", ["p1", "p2", "p3", "p4", "p6", "p8"], not_deleted=True)
        await self.assertDeleteOperation("planning", ["p5", "p7"])

    async def test_planning_assignment_deletion(self):
        self.app.data.insert("desks", [{"_id": "d1", "name": "d1"}, {"_id": "d2", "name": "d2"}])
        await self.insert(
            "planning",
            [
                {
                    "guid": "p1",
                    **active["plan"],
                    "coverages": [active["assignment_d1"]],
                },
                {
                    "guid": "p2",
                    **expired["plan"],
                    "coverages": [active["assignment_d2"]],
                },
                {
                    "guid": "p3",
                    **active["plan"],
                    "coverages": [expired["assignment_d1"]],
                },
                {
                    "guid": "p4",
                    **expired["plan"],
                    "coverages": [expired["assignment_d2"]],
                },
            ],
        )

        # Map plannings to assignments
        assignments = {}
        for plan_id in ["p1", "p2", "p3", "p4"]:
            planning = await self.planning_service.find_one_async(req=None, guid=plan_id)
            if planning:
                assignments[plan_id] = planning["coverages"][0]["assigned_to"]["assignment_id"]

        self.assertEqual(await self.get_assignments_count(), 4)
        await delete_spiked_items_handler()

        await self.assertDeleteOperation("planning", ["p1", "p2", "p3"], not_deleted=True)
        print(assignments)
        await self.assertAssignmentDeleted(
            [assignments["p1"], assignments["p2"], assignments["p3"]],
            not_deleted=True,
        )

        await self.assertDeleteOperation("planning", ["p4"])
        await self.assertAssignmentDeleted([assignments["p4"]])

        self.assertEqual(await self.get_assignments_count(), 3)


class DisabledDeleteSpikedItemsTest(BaseDeleteSpikedItemsTest):
    app_config = {
        **BaseDeleteSpikedItemsTest.app_config,
        "PLANNING_DELETE_SPIKED_MINUTES": 0,
    }

    async def test_delete_spike_disabled(self):
        await self.insert(
            "events",
            [
                {"guid": "e1", **active["event"]},
                {"guid": "e2", **active["overnightEvent"]},
                {"guid": "e3", **expired["event"]},
            ],
        )
        await self.insert(
            "planning",
            [
                {"guid": "p1", **active["plan"], "coverages": []},
                {"guid": "p2", **active["plan"], "coverages": [active["coverage"]]},
                {
                    "guid": "p3",
                    **active["plan"],
                    "coverages": [expired["coverage"]],
                },
                {
                    "guid": "p4",
                    **active["plan"],
                    "coverages": [active["coverage"], expired["coverage"]],
                },
                {"guid": "p5", **expired["plan"], "coverages": []},
                {
                    "guid": "p6",
                    **expired["plan"],
                    "coverages": [active["coverage"]],
                },
                {
                    "guid": "p7",
                    **expired["plan"],
                    "coverages": [expired["coverage"]],
                },
                {
                    "guid": "p8",
                    **expired["plan"],
                    "coverages": [active["coverage"], expired["coverage"]],
                },
            ],
        )
        await delete_spiked_items_handler()
        await self.assertDeleteOperation("events", ["e1", "e2", "e3"], not_deleted=True)
        await self.assertDeleteOperation("planning", ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"], not_deleted=True)
