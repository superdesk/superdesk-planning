from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.flask import g
from bson import ObjectId


class AssignmentsTestCase(TestCase):
    users = [{"_id": ObjectId(), "username": "u1", "user_type": "administrator"}, {"_id": ObjectId(), "username": "u2"}]
    desks = [{"_id": ObjectId(), "name": "desk1", "members": [{"user": users[0]["_id"]}]}]
    stages = [{"_id": ObjectId(), "name": "working stage", "desk": desks[0]["_id"]}]

    auth = [
        {"_id": ObjectId(), "user": users[0]["_id"]},
        {"_id": ObjectId(), "user": users[1]["_id"]},
    ]

    archive_item = {
        "_id": "item1",
        "guid": "item1",
        "event_id": "abcd123",
        "type": "text",
        "headline": "test headline",
        "slugline": "test slugline",
        "task": {"desk": desks[0]["_id"], "stage": stages[0]["_id"], "user": users[0]["_id"]},
        "assignment_id": ObjectId("5b20652a1d41c812e24aa49e"),
        "state": "in_progress",
        "version": 1,
    }

    assignment_item = {
        "_id": ObjectId("5b20652a1d41c812e24aa49e"),
        "guid": "as1",
        "planning_item": "plan1",
        "coverage_item": "cov1",
        "assigned_to": {
            "state": "in_progress",
            "user": users[0]["_id"],
            "desk": desks[0]["_id"],
        },
        "lock_user": users[0]["_id"],
        "lock_session": auth[0]["_id"],
        "lock_action": "remove_assignment",
    }

    planning_item = {
        "_id": "plan1",
        "guid": "plan1",
        "planning_date": "2032-07-03T14:00:00+0000",
        "coverages": [
            {
                "coverage_id": "cov1",
                "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                "assigned_to": {
                    "user": users[0]["_id"],
                    "desk": desks[0]["_id"],
                    "state": "in_progress",
                },
                "planning": {"g2_content_type": "text"},
            }
        ],
        "lock_user": users[0]["_id"],
        "lock_session": auth[0]["_id"],
        "lock_action": "remove_assignment",
    }

    delivery_item = {
        "_id": "del1",
        "planning_id": "plan1",
        "coverage_id": "cov1",
        "assignment_id": ObjectId("5b20652a1d41c812e24aa49e"),
        "item_id": "item1",
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.app.data.insert("users", self.users)
        self.app.data.insert("desks", self.desks)
        self.app.data.insert("stages", self.stages)
        self.app.data.insert("auth", self.auth)
        self.app.data.insert("archive", [self.archive_item])
        self.app.data.insert("assignments", [self.assignment_item])
        await self.app.data.insert_async("planning", [self.planning_item])
        self.app.data.insert("delivery", [self.delivery_item])

        g.user = self.users[0]
        g.auth = self.auth[0]

    async def test_delivery_record_deleted(self):
        delivery_service = get_resource_service("delivery")
        assignment_service = get_resource_service("assignments")

        self.assertIsNotNone(await delivery_service.find_one_async(req=None, item_id="item1"))
        await assignment_service.delete_action_async(lookup={"_id": ObjectId("5b20652a1d41c812e24aa49e")})
        self.assertIsNone(delivery_service.find_one(req=None, item_id="item1"))

    async def test_get_archive_links_for_assignments_excludes_body(self):
        assignment_service = get_resource_service("assignments")
        cursor = await assignment_service.get_archive_links_for_assignments([self.assignment_item["_id"]])

        # Test that aggregations were not generated
        self.assertNotIn("aggregations", cursor.hits)

        # Test that the item only contains the expected fields
        self.assertEqual(await cursor.count(), 1)
        item = await cursor.next()
        self.assertEqual(
            item,
            {
                "_id": self.archive_item["guid"],
                "guid": self.archive_item["guid"],
                "_type": "archive",
                "event_id": self.archive_item["event_id"],
                "assignment_id": self.assignment_item["_id"],
            },
        )
