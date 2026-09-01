from bson import ObjectId
from unittest import mock
from superdesk.utc import utcnow
from superdesk import get_resource_service
from superdesk.tests import utils as test_utils, fixtures
from superdesk.tests import setup_db_user

from planning.coverage_assignments import get_metadata_updates_between_entities
from planning.tests import TestCase


now = utcnow()


class SyncAssignmentCoverageTest(TestCase):
    async def test_planning_patch_preserves_coverage_assigned_to(self):
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        await test_utils.post_items("users", [fixtures.users.admin().to_dict()])
        await test_utils.post_items("desks", [fixtures.desks.sports_desk().to_dict()])
        await test_utils.post_items("stages", [fixtures.stages.sports_working_stage()])

        await test_utils.post_items(
            "planning",
            [
                {
                    "guid": "p2",
                    "slugline": "test",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c2",
                            "workflow_status": "draft",
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "planning": {"scheduled": now},
                            "assigned_to": {
                                "desk": fixtures.desks.SPORTS_DESK_ID,
                                "user": fixtures.users.ADMIN_USER_ID,
                                "state": "draft",
                            },
                        }
                    ],
                }
            ],
        )

        original = await test_utils.find_by_id("planning", "p2")
        assigned_to = dict(original["coverages"][0]["assigned_to"])

        updated = await get_resource_service("planning").patch_async(
            "p2",
            {
                "coverages": [
                    {
                        "coverage_id": "c2",
                        "planning": {"scheduled": now},
                        "workflow_status": original["coverages"][0]["workflow_status"],
                        "news_coverage_status": original["coverages"][0]["news_coverage_status"],
                        "assigned_to": assigned_to,
                    }
                ]
            },
        )

        self.assertEqual(updated["coverages"][0].get("assigned_to"), assigned_to)

        persisted = await test_utils.find_by_id("planning", "p2")
        self.assertEqual(persisted["coverages"][0].get("assigned_to"), assigned_to)

    async def test_planning_http_patch_preserves_coverage_assigned_to_in_response(self):
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        self.headers = []
        await test_utils.post_items("users", [fixtures.users.admin().to_dict()])
        await test_utils.post_items("desks", [fixtures.desks.sports_desk().to_dict()])
        await test_utils.post_items("stages", [fixtures.stages.sports_working_stage()])
        await setup_db_user(self, fixtures.users.admin().to_dict())

        await test_utils.post_items(
            "planning",
            [
                {
                    "guid": "p3",
                    "slugline": "test",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c3",
                            "workflow_status": "draft",
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "planning": {"scheduled": now},
                            "assigned_to": {
                                "desk": fixtures.desks.SPORTS_DESK_ID,
                                "user": fixtures.users.ADMIN_USER_ID,
                                "state": "draft",
                            },
                        }
                    ],
                }
            ],
        )

        original = await test_utils.find_by_id("planning", "p3")
        assigned_to = dict(original["coverages"][0]["assigned_to"])
        response = await self.test_client.patch(
            "/api/planning/p3",
            json={
                "coverages": [
                    {
                        "coverage_id": "c3",
                        "planning": {"scheduled": now},
                        "workflow_status": original["coverages"][0]["workflow_status"],
                        "news_coverage_status": original["coverages"][0]["news_coverage_status"],
                        "assigned_to": assigned_to,
                    }
                ]
            },
            headers=self.headers + [("If-Match", original["_etag"])],
        )

        self.assertEqual(response.status_code, 200)
        body = await response.get_json()
        response_assigned_to = body["coverages"][0].get("assigned_to") or {}
        self.assertEqual(response_assigned_to.get("assignment_id"), assigned_to.get("assignment_id"))
        self.assertEqual(response_assigned_to.get("desk"), str(assigned_to.get("desk")))
        self.assertEqual(response_assigned_to.get("user"), str(assigned_to.get("user")))
        self.assertEqual(response_assigned_to.get("state"), assigned_to.get("state"))

    async def test_planning_patch_preserves_assignee_fields_when_assignment_is_missing(self):
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        await test_utils.post_items("users", [fixtures.users.admin().to_dict()])
        await test_utils.post_items("desks", [fixtures.desks.sports_desk().to_dict()])
        await test_utils.post_items("stages", [fixtures.stages.sports_working_stage()])

        await test_utils.post_items(
            "planning",
            [
                {
                    "guid": "p4",
                    "slugline": "test",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c4",
                            "workflow_status": "draft",
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "planning": {"scheduled": now},
                            "assigned_to": {
                                "desk": fixtures.desks.SPORTS_DESK_ID,
                                "user": fixtures.users.ADMIN_USER_ID,
                                "state": "draft",
                            },
                        }
                    ],
                }
            ],
        )

        original = await test_utils.find_by_id("planning", "p4")
        assigned_to = dict(original["coverages"][0]["assigned_to"])
        self.app.data.remove("assignments", {"_id": ObjectId(assigned_to["assignment_id"])})

        updated = await get_resource_service("planning").patch_async(
            "p4",
            {
                "coverages": [
                    {
                        "coverage_id": "c4",
                        "planning": {"scheduled": now},
                        "workflow_status": original["coverages"][0]["workflow_status"],
                        "news_coverage_status": original["coverages"][0]["news_coverage_status"],
                        "assigned_to": assigned_to,
                    }
                ]
            },
        )

        updated_assigned_to = updated["coverages"][0].get("assigned_to") or {}
        self.assertEqual(updated_assigned_to.get("desk"), assigned_to.get("desk"))
        self.assertEqual(updated_assigned_to.get("user"), assigned_to.get("user"))
        self.assertEqual(updated_assigned_to.get("state"), assigned_to.get("state"))
        self.assertIsNone(updated_assigned_to.get("assignment_id"))

    async def test_planning_patch_does_not_touch_xmp_when_assignment_is_missing(self):
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        await test_utils.post_items("users", [fixtures.users.admin().to_dict()])
        await test_utils.post_items("desks", [fixtures.desks.sports_desk().to_dict()])
        await test_utils.post_items("stages", [fixtures.stages.sports_working_stage()])

        await test_utils.post_items(
            "planning",
            [
                {
                    "guid": "p5",
                    "slugline": "test",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c5",
                            "workflow_status": "draft",
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "planning": {"scheduled": now},
                            "assigned_to": {
                                "desk": fixtures.desks.SPORTS_DESK_ID,
                                "user": fixtures.users.ADMIN_USER_ID,
                                "state": "draft",
                            },
                        }
                    ],
                }
            ],
        )

        original = await test_utils.find_by_id("planning", "p5")
        assigned_to = dict(original["coverages"][0]["assigned_to"])
        self.app.data.remove("assignments", {"_id": ObjectId(assigned_to["assignment_id"])})

        with mock.patch(
            "planning.assignments.assignments.set_assignment_xmp_file_info", new_callable=mock.AsyncMock
        ) as set_xmp_mock:
            updated = await get_resource_service("planning").patch_async(
                "p5",
                {
                    "coverages": [
                        {
                            "coverage_id": "c5",
                            "planning": {"scheduled": now},
                            "workflow_status": original["coverages"][0]["workflow_status"],
                            "news_coverage_status": original["coverages"][0]["news_coverage_status"],
                            "assigned_to": assigned_to,
                        }
                    ]
                },
            )

        set_xmp_mock.assert_not_awaited()

        updated_assigned_to = updated["coverages"][0].get("assigned_to") or {}
        self.assertEqual(updated_assigned_to.get("desk"), assigned_to.get("desk"))
        self.assertEqual(updated_assigned_to.get("user"), assigned_to.get("user"))
        self.assertEqual(updated_assigned_to.get("state"), assigned_to.get("state"))
        self.assertIsNone(updated_assigned_to.get("assignment_id"))

    async def test_planning_etag_not_changed_after_sync_assignment_coverage(self):
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        await test_utils.post_items("users", [fixtures.users.admin().to_dict()])
        await test_utils.post_items("desks", [fixtures.desks.sports_desk().to_dict()])
        await test_utils.post_items("stages", [fixtures.stages.sports_working_stage()])

        await test_utils.post_items(
            "planning",
            [
                {
                    "guid": "p1",
                    "slugline": "test",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "c1",
                            "workflow_status": "draft",
                            "news_coverage_status": {"qcode": "ncostat:int"},
                            "planning": {"scheduled": now},
                            "assigned_to": {
                                "desk": fixtures.desks.SPORTS_DESK_ID,
                                "state": "draft",
                            },
                        }
                    ],
                }
            ],
        )
        planning = await test_utils.find_by_id("planning", "p1")
        self.assertIsNotNone(planning)
        original_planning_etag = planning["_etag"]
        assigned_to = planning["coverages"][0]["assigned_to"]

        assignment_id = assigned_to["assignment_id"]
        assignment = await test_utils.find_by_id("assignments", assignment_id)
        self.assertIsNotNone(assignment)
        await test_utils.patch_item(
            "assignments",
            ObjectId(assignment_id),
            {
                "assigned_to": {
                    **assigned_to,
                    "desk": fixtures.desks.SPORTS_DESK_ID,
                    "user": fixtures.users.ADMIN_USER_ID,
                }
            },
        )

        planning = await test_utils.find_by_id("planning", "p1")
        self.assertEqual(original_planning_etag, planning["_etag"])


def test_reassignment_resets_assignment_state_to_assigned():
    assignment = {
        "_id": "as1",
        "assigned_to": {
            "desk": "desk-1",
            "user": "user-1",
            "state": "in_progress",
        },
        "planning": {},
    }
    planning = {"_id": "plan-1"}
    coverage = {
        "coverage_id": "cov-1",
        "workflow_status": "active",
        "assigned_to": {
            "assignment_id": "as1",
            "desk": "desk-1",
            "user": None,
            "state": "in_progress",
        },
        "planning": {},
    }

    with (
        mock.patch("planning.coverage_assignments.get_user", return_value=None),
        mock.patch(
            "planning.coverage_assignments.get_config_assignment_manual_reassignment_only",
            return_value=True,
        ),
    ):
        updates = get_metadata_updates_between_entities(assignment, planning, coverage, destination="assignment")

    assert updates["assigned_to"]["user"] is None
    assert updates["assigned_to"]["state"] == "assigned"


def test_reassignment_does_not_reset_state_when_manual_reassignment_disabled():
    assignment = {
        "_id": "as1",
        "assigned_to": {
            "desk": "desk-1",
            "user": "user-1",
            "state": "in_progress",
        },
        "planning": {},
    }
    planning = {"_id": "plan-1"}
    coverage = {
        "coverage_id": "cov-1",
        "workflow_status": "active",
        "assigned_to": {
            "assignment_id": "as1",
            "desk": "desk-1",
            "user": None,
            "state": "in_progress",
        },
        "planning": {},
    }

    with (
        mock.patch("planning.coverage_assignments.get_user", return_value=None),
        mock.patch(
            "planning.coverage_assignments.get_config_assignment_manual_reassignment_only",
            return_value=False,
        ),
    ):
        updates = get_metadata_updates_between_entities(assignment, planning, coverage, destination="assignment")

    assert updates["assigned_to"]["user"] is None
    assert updates["assigned_to"]["state"] == "in_progress"


def test_stale_planning_assignment_state_does_not_reset_in_progress_assignment():
    assignment = {
        "_id": "as1",
        "assigned_to": {
            "desk": "desk-1",
            "user": "user-1",
            "state": "in_progress",
        },
        "planning": {},
    }
    planning = {
        "_id": "plan-1",
        # Trigger assignment metadata update path without changing assignee fields.
        "description_text": "Updated from planning editor",
    }
    coverage = {
        "coverage_id": "cov-1",
        "workflow_status": "active",
        "assigned_to": {
            "assignment_id": "as1",
            "desk": "desk-1",
            "user": "user-1",
            # Stale state in planning editor (before "start work" websocket update).
            "state": "assigned",
        },
        "planning": {},
    }

    with mock.patch("planning.coverage_assignments.get_user", return_value=None):
        updates = get_metadata_updates_between_entities(assignment, planning, coverage, destination="assignment")

    assert updates["assigned_to"]["state"] == "in_progress"
