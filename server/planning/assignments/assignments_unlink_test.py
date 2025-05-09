from bson import ObjectId

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures
from planning.tests import TestCase, fixtures as planning_fixtures


class BaseAssignmentUnlinkTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
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


class AssignmentUnlinkTestCase(BaseAssignmentUnlinkTestCase):
    # USER_ID = ObjectId("5d385f31fe985ec67a0ca583")
    async def test_delivery_record(self):
        await test_utils.post_items("planning", [planning_fixtures.planning.plan1()])
        assignment = await planning_fixtures.planning.get_plan1_assignment()
        await test_utils.post_items(
            "assignments_link",
            [{"assignment_id": assignment["_id"], "item_id": fixtures.articles.ARTICLE_1_ID, "reassign": True}],
        )

        delivery_service = get_resource_service("delivery")
        archive_service = get_resource_service("archive")
        assignment_service = get_resource_service("assignments")

        delivery_item = await delivery_service.find_one_async(req=None, item_id=fixtures.articles.ARTICLE_1_ID)

        self.assertEqual(delivery_item.get("item_id"), fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(delivery_item.get("assignment_id"), assignment["_id"])
        self.assertEqual(delivery_item.get("planning_id"), "plan1")
        self.assertEqual(delivery_item.get("coverage_id"), "cov1")

        archive_item = await archive_service.find_one_async(req=None, _id=fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(archive_item.get("assignment_id"), assignment["_id"])

        assignment = await assignment_service.find_one_async(req=None, _id=assignment["_id"])
        self.assertEqual(assignment.get("assigned_to")["state"], "in_progress")

        await get_resource_service("assignments_unlink").post_async(
            [
                {
                    "assignment_id": assignment["_id"],
                    "item_id": fixtures.articles.ARTICLE_1_ID,
                }
            ]
        )

        delivery_item = await delivery_service.find_one_async(req=None, item_id=fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(delivery_item, None)

        assignment = await assignment_service.find_one_async(req=None, _id=assignment["_id"])
        self.assertEqual(assignment.get("assigned_to")["state"], "assigned")

        archive_item = archive_service.find_one(req=None, _id=fixtures.articles.ARTICLE_1_ID)
        self.assertEqual(archive_item.get("assignment_id"), None)


class AssignmentUnlinkUpdatesTestCase(AssignmentUnlinkTestCase):
    app_config = {
        **TestCase.app_config,
        "PLANNING_LINK_UPDATES_TO_COVERAGES": True,
    }

    async def test_unlinks_all_content_updates(self):
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

        deliveries = await get_resource_service("delivery").get_async(
            req=None, lookup={"assignment_id": assignment["_id"]}
        )
        self.assertEqual(await deliveries.count(), 2)

        await get_resource_service("assignments_unlink").post_async(
            [{"assignment_id": assignment["_id"], "item_id": fixtures.articles.ARTICLE_1_ID}]
        )

        deliveries = await get_resource_service("delivery").get_async(
            req=None, lookup={"assignment_id": assignment["_id"]}
        )
        self.assertEqual(await deliveries.count(), 0)

    async def test_unlinks_properly_on_unlinking_any_update_in_chain(self):
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

        deliveries = await get_resource_service("delivery").get_async(
            req=None, lookup={"assignment_id": assignment["_id"]}
        )
        self.assertEqual(await deliveries.count(), 2)

        await get_resource_service("assignments_unlink").post_async(
            [
                {
                    "assignment_id": assignment["_id"],
                    "item_id": "rewrite_item1",
                }
            ]
        )

        deliveries = await get_resource_service("delivery").get_async(
            req=None, lookup={"assignment_id": assignment["_id"]}
        )
        self.assertEqual(await deliveries.count(), 0)

    async def test_unlinks_archived_content(self):
        await test_utils.post_items("planning", [planning_fixtures.planning.plan1()])
        assignment = await planning_fixtures.planning.get_plan1_assignment()

        await test_utils.post_items(
            "assignments_link",
            [{"assignment_id": assignment["_id"], "item_id": fixtures.articles.ARTICLE_1_ID, "reassign": True}],
        )

        archived_item = fixtures.articles.article_1()
        archived_item.update(
            {
                "_id": ObjectId("111111111111111111111111"),
                "item_id": fixtures.articles.ARTICLE_1_ID,
                "assignment_id": assignment["_id"],
                "event_id": fixtures.articles.ARTICLE_1_ID,
            }
        )
        await test_utils.post_items("archived", [archived_item])

        await get_resource_service("assignments_unlink").post_async(
            [
                {
                    "assignment_id": assignment["_id"],
                    "item_id": archived_item["_id"],
                }
            ]
        )

        deliveries = await get_resource_service("delivery").get_async(
            req=None, lookup={"assignment_id": assignment["_id"]}
        )
        self.assertEqual(await deliveries.count(), 0)
