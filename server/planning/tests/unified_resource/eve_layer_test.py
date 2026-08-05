from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceEveLayerTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.assignments_service = get_resource_service("assignments")
        self.planning_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    async def test_create_event_through_eve(self) -> None:
        events_service = get_resource_service("events")
        event = dict(
            type=PlanningItemType.EVENT,
            name="Test Event",
            dates={
                "start": "2026-06-30T15:30:55+0000",
                "end": "2026-06-30T17:30:55+0000",
            },
            expiry="2026-07-30T17:30:55+0000",
        )

        item_ids = await events_service.post_async([event])

        item = await self.planning_service.find_by_id(item_ids[0])
        self.assertIsNotNone(item)

        eve_event = await events_service.find_one_async(req=None, _id=item_ids[0])
        self.assertIsNotNone(eve_event)
        self.assertEqual(item.name, eve_event["name"])

        updated_event = await events_service.patch_async(item_ids[0], {"name": "Test Event 2"})
        item = await self.planning_service.find_by_id(item_ids[0])
        self.assertIsNotNone(item)
        self.assertEqual(item.name, "Test Event 2")
        self.assertEqual(updated_event["name"], item.name)
        self.assertEqual(updated_event["name"], "Test Event 2")
        eve_event = await events_service.find_one_async(req=None, _id=item_ids[0])
        self.assertEqual(eve_event["name"], item.name)
        self.assertEqual(eve_event["name"], "Test Event 2")

        item = await self.planning_service.find_by_id(item_ids[0])
        self.assertDictEqual(item.to_dict(), eve_event)

        deleted_ids = await events_service.delete_docs_async([eve_event])
        self.assertEqual(deleted_ids, [eve_event["_id"]])
        self.assertIsNone(await events_service.find_one_async(req=None, _id=item_ids[0]))
