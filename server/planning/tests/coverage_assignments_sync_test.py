from bson import ObjectId
from superdesk.utc import utcnow
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase


now = utcnow()


class SyncAssignmentCoverageTest(TestCase):
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
