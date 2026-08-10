from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceMixedTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.assignments_service = get_resource_service("assignments")
        self.planning_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    async def test_mixed_resources(self) -> None:
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
        planning = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.PLANNING,
                name="Test Planning",
                dates={"start": "2026-06-30T20:30:55+0000"},
                subject=[
                    {
                        "qcode": " abcd 123 ",
                        "name": "  subject 1 ",
                        "scheme": " some scheme ",
                    }
                ],
            )
        )

        new_items = await self.planning_service.create([event, planning])
        self.assertEqual(new_items[0].id, event.id)
        self.assertEqual(new_items[1].id, planning.id)

        cursor = await self.planning_service.find({}, sort=[("dates.start", 1)])
        fetched_items = await cursor.to_list()
        self.assertEqual(len(fetched_items), 2)
        self.assertEqual(fetched_items[0].id, event.id)
        self.assertEqual(fetched_items[1].id, planning.id)
