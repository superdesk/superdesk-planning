# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#

from bson import ObjectId

from superdesk.flask import g
from superdesk.utc import utcnow
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase
from planning.utils import get_service
from planning.types.unified import UnifiedPlanningResource
from .sync_assignment_coverages import SyncAssignmentCoveragesCommand

now = utcnow()
assignment_id = ObjectId()


class SyncAssignmentCoveragesTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.planning_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()

        # The assignment references a planning item in the legacy resource (SDBELGA-1122)
        await get_service("planning").create([{"_id": "legacy_plan", "guid": "legacy_plan", "planning_date": now}])
        await get_service("assignments").create(
            [
                {
                    "_id": assignment_id,
                    "planning_item": "legacy_plan",
                    "priority": 2,
                    "assigned_to": {"desk": "desk-1", "user": "user-1", "state": "assigned"},
                }
            ]
        )

        # Unified planning item whose coverage points at the assignment but is out of sync
        await self.planning_service.create([{"_id": "plan1", "type": "planning", "dates": {"start": now}}])
        await self.planning_service.mongo_async.update_one(
            {"_id": "plan1"},
            {
                "$set": {
                    "coverages": [
                        {
                            "coverage_id": "cov1",
                            "news_coverage_status": {
                                "qcode": "ncostat:int",
                                "name": "Intended",
                                "label": "Coverage Intended",
                            },
                            "planning": {"scheduled": now, "g2_content_type": "text"},
                            "assigned_to": {"assignment_id": str(assignment_id), "desk": "desk-1"},
                        }
                    ]
                }
            },
        )

    async def _get_coverage_assigned_to(self):
        plan = await self.planning_service.mongo_async.find_one({"_id": "plan1"})
        return plan["coverages"][0]["assigned_to"]

    async def test_sync_coverage_from_assignment(self):
        async with self.app.app_context():
            await SyncAssignmentCoveragesCommand().run(dry_run=False)

            assigned_to = await self._get_coverage_assigned_to()
            self.assertEqual(assigned_to["assignment_id"], str(assignment_id))
            self.assertEqual(assigned_to["user"], "user-1")
            self.assertEqual(assigned_to["state"], "assigned")

    async def test_dry_run_makes_no_changes(self):
        async with self.app.app_context():
            await SyncAssignmentCoveragesCommand().run(dry_run=True)

            assigned_to = await self._get_coverage_assigned_to()
            self.assertIsNone(assigned_to.get("user"))
            self.assertIsNone(assigned_to.get("state"))
