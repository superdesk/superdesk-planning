from datetime import datetime
import pytz
from unittest.mock import MagicMock, patch

from planning.planning import planning as planning_module
from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from bson import ObjectId

USER_ID = ObjectId("5d385f31fe985ec67a0ca583")


class DuplicateCoverageTestCase(TestCase):
    def setUp(self):
        super().setUp()
        with self.app.app_context():
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
                                    "user": USER_ID,
                                    "desk": "desk1",
                                    "state": "in_progress",
                                },
                            }
                        ],
                    }
                ],
            )
            self.app.data.insert(
                "users",
                [
                    {
                        "_id": USER_ID,
                        "username": "admin",
                        "password": "blabla",
                        "email": "admin@example.com",
                        "user_type": "administrator",
                        "is_active": True,
                        "needs_activation": False,
                        "is_author": True,
                        "is_enabled": True,
                        "display_name": "John Smith",
                        "sign_off": "ADM",
                        "first_name": "John",
                        "last_name": "Smith",
                        "role": ObjectId("5d542206c04280bc6d6157f9"),
                    }
                ],
            )

    def test_duplicate(self):
        with self.app.app_context():
            updated_plan, new_coverage = get_resource_service("planning").duplicate_coverage_for_article_rewrite(
                "plan1",
                "cov1",
                {
                    "planning": {
                        "slugline": "new slugline",
                        "scheduled": datetime(2029, 10, 13, 15, 00, tzinfo=pytz.UTC),
                    },
                    "assigned_to": {
                        "user": USER_ID,
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
            self.assertEqual(new_coverage["assigned_to"]["user"], USER_ID)
            self.assertEqual(new_coverage["assigned_to"]["desk"], "desk2")
            self.assertEqual(new_coverage["assigned_to"]["state"], "in_progress")
            self.assertEqual(new_coverage["news_coverage_status"], {"qcode": "ncostat:onreq"})

    def test_duplicate_coverage_not_found(self):
        with self.app.app_context():
            try:
                get_resource_service("planning").duplicate_coverage_for_article_rewrite("plan1", "cov2", {})
            except SuperdeskApiError as e:
                self.assertEquals(e.status_code, 400)
                self.assertEquals(e.message, "Coverage does not exist")
                return

            self.assertFalse("Failed to raise an exception")

    def test_duplicate_planning_not_found(self):
        with self.app.app_context():
            try:
                get_resource_service("planning").duplicate_coverage_for_article_rewrite("plan2", "cov1", {})
            except SuperdeskApiError as e:
                self.assertEquals(e.status_code, 400)
                self.assertEquals(e.message, "Planning does not exist")
                return

            self.assertFalse("Failed to raise an exception")


class AssignmentRecoveryTestCase(TestCase):
    def test_recreate_assignment_when_stale_assignment_id_is_sent(self):
        with self.app.app_context():
            planning_service = get_resource_service("planning")
            real_get_resource_service = get_resource_service

            assignment_service = MagicMock()
            assignment_service.find_one.return_value = None
            assignment_service.post.return_value = ["new-assignment-id"]

            def _get_resource_service(resource_name):
                if resource_name == "assignments":
                    return assignment_service

                return real_get_resource_service(resource_name)

            planning_original = {
                "_id": "plan1",
                "state": "scheduled",
            }
            updates = {
                "coverage_id": "cov1",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                    "desk": "desk1",
                },
            }
            original = {
                "coverage_id": "cov1",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                    "desk": "desk1",
                },
            }

            with patch.object(planning_module, "get_resource_service", side_effect=_get_resource_service):
                with patch.object(
                    planning_module,
                    "get_coverage_status_from_cv",
                    return_value={"qcode": "ncostat:notint", "is_active": False},
                ):
                    planning_service._create_update_assignment(planning_original, {}, updates, original)

            assignment_service.find_one.assert_called_once_with(req=None, _id="stale-assignment-id")
            assignment_service.post.assert_called_once()
            self.assertEqual(updates["assigned_to"]["assignment_id"], "new-assignment-id")
            self.assertEqual(updates["assigned_to"]["state"], "draft")

    def test_stale_assignment_id_without_assignee_still_fails(self):
        with self.app.app_context():
            planning_service = get_resource_service("planning")
            real_get_resource_service = get_resource_service

            assignment_service = MagicMock()
            assignment_service.find_one.return_value = None

            def _get_resource_service(resource_name):
                if resource_name == "assignments":
                    return assignment_service

                return real_get_resource_service(resource_name)

            planning_original = {
                "_id": "plan1",
                "state": "scheduled",
            }
            updates = {
                "coverage_id": "cov1",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                },
            }
            original = {
                "coverage_id": "cov1",
                "workflow_status": "draft",
                "planning": {
                    "g2_content_type": "text",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                },
            }

            with patch.object(planning_module, "get_resource_service", side_effect=_get_resource_service):
                with patch.object(
                    planning_module,
                    "get_coverage_status_from_cv",
                    return_value={"qcode": "ncostat:notint", "is_active": False},
                ):
                    with self.assertRaises(SuperdeskApiError):
                        planning_service._create_update_assignment(planning_original, {}, updates, original)

            assignment_service.find_one.assert_called_once_with(req=None, _id="stale-assignment-id")
            assignment_service.post.assert_not_called()

    def test_stale_assignment_id_on_cancel_does_not_recreate_assignment(self):
        with self.app.app_context():
            planning_service = get_resource_service("planning")
            real_get_resource_service = get_resource_service

            assignment_service = MagicMock()
            assignment_service.find_one.return_value = None

            def _get_resource_service(resource_name):
                if resource_name == "assignments":
                    return assignment_service

                return real_get_resource_service(resource_name)

            planning_original = {
                "_id": "plan1",
                "state": "scheduled",
            }
            updates = {
                "coverage_id": "cov1",
                "workflow_status": "cancelled",
                "planning": {
                    "g2_content_type": "text",
                    "workflow_status_reason": "coverage no longer needed",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                    "desk": "desk1",
                },
            }
            original = {
                "coverage_id": "cov1",
                "workflow_status": "active",
                "planning": {
                    "g2_content_type": "text",
                },
                "assigned_to": {
                    "assignment_id": "stale-assignment-id",
                    "desk": "desk1",
                },
            }

            with patch.object(planning_module, "get_resource_service", side_effect=_get_resource_service):
                with patch.object(
                    planning_module,
                    "get_coverage_status_from_cv",
                    return_value={"qcode": "ncostat:notint", "is_active": False},
                ):
                    planning_service._create_update_assignment(planning_original, {}, updates, original)

            self.assertEqual(assignment_service.find_one.call_count, 2)
            assignment_service.find_one.assert_called_with(req=None, _id="stale-assignment-id")
            assignment_service.post.assert_not_called()
            assignment_service.cancel_assignment.assert_not_called()
            self.assertEqual(updates["workflow_status"], "cancelled")
            self.assertEqual(updates["previous_status"], "active")
            self.assertEqual(updates["assigned_to"]["state"], "cancelled")
            self.assertEqual(updates["news_coverage_status"]["qcode"], "ncostat:notint")
            self.assertEqual(updates["planning"]["workflow_status_reason"], "coverage no longer needed")
