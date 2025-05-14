from datetime import datetime
import pytz

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
            self.assertEquals(e.status_code, 400)
            self.assertEquals(e.message, "Coverage does not exist")
            return

        self.assertFalse("Failed to raise an exception")

    async def test_duplicate_planning_not_found(self):
        try:
            await get_resource_service("planning").duplicate_coverage_for_article_rewrite("plan2", "cov1", {})
        except SuperdeskApiError as e:
            self.assertEquals(e.status_code, 400)
            self.assertEquals(e.message, "Planning does not exist")
            return

        self.assertFalse("Failed to raise an exception")
