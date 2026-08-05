from superdesk.core import json

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceCoveragesTestCase(TestCase):
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
        planning = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.PLANNING,
                name="Test Planning",
                dates={"start": "2026-06-30T15:30:55+0000"},
                coverages=[
                    {
                        "planning": {
                            "scheduled": "2026-06-30T16:30:55+0000",
                            "ednote": "test coverage, I want 250 words",
                            "headline": "test headline",
                            "slugline": "test slugline",
                            "g2_content_type": "text",
                        },
                        "workflow_status": "draft",
                        "news_coverage_status": {
                            "qcode": "ncostat:int",
                            "name": "Intended",
                            "label": "Coverage Intended",
                        },
                        "assigned_to": {
                            "desk": fixtures.desks.SPORTS_DESK_ID,
                            "user": fixtures.users.ADMIN_USER_ID,
                        },
                    }
                ],
            )
        )
        new_planning = (await self.planning_service.create([planning]))[0]
        self.assertIsNotNone(new_planning.coverages[0].assigned_to.assignment_id)
        assignment = await self.assignments_service.find_one_async(
            req=None, _id=new_planning.coverages[0].assigned_to.assignment_id
        )
        self.assertIsNotNone(assignment)

    async def test_updating_coverages(self) -> None:
        # Start with empty coverages
        planning = UnifiedPlanningResource.from_dict(
            dict(type=PlanningItemType.PLANNING, name="Test Planning", dates={"start": "2026-06-30T15:30:55+0000"})
        )
        new_planning = (await self.planning_service.create([planning]))[0]

        response = await self.planning_service.update(
            new_planning.id,
            {
                "coverages": [
                    {
                        "planning": {
                            "scheduled": "2026-06-30T16:30:55+0000",
                            "ednote": "test coverage, I want 250 words",
                            "headline": "test headline",
                            "slugline": "test slugline",
                            "g2_content_type": "text",
                        },
                        "workflow_status": "active",
                        "news_coverage_status": {
                            "qcode": "ncostat:int",
                            "name": "Intended",
                            "label": "Coverage Intended",
                        },
                        "assigned_to": {
                            "desk": fixtures.desks.SPORTS_DESK_ID,
                            "user": fixtures.users.ADMIN_USER_ID,
                        },
                    }
                ]
            },
        )
        updated_planning = await self.planning_service.find_by_id(new_planning.id)
        self.assertIsNotNone(updated_planning.coverages[0].assigned_to.assignment_id)
        assignment = await self.assignments_service.find_one_async(
            req=None, _id=updated_planning.coverages[0].assigned_to.assignment_id
        )
        self.assertIsNotNone(assignment)

    async def test_event_coverages(self) -> None:
        event = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.EVENT,
                name="Test Event with Coverages",
                dates={"start": "2026-06-30T15:30:55+0000", "end": "2026-06-30T17:30:55+0000"},
                coverages=[
                    {
                        "planning": {
                            "scheduled": "2026-06-30T16:30:55+0000",
                            "ednote": "test coverage, I want 250 words",
                            "headline": "test headline",
                            "slugline": "test slugline",
                            "g2_content_type": "text",
                        },
                        "workflow_status": "draft",
                        "news_coverage_status": {
                            "qcode": "ncostat:int",
                            "name": "Intended",
                            "label": "Coverage Intended",
                        },
                        "assigned_to": {
                            "desk": fixtures.desks.SPORTS_DESK_ID,
                            "user": fixtures.users.ADMIN_USER_ID,
                        },
                    }
                ],
            )
        )
        new_planning = (await self.planning_service.create([event]))[0]
        self.assertIsNotNone(new_planning.coverages[0].assigned_to.assignment_id)
        assignment = await self.assignments_service.find_one_async(
            req=None, _id=new_planning.coverages[0].assigned_to.assignment_id
        )
        self.assertIsNotNone(assignment)
