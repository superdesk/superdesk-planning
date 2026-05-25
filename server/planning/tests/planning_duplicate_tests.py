from datetime import datetime
import pytz

from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase
from planning.tests.fixtures import cvs
from planning.planning.planning_duplicate import duplicate_planning_item


class PlanningDuplicateTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        self.app.data.insert("vocabularies", cvs.all_cvs())

    def _create_test_planning_item(self):
        return {
            "_id": "plan1",
            "guid": "plan1",
            "type": "planning",
            "state": "draft",
            "slugline": "Test Planning Item",
            "planning_date": datetime(2029, 10, 12, 14, 0, 0, tzinfo=pytz.UTC),
            "coverages": [
                {
                    "coverage_id": "cov1",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "Test Coverage",
                        "scheduled": datetime(2029, 10, 12, 15, 0, 0, tzinfo=pytz.UTC),
                    },
                    "news_coverage_status": {
                        "qcode": "ncostat:onreq",
                        "name": "coverage upon request",
                        "label": "On request",
                    },
                    "assigned_to": {
                        "user": fixtures.users.ADMIN_USER_ID,
                        "desk": "desk1",
                        "assignment_id": "assignment1",
                        "state": "completed",
                        "priority": 2,
                    },
                    "workflow_status": "completed",
                }
            ],
        }

    async def test_duplicate_planning_item_with_default_behavior(self):
        """Test that both coverage status and assignee are reset when both configs are False (default behavior)."""
        original = self._create_test_planning_item()

        # Ensure both configs are False (default behavior)
        self.app.config["PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS"] = False
        self.app.config["PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS"] = False

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Verify the coverage exists
        self.assertEqual(len(duplicated["coverages"]), 1)
        coverage = duplicated["coverages"][0]

        # Coverage status should be reset to default (ncostat:int)
        self.assertEqual(coverage["news_coverage_status"]["qcode"], "ncostat:int")
        self.assertEqual(coverage["news_coverage_status"]["name"], "coverage intended")

        # Assignee details should be cleared
        self.assertEqual(coverage["assigned_to"], {})

    async def test_duplicate_planning_item_with_coverage_status_retained(self):
        """Test that news_coverage_status is retained when PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS is True."""
        original = self._create_test_planning_item()

        # Set config to retain coverage status
        self.app.config["PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS"] = True
        self.app.config["PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS"] = False

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Verify the coverage exists
        self.assertEqual(len(duplicated["coverages"]), 1)
        coverage = duplicated["coverages"][0]

        # Coverage status should be retained from original
        self.assertEqual(coverage["news_coverage_status"]["qcode"], "ncostat:onreq")
        self.assertEqual(coverage["news_coverage_status"]["name"], "coverage upon request")
        self.assertEqual(coverage["news_coverage_status"]["label"], "On request")

    async def test_duplicate_planning_item_with_assignee_retained(self):
        """Test that assigned_to is retained when PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS is True."""
        original = self._create_test_planning_item()

        # Set config to retain assignee details
        self.app.config["PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS"] = True
        self.app.config["PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS"] = False

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Verify the coverage exists
        self.assertEqual(len(duplicated["coverages"]), 1)
        coverage = duplicated["coverages"][0]

        # Assignee details should be retained
        self.assertEqual(coverage["assigned_to"]["user"], fixtures.users.ADMIN_USER_ID)
        self.assertEqual(coverage["assigned_to"]["desk"], "desk1")
        self.assertEqual(coverage["assigned_to"]["state"], "completed")
        self.assertEqual(coverage["assigned_to"]["priority"], 2)
        self.assertIsNone(coverage["assigned_to"].get("assignment_id"))

    async def test_duplicate_planning_item_with_both_configs_true(self):
        """Test that both coverage status and assignee details are retained when both configs are True."""
        original = self._create_test_planning_item()

        # Set both configs to True
        self.app.config["PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS"] = True
        self.app.config["PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS"] = True

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Verify the coverage exists
        self.assertEqual(len(duplicated["coverages"]), 1)
        coverage = duplicated["coverages"][0]

        # Both coverage status and assignee should be retained
        self.assertEqual(coverage["news_coverage_status"]["qcode"], "ncostat:onreq")
        self.assertEqual(coverage["assigned_to"]["user"], fixtures.users.ADMIN_USER_ID)
        self.assertEqual(coverage["assigned_to"]["desk"], "desk1")
        self.assertIsNone(coverage["assigned_to"].get("assignment_id"))

        # Workflow status should still be reset to draft regardless of config
        self.assertEqual(coverage["workflow_status"], "draft")

    async def test_duplicate_planning_item_multiple_coverages(self):
        """Test duplicating a planning item with multiple coverages."""
        original = {
            "_id": "plan_multi",
            "guid": "plan_multi",
            "type": "planning",
            "state": "draft",
            "slugline": "Test Planning with Multiple Coverages",
            "planning_date": datetime(2029, 10, 12, 14, 0, 0, tzinfo=pytz.UTC),
            "coverages": [
                {
                    "coverage_id": "cov1",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "Coverage 1",
                        "scheduled": datetime(2029, 10, 12, 15, 0, 0, tzinfo=pytz.UTC),
                    },
                    "news_coverage_status": {"qcode": "ncostat:onreq"},
                    "assigned_to": {"user": fixtures.users.ADMIN_USER_ID, "desk": "desk1"},
                },
                {
                    "coverage_id": "cov2",
                    "planning": {
                        "g2_content_type": "picture",
                        "slugline": "Coverage 2",
                        "scheduled": datetime(2029, 10, 12, 16, 0, 0, tzinfo=pytz.UTC),
                    },
                    "news_coverage_status": {"qcode": "ncostat:notdec"},
                    "assigned_to": {"user": fixtures.users.ADMIN_USER_ID, "desk": "desk2"},
                },
            ],
        }

        # Set both configs to True
        self.app.config["PLANNING_DUPLICATE_RETAIN_COVERAGE_STATUS"] = True
        self.app.config["PLANNING_DUPLICATE_RETAIN_ASSIGNEE_DETAILS"] = True

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Verify both coverages exist
        self.assertEqual(len(duplicated["coverages"]), 2)

        # Both coverages should retain their original status
        self.assertEqual(duplicated["coverages"][0]["news_coverage_status"]["qcode"], "ncostat:onreq")
        self.assertEqual(duplicated["coverages"][1]["news_coverage_status"]["qcode"], "ncostat:notdec")

        # Both coverages should retain their assignees
        self.assertEqual(duplicated["coverages"][0]["assigned_to"]["desk"], "desk1")
        self.assertEqual(duplicated["coverages"][1]["assigned_to"]["desk"], "desk2")

    async def test_duplicate_planning_item_coverage_time_based_on_date(self):
        """Test that coverage scheduled time is preserved for future dates and reset for past dates."""
        original = {
            "_id": "plan_mixed",
            "guid": "plan_mixed",
            "type": "planning",
            "state": "draft",
            "slugline": "Test Mixed Dates Planning",
            "planning_date": datetime(2029, 10, 12, 14, 0, 0, tzinfo=pytz.UTC),
            "coverages": [
                {
                    "coverage_id": "cov_future",
                    "planning": {
                        "g2_content_type": "text",
                        "slugline": "Future Coverage",
                        "scheduled": datetime(2029, 10, 12, 15, 0, 0, tzinfo=pytz.UTC),
                    },
                    "news_coverage_status": {"qcode": "ncostat:onreq"},
                    "assigned_to": {"user": fixtures.users.ADMIN_USER_ID, "desk": "desk1"},
                },
                {
                    "coverage_id": "cov_past",
                    "planning": {
                        "g2_content_type": "picture",
                        "slugline": "Past Coverage",
                        "scheduled": datetime(2019, 10, 12, 16, 0, 0, tzinfo=pytz.UTC),
                    },
                    "news_coverage_status": {"qcode": "ncostat:notdec"},
                    "assigned_to": {"user": fixtures.users.ADMIN_USER_ID, "desk": "desk2"},
                },
            ],
        }

        async with self.app.app_context():
            duplicated = duplicate_planning_item(original)

        # Future coverage (2029) should have preserved scheduled time
        self.assertEqual(
            duplicated["coverages"][0]["planning"]["scheduled"], datetime(2029, 10, 12, 15, 0, 0, tzinfo=pytz.UTC)
        )

        # Past coverage should have reset scheduled time
        self.assertNotEqual(
            duplicated["coverages"][1]["planning"]["scheduled"], datetime(2019, 10, 12, 16, 0, 0, tzinfo=pytz.UTC)
        )
