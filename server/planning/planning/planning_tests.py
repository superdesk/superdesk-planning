from datetime import datetime
import pytz
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase


class RemovedAssignmentsTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()

    async def test_non_coverage_update_does_not_remove_assignment(self):
        planning_service = get_resource_service("planning")
        assignments_service = get_resource_service("assignments")
        assignment_id = ObjectId()

        original = {
            "_id": "plan_keep_assignment",
            "type": "planning",
            "dates": {"start": datetime(2029, 10, 12, 14, 00, tzinfo=pytz.UTC)},
            "slugline": "original slugline",
            "coverages": [
                {
                    "coverage_id": "coverage_keep_assignment",
                    "workflow_status": "draft",
                    "news_coverage_status": {
                        "qcode": "ncostat:int",
                        "name": "coverage intended",
                        "label": "Planned",
                    },
                    "assigned_to": {"assignment_id": str(assignment_id)},
                }
            ],
        }
        self.app.data.insert(
            "assignments",
            [
                {
                    "_id": assignment_id,
                    "planning_item": "plan_keep_assignment",
                    "coverage_item": "coverage_keep_assignment",
                    "assigned_to": {"state": "draft"},
                }
            ],
        )
        await self.app.data.insert_async("planning", [original])

        await planning_service.patch_async(
            "plan_keep_assignment",
            {"slugline": "updated slugline"},
        )

        assignment = await assignments_service.find_one_async(req=None, _id=assignment_id)
        self.assertIsNotNone(assignment)
