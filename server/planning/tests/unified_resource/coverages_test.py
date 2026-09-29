from types import SimpleNamespace
from unittest import mock

from superdesk.core import json

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import (
    EmbeddedPlanningCoverage,
    EmbeddedPlanningItem,
    UnifiedPlanningResource,
    PlanningItemType,
)
from planning.unified.metadata.embedded_planning import get_existing_plannings_from_embedded_planning
from planning.unified.metadata.common import VocabsSyncData
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

    async def test_embedded_coverage_genre_omitted_vs_cleared(self) -> None:
        planning = UnifiedPlanningResource.from_dict(
            {
                "_id": "planning-1",
                "type": PlanningItemType.PLANNING,
                "dates": {"start": "2026-06-30T15:30:55+0000"},
                "coverages": [
                    {
                        "coverage_id": "coverage-1",
                        "planning": {
                            "scheduled": "2026-06-30T16:30:55+0000",
                            "genre": [{"qcode": "genre-1", "name": "Genre"}],
                        },
                        "news_coverage_status": {
                            "qcode": "ncostat:int",
                            "name": "Intended",
                            "label": "Coverage Intended",
                        },
                    }
                ],
            }
        )
        profiles = SimpleNamespace(get_coverage_profile=lambda content_type: SimpleNamespace(enabled_fields={"genre"}))
        vocabs = VocabsSyncData(coverage_states={}, genres={})

        async def sync(coverage):
            embedded_plan = EmbeddedPlanningItem(planning_id=planning.id, coverages=[coverage])
            with mock.patch.object(
                UnifiedPlanningResource,
                "get_service",
                return_value=SimpleNamespace(find_by_ids=mock.AsyncMock(return_value=[planning])),
            ):
                return [
                    result
                    async for result in get_existing_plannings_from_embedded_planning(
                        planning, {}, [embedded_plan], profiles, vocabs
                    )
                ][0]

        omitted = EmbeddedPlanningCoverage(coverage_id="coverage-1")
        self.assertNotIn("genre", omitted.model_fields_set)
        _, updates, update_required = await sync(omitted)
        self.assertTrue(update_required)
        self.assertEqual(updates["coverages"][0]["planning"]["genre"][0]["qcode"], "genre-1")

        cleared = EmbeddedPlanningCoverage(coverage_id="coverage-1", genre=None)
        self.assertIn("genre", cleared.model_fields_set)
        _, updates, update_required = await sync(cleared)
        self.assertTrue(update_required)
        self.assertEqual(updates["coverages"][0]["planning"]["genre"], [])

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
