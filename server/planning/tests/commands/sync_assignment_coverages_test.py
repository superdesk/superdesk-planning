from bson import ObjectId

from planning.tests import TestCase
from planning.commands.sync_assignment_coverages import SyncAssignmentCoveragesCommand


class SyncAssignmentCoveragesCommandTestCase(TestCase):
    async def test_command(self):
        assignment_id = ObjectId()
        planning_id = ObjectId()

        planning_doc = {
            "_id": planning_id,
            "guid": "plan-1",
            "type": "planning",
            "slugline": "test",
            "planning_date": "2026-01-20T00:00:00+0000",
            "coverages": [
                {
                    "coverage_id": "cov-1",
                    "assigned_to": {"assignment_id": str(assignment_id)},
                    "scheduled_updates": [
                        {
                            "scheduled_update_id": "su-1",
                            "assigned_to": {"assignment_id": str(assignment_id)},
                        }
                    ],
                }
            ],
        }

        assignment_doc = {
            "_id": assignment_id,
            "planning_item": str(planning_id),
            "coverage_item": "cov-1",
            "assigned_to": {
                "desk": "desk-1",
                "user": "user-1",
                "contact": "contact-1",
                "state": "assigned",
                "assignor_user": "user-1",
                "assignor_desk": "desk-1",
                "assigned_date_desk": "2026-01-20T00:00:00+0000",
                "assigned_date_user": "2026-01-20T00:00:00+0000",
                "coverage_provider": {"qcode": "cp-1", "name": "Provider"},
            },
            "priority": 2,
        }

        async with self.app.app_context():
            self.app.data.insert("planning", [planning_doc])
            self.app.data.insert("assignments", [assignment_doc])

            await SyncAssignmentCoveragesCommand().run(dry_run=False)

        updated = self.app.data.get_mongo_collection("planning").find_one({"_id": planning_id})
        assert updated is not None
        coverage = updated.get("coverages")[0]
        assigned_to = coverage.get("assigned_to")
        assert assigned_to.get("assignment_id") == assignment_id
        assert assigned_to.get("desk") == "desk-1"
        assert assigned_to.get("user") == "user-1"
        assert assigned_to.get("contact") == "contact-1"
        assert assigned_to.get("state") == "assigned"
        assert assigned_to.get("assignor_user") == "user-1"
        assert assigned_to.get("assignor_desk") == "desk-1"
        assert assigned_to.get("assigned_date_desk") == "2026-01-20T00:00:00+0000"
        assert assigned_to.get("assigned_date_user") == "2026-01-20T00:00:00+0000"
        assert assigned_to.get("coverage_provider") == {"qcode": "cp-1", "name": "Provider"}
        assert assigned_to.get("priority") == 2

        scheduled_assigned_to = coverage.get("scheduled_updates")[0].get("assigned_to")
        assert scheduled_assigned_to.get("assignment_id") == assignment_id
        assert scheduled_assigned_to.get("desk") == "desk-1"
        assert scheduled_assigned_to.get("user") == "user-1"
        assert scheduled_assigned_to.get("contact") == "contact-1"
        assert scheduled_assigned_to.get("state") == "assigned"
        assert scheduled_assigned_to.get("assignor_user") == "user-1"
        assert scheduled_assigned_to.get("assignor_desk") == "desk-1"
        assert scheduled_assigned_to.get("assigned_date_desk") == "2026-01-20T00:00:00+0000"
        assert scheduled_assigned_to.get("assigned_date_user") == "2026-01-20T00:00:00+0000"
        assert scheduled_assigned_to.get("coverage_provider") == {"qcode": "cp-1", "name": "Provider"}
        assert scheduled_assigned_to.get("priority") == 2
