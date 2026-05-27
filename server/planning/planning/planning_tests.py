from datetime import datetime
import pytz
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase


class DuplicateCoverageTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        self.app.data.insert(
            "planning",
            [
                {
                    "_id": "plan1",
                    "guid": "plan1",
                    "_etag": "1234",
                    "slugline": "test slugline",
                    "coverages": [
                        {
                            "coverage_id": "cov1",
                            "planning": {
                                "g2_content_type": "text",
                                "slugline": "coverage slugline",
                                "ednote": "test coverage, I want 250 words",
                                "scheduled": "2029-10-12T14:00:00+0000",
                            },
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "assigned_to": {
                                "user": fixtures.users.ADMIN_USER_ID,
                                "desk": "desk1",
                                "state": "in_progress",
                            },
                        }
                    ],
                }
            ],
        )

    async def test_duplicate(self):
        updated_plan, new_coverage = await get_resource_service("planning").duplicate_coverage_for_article_rewrite(
            "plan1",
            "cov1",
            {
                "planning": {
                    "slugline": "new slugline",
                    "scheduled": datetime(2029, 10, 13, 15, 00, tzinfo=pytz.UTC),
                },
                "assigned_to": {
                    "user": fixtures.users.ADMIN_USER_ID,
                    "desk": "desk2",
                    "state": "in_progress",
                },
                "news_coverage_status": {"qcode": "ncostat:onreq"},
            },
        )

        self.assertEqual(updated_plan["_id"], "plan1")
        self.assertNotEqual(updated_plan["_etag"], "1234")
        self.assertEqual(len(updated_plan["coverages"]), 2)

        self.assertEqual(new_coverage["planning"]["slugline"], "new slugline")
        self.assertEqual(new_coverage["planning"]["scheduled"], datetime(2029, 10, 13, 15, 00, tzinfo=pytz.UTC))
        self.assertEqual(new_coverage["assigned_to"]["user"], fixtures.users.ADMIN_USER_ID)
        self.assertEqual(new_coverage["assigned_to"]["desk"], "desk2")
        self.assertEqual(new_coverage["assigned_to"]["state"], "in_progress")
        self.assertEqual(new_coverage["news_coverage_status"], {"qcode": "ncostat:onreq"})

    async def test_duplicate_coverage_not_found(self):
        try:
            await get_resource_service("planning").duplicate_coverage_for_article_rewrite("plan1", "cov2", {})
        except SuperdeskApiError as e:
            self.assertEqual(e.status_code, 400)
            self.assertEqual(e.message, "Coverage does not exist")
            return

        self.assertFalse("Failed to raise an exception")

    async def test_duplicate_planning_not_found(self):
        try:
            await get_resource_service("planning").duplicate_coverage_for_article_rewrite("plan2", "cov1", {})
        except SuperdeskApiError as e:
            self.assertEqual(e.status_code, 400)
            self.assertEqual(e.message, "Planning does not exist")
            return

        self.assertFalse("Failed to raise an exception")


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
            "slugline": "original slugline",
            "coverages": [
                {
                    "coverage_id": "coverage_keep_assignment",
                    "workflow_status": "draft",
                    "assigned_to": {"assignment_id": str(assignment_id)},
                }
            ],
        }
        self.app.data.insert("planning", [original])
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

        await planning_service.patch_async(
            "plan_keep_assignment",
            {"slugline": "updated slugline"},
        )

        assignment = await assignments_service.find_one_async(req=None, _id=assignment_id)
        self.assertIsNotNone(assignment)
