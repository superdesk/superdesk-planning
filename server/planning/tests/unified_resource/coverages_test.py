from types import SimpleNamespace
from unittest import mock

from superdesk.core import json
from superdesk.errors import SuperdeskApiError

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

    async def _get_planning_assignments(self, planning_id: str) -> dict:
        cursor = await self.assignments_service.find_async({"planning_item": planning_id})
        return {assignment["_id"]: assignment async for assignment in cursor}

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

    async def test_auto_assign_scheduled_updates_on_create_and_update(self) -> None:
        self.app.config["PLANNING_AUTO_ASSIGN_TO_WORKFLOW"] = True
        assigned_to = {"desk": fixtures.desks.SPORTS_DESK_ID, "user": fixtures.users.ADMIN_USER_ID}
        news_coverage_status = {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
        for operation in ("create", "update"):
            with self.subTest(operation=operation):
                scheduled_update = {
                    "coverage_id": "tempId-coverage",
                    "news_coverage_status": news_coverage_status,
                    "workflow_status": "draft",
                    "planning": {"scheduled": "2029-06-30T17:30:55+0000"},
                    "assigned_to": assigned_to,
                }
                coverage = {
                    "coverage_id": "tempId-coverage",
                    "news_coverage_status": news_coverage_status,
                    "workflow_status": "draft",
                    "planning": {"scheduled": "2029-06-30T16:30:55+0000"},
                    "assigned_to": assigned_to,
                    "scheduled_updates": [scheduled_update] if operation == "create" else [],
                }
                planning = (
                    await self.planning_service.create(
                        [
                            {
                                "type": PlanningItemType.PLANNING,
                                "state": "scheduled",
                                "dates": {"start": "2029-06-30T15:30:55+0000"},
                                "coverages": [coverage],
                            }
                        ]
                    )
                )[0]
                if operation == "update":
                    coverage = planning.to_dict()["coverages"][0]
                    coverage["scheduled_updates"] = [scheduled_update]
                    planning = await self.planning_service.update(planning.id, {"coverages": [coverage]})

                self.assertFalse(hasattr(planning.coverages[0].scheduled_updates[0], "add_coverage_to_workflow"))
                stored = await self.planning_service.find_by_id(planning.id)
                for item in (planning, stored):
                    coverage = item.to_dict()["coverages"][0]
                    scheduled_update = coverage["scheduled_updates"][0]
                    self.assertEqual(coverage["workflow_status"], "active")
                    self.assertTrue(coverage["add_coverage_to_workflow"])
                    self.assertEqual(scheduled_update["workflow_status"], "active")
                    self.assertEqual(scheduled_update["coverage_id"], coverage["coverage_id"])
                    self.assertFalse(scheduled_update["scheduled_update_id"].startswith("tempId"))
                    for entity in (coverage, scheduled_update):
                        self.assertEqual(entity["assigned_to"]["state"], "assigned")
                        assignment = await self.assignments_service.find_one_async(
                            req=None, _id=entity["assigned_to"]["assignment_id"]
                        )
                        self.assertIsNotNone(assignment)
                        self.assertEqual(assignment["assigned_to"]["state"], "assigned")
                        self.assertEqual(assignment["planning_item"], planning.id)

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

    async def test_scheduled_update_assignments_survive_partial_updates_and_targeted_removal(self) -> None:
        assigned_to = {"desk": fixtures.desks.SPORTS_DESK_ID, "user": fixtures.users.ADMIN_USER_ID}
        news_coverage_status = {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
        planning = (
            await self.planning_service.create(
                [
                    {
                        "type": PlanningItemType.PLANNING,
                        "state": "draft",
                        "dates": {"start": "2029-06-30T15:30:55+0000"},
                        "coverages": [
                            {
                                "coverage_id": "coverage-1",
                                "news_coverage_status": news_coverage_status,
                                "workflow_status": "draft",
                                "planning": {"scheduled": "2029-06-30T16:30:55+0000"},
                                "assigned_to": assigned_to,
                                "scheduled_updates": [
                                    {
                                        "coverage_id": "coverage-1",
                                        "news_coverage_status": news_coverage_status,
                                        "workflow_status": "draft",
                                        "scheduled_update_id": f"tempId-update-{index}",
                                        "planning": {"scheduled": f"2029-06-30T{17 + index}:30:55+0000"},
                                        "assigned_to": assigned_to,
                                    }
                                    for index in range(2)
                                ],
                            }
                        ],
                    }
                ]
            )
        )[0]
        coverage = planning.to_dict()["coverages"][0]
        self.assertEqual(coverage["workflow_status"], "draft")
        self.assertEqual(coverage["assigned_to"]["state"], "draft")
        parent_assignment = coverage["assigned_to"].pop("assignment_id")
        scheduled_assignments = [update["assigned_to"].pop("assignment_id") for update in coverage["scheduled_updates"]]

        updated = await self.planning_service.update(planning.id, {"coverages": [coverage]})
        coverage = updated.to_dict()["coverages"][0]
        self.assertEqual(coverage["assigned_to"]["state"], "draft")
        self.assertEqual(coverage["assigned_to"]["assignment_id"], parent_assignment)
        self.assertEqual(
            [update["assigned_to"]["assignment_id"] for update in coverage["scheduled_updates"]],
            scheduled_assignments,
        )

        coverage["scheduled_updates"].pop()
        await self.planning_service.update(planning.id, {"coverages": [coverage]})
        self.assertIsNotNone(await self.assignments_service.find_one_async(None, _id=parent_assignment))
        self.assertIsNotNone(await self.assignments_service.find_one_async(None, _id=scheduled_assignments[0]))
        self.assertIsNone(await self.assignments_service.find_one_async(None, _id=scheduled_assignments[1]))

        coverage["workflow_status"] = "active"
        coverage["assigned_to"]["state"] = "assigned"
        await self.planning_service.update(planning.id, {"coverages": [coverage]})
        with self.assertRaises(SuperdeskApiError):
            await self.planning_service.update(planning.id, {"coverages": []})
        self.assertIsNotNone(await self.assignments_service.find_one_async(None, _id=parent_assignment))
        self.assertIsNotNone(await self.assignments_service.find_one_async(None, _id=scheduled_assignments[0]))

        coverage["workflow_status"] = "draft"
        coverage["assigned_to"]["state"] = "draft"
        await self.planning_service.update(planning.id, {"coverages": [coverage]})
        await self.planning_service.update(planning.id, {"coverages": []})
        self.assertIsNone(await self.assignments_service.find_one_async(None, _id=parent_assignment))
        self.assertIsNone(await self.assignments_service.find_one_async(None, _id=scheduled_assignments[0]))

    async def test_rejected_scheduled_update_removal_preserves_all_assignments(self) -> None:
        assigned_to = {"desk": fixtures.desks.SPORTS_DESK_ID, "user": fixtures.users.ADMIN_USER_ID}
        news_coverage_status = {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
        planning = (
            await self.planning_service.create(
                [
                    {
                        "type": PlanningItemType.PLANNING,
                        "state": "draft",
                        "dates": {"start": "2029-06-30T15:30:55+0000"},
                        "coverages": [
                            {
                                "coverage_id": "coverage-1",
                                "news_coverage_status": news_coverage_status,
                                "workflow_status": "active",
                                "planning": {"scheduled": "2029-06-30T16:30:55+0000"},
                                "assigned_to": assigned_to,
                                "scheduled_updates": [
                                    {
                                        "coverage_id": "coverage-1",
                                        "news_coverage_status": news_coverage_status,
                                        "workflow_status": workflow_status,
                                        "scheduled_update_id": f"tempId-update-{index}",
                                        "planning": {"scheduled": f"2029-06-30T{17 + index}:30:55+0000"},
                                        "assigned_to": assigned_to,
                                    }
                                    for index, workflow_status in enumerate(("draft", "active"))
                                ],
                            }
                        ],
                    }
                ]
            )
        )[0]
        coverage = planning.to_dict()["coverages"][0]
        scheduled_updates = coverage["scheduled_updates"]
        self.assertEqual([update["assigned_to"]["state"] for update in scheduled_updates], ["draft", "assigned"])
        assignment_ids = [update["assigned_to"]["assignment_id"] for update in scheduled_updates]
        for assignment_id, expected_state in zip(assignment_ids, ("draft", "assigned")):
            assignment = await self.assignments_service.find_one_async(None, _id=assignment_id)
            self.assertIsNotNone(assignment)
            self.assertEqual(assignment["assigned_to"]["state"], expected_state)

        with self.assertRaisesRegex(SuperdeskApiError, "Assignment already exists") as context:
            await self.planning_service.update(planning.id, {"coverages": [{**coverage, "scheduled_updates": []}]})
        self.assertEqual(context.exception.status_code, 400)

        stored = await self.planning_service.find_by_id(planning.id)
        self.assertEqual(stored.to_dict()["coverages"][0]["scheduled_updates"], scheduled_updates)
        for assignment_id in assignment_ids:
            with self.subTest(assignment_id=assignment_id):
                self.assertIsNotNone(await self.assignments_service.find_one_async(None, _id=assignment_id))

    async def test_rejected_coverage_removal_preserves_all_assignments(self) -> None:
        coverage_ids = ("coverage-1", "coverage-2")
        # Match the mutation loop's set order so the draft removal is attempted first.
        draft_coverage_id = next(iter(dict.fromkeys(coverage_ids).keys() | {}.keys()))
        planning = (
            await self.planning_service.create(
                [
                    {
                        "type": PlanningItemType.PLANNING,
                        "state": "draft",
                        "dates": {"start": "2029-06-30T15:30:55+0000"},
                        "coverages": [
                            {
                                "coverage_id": coverage_id,
                                "workflow_status": "draft" if coverage_id == draft_coverage_id else "active",
                                "news_coverage_status": {
                                    "qcode": "ncostat:int",
                                    "name": "coverage intended",
                                    "label": "Planned",
                                },
                                "planning": {"scheduled": "2029-06-30T16:30:55+0000"},
                                "assigned_to": {
                                    "desk": fixtures.desks.SPORTS_DESK_ID,
                                    "user": fixtures.users.ADMIN_USER_ID,
                                },
                            }
                            for coverage_id in coverage_ids
                        ],
                    }
                ]
            )
        )[0]
        planning = await self.planning_service.find_by_id(planning.id)
        original_coverages = planning.to_dict()["coverages"]
        original_assignments = await self._get_planning_assignments(planning.id)
        self.assertEqual(len(original_assignments), 2)
        self.assertEqual(
            {assignment["assigned_to"]["state"] for assignment in original_assignments.values()},
            {
                "draft",
                "assigned",
            },
        )

        with self.assertRaisesRegex(SuperdeskApiError, "Assignment already exists") as context:
            await self.planning_service.update(planning.id, {"coverages": []})
        self.assertEqual(context.exception.status_code, 400)

        stored = await self.planning_service.find_by_id(planning.id)
        self.assertEqual(stored.to_dict()["coverages"], original_coverages)
        self.assertEqual(await self._get_planning_assignments(planning.id), original_assignments)

    async def test_rejected_scheduled_update_removal_does_not_create_assignments(self) -> None:
        assigned_to = {"desk": fixtures.desks.SPORTS_DESK_ID, "user": fixtures.users.ADMIN_USER_ID}
        news_coverage_status = {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"}
        planning = (
            await self.planning_service.create(
                [
                    {
                        "type": PlanningItemType.PLANNING,
                        "state": "draft",
                        "dates": {"start": "2029-06-30T15:30:55+0000"},
                        "coverages": [
                            {
                                "coverage_id": "coverage-1",
                                "workflow_status": "active",
                                "news_coverage_status": news_coverage_status,
                                "planning": {"scheduled": "2029-06-30T16:30:55+0000"},
                                "assigned_to": assigned_to,
                                "scheduled_updates": [
                                    {
                                        "coverage_id": "coverage-1",
                                        "workflow_status": "active",
                                        "news_coverage_status": news_coverage_status,
                                        "planning": {"scheduled": "2029-06-30T17:30:55+0000"},
                                        "assigned_to": assigned_to,
                                    }
                                ],
                            }
                        ],
                    }
                ]
            )
        )[0]
        planning = await self.planning_service.find_by_id(planning.id)
        original_coverages = planning.to_dict()["coverages"]
        original_assignments = await self._get_planning_assignments(planning.id)
        self.assertEqual(len(original_assignments), 2)
        coverage = {
            **original_coverages[0],
            "scheduled_updates": [
                {
                    "coverage_id": "coverage-1",
                    "workflow_status": "draft",
                    "news_coverage_status": news_coverage_status,
                    "planning": {"scheduled": "2029-06-30T18:30:55+0000"},
                    "assigned_to": assigned_to,
                }
            ],
        }

        with self.assertRaisesRegex(SuperdeskApiError, "Assignment already exists") as context:
            await self.planning_service.update(planning.id, {"coverages": [coverage]})
        self.assertEqual(context.exception.status_code, 400)

        stored = await self.planning_service.find_by_id(planning.id)
        self.assertEqual(stored.to_dict()["coverages"], original_coverages)
        self.assertEqual(await self._get_planning_assignments(planning.id), original_assignments)

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
