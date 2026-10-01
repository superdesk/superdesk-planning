from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures
from superdesk.tests import setup_db_user

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourcePlanningTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.assignments_service = get_resource_service("assignments")
        self.planning_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    async def test_create_coverages(self) -> None:
        event = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.EVENT,
                name="Test Event",
                dates={
                    "start": "2026-06-30T15:30:55+0000",
                    "end": "2026-06-30T17:30:55+0000",
                },
                expiry="2026-07-30T17:30:55+0000",
            )
        )
        new_event = (await self.planning_service.create([event]))[0]
        self.assertIsNotNone(new_event.id)

        planning = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.PLANNING,
                name="Test Planning",
                dates={"start": "2026-06-30T15:30:55+0000"},
                subject=[
                    {
                        "qcode": " abcd 123 ",
                        "name": "  subject 1 ",
                        "scheme": " some scheme ",
                    }
                ],
                related_events=[{"_id": event.id, "link_type": "primary"}],
            )
        )
        new_plan = (await self.planning_service.create([planning]))[0]
        self.assertIsNotNone(new_plan.id)

    async def test_legacy_service_updates_featured_metadata(self) -> None:
        self.headers = []
        await setup_db_user(self, fixtures.users.admin().to_dict())
        planning = UnifiedPlanningResource.from_dict(
            {
                "type": PlanningItemType.PLANNING,
                "slugline": "Featured",
                "dates": {"start": "2026-09-25T01:00:00+0000"},
            }
        )
        created = (await self.planning_service.create([planning]))[0]
        response = await self.test_client.get(
            f"/api/planning/{created.id}",
            headers=self.headers,
        )
        self.assertEqual(response.status_code, 200)
        original = await response.get_json()

        response = await self.test_client.patch(
            f"/api/planning/{created.id}",
            json={
                key: value
                for key, value in {**original, "featured": True}.items()
                if key == "_time_to_be_confirmed" or not key.startswith("_")
            },
            headers=self.headers + [("If-Match", original["_etag"])],
        )
        self.assertEqual(response.status_code, 200, await response.get_json())

        updated = await self.planning_service.find_by_id(created.id)
        self.assertTrue(updated.featured)
