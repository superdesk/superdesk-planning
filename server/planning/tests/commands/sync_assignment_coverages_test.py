from datetime import datetime, timezone

from bson import ObjectId

from planning.tests import TestCase
from planning.utils import get_service
from planning.types.unified import UnifiedPlanningResource
from planning.commands.sync_assignment_coverages import SyncAssignmentCoveragesCommand


class SyncAssignmentCoveragesCommandTestCase(TestCase):
    async def test_command(self):
        assignment_id = ObjectId()
        update_assignment_id = ObjectId()
        planning_id = "plan-1"

        coverages = [
            {
                "coverage_id": "cov-1",
                "assigned_to": {"assignment_id": str(assignment_id)},
                "scheduled_updates": [
                    {
                        "scheduled_update_id": "su-1",
                        "assigned_to": {"assignment_id": str(update_assignment_id)},
                    }
                ],
            }
        ]

        assignment_doc = {
            "_id": assignment_id,
            "planning_item": planning_id,
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
        update_assignment_doc = {
            "_id": update_assignment_id,
            "planning_item": planning_id,
            "coverage_item": "cov-1",
            "scheduled_update_id": "su-1",
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

        expected_date = datetime(2026, 1, 20, 0, 0, tzinfo=timezone.utc)
        planning_service = UnifiedPlanningResource.get_service()

        async with self.app.app_context():
            # The assignments reference a planning item in the legacy resource (SDBELGA-1122)
            await get_service("planning").create(
                [{"_id": planning_id, "guid": planning_id, "planning_date": "2026-01-20T00:00:00+0000"}]
            )
            await get_service("assignments").create([assignment_doc, update_assignment_doc])

            # Unified planning item; set the out-of-sync coverages via a raw mongo write
            await planning_service.create(
                [
                    {
                        "_id": planning_id,
                        "type": "planning",
                        "slugline": "test",
                        "dates": {"start": "2026-01-20T00:00:00+0000"},
                    }
                ]
            )
            await planning_service.mongo_async.update_one({"_id": planning_id}, {"$set": {"coverages": coverages}})

            await SyncAssignmentCoveragesCommand().run(dry_run=False)

            updated = await planning_service.mongo_async.find_one({"_id": planning_id})

        assert updated is not None
        coverage = updated.get("coverages")[0]
        assigned_to = coverage.get("assigned_to")
        assert assigned_to.get("assignment_id") == str(assignment_id)
        assert assigned_to.get("desk") == "desk-1"
        assert assigned_to.get("user") == "user-1"
        assert assigned_to.get("contact") == "contact-1"
        assert assigned_to.get("state") == "assigned"
        assert assigned_to.get("assignor_user") == "user-1"
        assert assigned_to.get("assignor_desk") == "desk-1"
        assert assigned_to.get("assigned_date_desk") == expected_date
        assert assigned_to.get("assigned_date_user") == expected_date
        assert assigned_to.get("coverage_provider") == {"qcode": "cp-1", "name": "Provider"}
        assert assigned_to.get("priority") == 2

        scheduled_assigned_to = coverage.get("scheduled_updates")[0].get("assigned_to")
        assert scheduled_assigned_to.get("assignment_id") == str(update_assignment_id)
        assert scheduled_assigned_to.get("desk") == "desk-1"
        assert scheduled_assigned_to.get("user") == "user-1"
        assert scheduled_assigned_to.get("contact") == "contact-1"
        assert scheduled_assigned_to.get("state") == "assigned"
        assert scheduled_assigned_to.get("assignor_user") == "user-1"
        assert scheduled_assigned_to.get("assignor_desk") == "desk-1"
        assert scheduled_assigned_to.get("assigned_date_desk") == expected_date
        assert scheduled_assigned_to.get("assigned_date_user") == expected_date
        assert scheduled_assigned_to.get("coverage_provider") == {"qcode": "cp-1", "name": "Provider"}
        assert scheduled_assigned_to.get("priority") == 2
