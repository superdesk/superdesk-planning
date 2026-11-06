from bson import ObjectId

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures
from planning.tests import TestCase, fixtures as planning_fixtures
from planning.types import UnifiedPlanningResource


class BaseAssignmentLinkTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

        self.article = fixtures.articles.article_1()
        self.article.update(
            {
                "state": "in_progress",
                "event_id": fixtures.articles.ARTICLE_1_ID,
            }
        )
        self.article.pop("operation", None)
        await test_utils.post_items("archive", [self.article])


class AssignmentLinkTestCase(BaseAssignmentLinkTestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("planning", [planning_fixtures.planning.plan1()])
        self.assignment = await planning_fixtures.planning.get_plan1_assignment()
        await test_utils.post_items(
            "assignments_link",
            [{"assignment_id": self.assignment["_id"], "item_id": fixtures.articles.ARTICLE_1_ID, "reassign": True}],
        )

    async def test_delivery_record(self):
        deliveries = await test_utils.find_many("delivery", lookup={"assignment_id": ObjectId(self.assignment["_id"])})
        self.assertEqual(len(deliveries), 1)

        self.assertEqual(deliveries[0].get("item_id"), fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(deliveries[0].get("assignment_id"), ObjectId(self.assignment["_id"]))
        self.assertEqual(deliveries[0].get("planning_id"), "plan1")
        self.assertEqual(deliveries[0].get("coverage_id"), "cov1")

        archive_item = await test_utils.find_by_id("archive", fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(archive_item.get("assignment_id"), ObjectId(self.assignment["_id"]))

        assignment = await test_utils.find_by_id("assignments", self.assignment["_id"])
        self.assertEqual(assignment.get("assigned_to")["state"], "in_progress")

    async def test_updates_creates_new_record(self):
        deliveries = await test_utils.find_many("delivery", lookup={"assignment_id": ObjectId(self.assignment["_id"])})
        self.assertEqual(len(deliveries), 1)

        article = fixtures.articles.article_1()
        article.update(
            {
                "_id": "rewrite_item1",
                "rewrite_of": fixtures.articles.ARTICLE_1_ID,
                "event_id": fixtures.articles.ARTICLE_1_ID,
            }
        )
        await test_utils.post_items("archive", [article])
        await test_utils.post_items(
            "assignments_link",
            [{"assignment_id": self.assignment["_id"], "item_id": "rewrite_item1", "reassign": True}],
        )

        deliveries = await test_utils.find_many("delivery", lookup={"assignment_id": ObjectId(self.assignment["_id"])})
        self.assertEqual(len(deliveries), 2)

    async def test_captures_item_state(self):
        deliveries = await test_utils.find_many("delivery", lookup={"assignment_id": ObjectId(self.assignment["_id"])})
        self.assertEqual(len(deliveries), 1)
        self.assertEqual(deliveries[0].get("item_state"), "in_progress")


class AssignmentRewriteLinkTestCase(BaseAssignmentLinkTestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("planning", [planning_fixtures.planning.plan1()])
        self.assignment = await planning_fixtures.planning.get_plan1_assignment()
        await test_utils.post_items(
            "assignments_link",
            [{"assignment_id": self.assignment["_id"], "item_id": self.article["_id"], "reassign": True}],
        )
        rewrite = fixtures.articles.article_1()
        rewrite.update(
            {
                "_id": "rewrite_item1",
                "guid": "rewrite_item1",
                "state": "in_progress",
                "rewrite_of": self.article["_id"],
                "event_id": self.article["_id"],
            }
        )
        rewrite.pop("operation", None)
        await test_utils.post_items("archive", [rewrite])
        self.rewrite = {"_id": rewrite["_id"]}
        self.assignments = get_resource_service("assignments")
        self.planning = UnifiedPlanningResource.get_service()

    async def test_rewrite_links_existing_coverage(self):
        await self.assignments.create_delivery_for_content_update([self.rewrite])

        delivery = await test_utils.find_one("delivery", item_id=self.rewrite["_id"])
        self.assertEqual(delivery["assignment_id"], ObjectId(self.assignment["_id"]))
        self.assertEqual(delivery["planning_id"], "plan1")
        self.assertEqual(delivery["coverage_id"], "cov1")
        self.assertEqual(str(self.rewrite["assignment_id"]), str(self.assignment["_id"]))
        item = await test_utils.find_by_id("archive", self.rewrite["_id"])
        self.assertEqual(str(item["assignment_id"]), str(self.assignment["_id"]))
        planning = await self.planning.find_by_id("plan1")
        self.assertEqual([coverage.coverage_id for coverage in planning.coverages], ["cov1"])

    async def test_rewrite_rejects_missing_planning(self):
        await self.planning.mongo_async.delete_one({"_id": "plan1"})

        with self.assertRaises(SuperdeskApiError) as error:
            await self.assignments.create_delivery_for_content_update([self.rewrite])

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.message, "Planning does not exist")

    async def test_rewrite_rejects_missing_coverage(self):
        await self.planning.mongo_async.update_one({"_id": "plan1"}, {"$set": {"coverages": []}})

        with self.assertRaises(SuperdeskApiError) as error:
            await self.assignments.create_delivery_for_content_update([self.rewrite])

        self.assertEqual(error.exception.status_code, 400)
        self.assertEqual(error.exception.message, "Coverage does not exist")

    async def test_rewrite_does_not_link_when_coverage_disables_content_linking(self):
        await self.planning.mongo_async.update_one(
            {"_id": "plan1"}, {"$set": {"coverages.0.flags.no_content_linking": True}}
        )

        await self.assignments.create_delivery_for_content_update([self.rewrite])

        self.assertNotIn("assignment_id", self.rewrite)
        self.assertIsNone(await test_utils.find_one("delivery", item_id=self.rewrite["_id"]))


class AssignmentLinkUpdatesTestCase(BaseAssignmentLinkTestCase):
    app_config = {
        **TestCase.app_config,
        "PLANNING_LINK_UPDATES_TO_COVERAGES": True,
    }

    async def test_previous_unlinked_content_gets_linked_when_update_is_linked(self):
        deliveries = await test_utils.find_many("delivery", lookup={"item_id": self.article["_id"]})
        self.assertEqual(len(deliveries), 0)

        article = fixtures.articles.article_1()
        article.update(
            {
                "_id": "rewrite_item1",
                "state": "in_progress",
                "rewrite_of": fixtures.articles.ARTICLE_1_ID,
                "event_id": fixtures.articles.ARTICLE_1_ID,
            }
        )
        article.pop("operation", None)
        await test_utils.post_items("archive", [article])
        await test_utils.post_items("planning", [planning_fixtures.planning.plan1()])
        assignment = await planning_fixtures.planning.get_plan1_assignment()
        await test_utils.post_items(
            "assignments_link", [{"assignment_id": assignment["_id"], "item_id": "rewrite_item1", "reassign": True}]
        )
        deliveries = await test_utils.find_many("delivery", lookup={"assignment_id": ObjectId(assignment["_id"])})
        self.assertEqual(len(deliveries), 2)
