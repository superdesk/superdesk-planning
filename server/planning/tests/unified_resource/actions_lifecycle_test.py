from bson import ObjectId
from unittest.mock import patch, AsyncMock

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType, LockFields
from planning.locks.lock import lock_item
from planning.unified.actions import (
    process_cancel,
    process_reschedule_event,
    process_update_time,
    event_has_planning_items,
)
from planning.unified.actions.cancel import process_cancel_planning_item
from planning.unified.actions.update_repetitions import get_internal_series
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceLifecycleActionsTestCase(TestCase):
    """Cancel, reschedule, update_time and update_repetitions read & write the
    single ``unified_planning`` collection (SDBELGA-1120). The Planning cancel /
    reschedule logic (previously the Eve ``planning_cancel`` / ``planning_reschedule``
    resources over the empty legacy ``planning`` collection) now lives in
    ``unified/actions`` and every recurrence/series lookup is scoped to Events.
    """

    app_config = {
        **TestCase.app_config.copy(),
        "ELASTICSEARCH_FORCE_REFRESH": True,
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.service = UnifiedPlanningResource.get_service()
        self.events_service = get_resource_service("events")
        self.planning_service = get_resource_service("planning")

        await test_utils.post_items("users", fixtures.users.all_users())
        # Post the acting user so coverage `original_creator` data-relations resolve
        admin = fixtures.users.admin().to_dict()
        admin["_id"] = ObjectId()
        admin["username"] = "action_tester"
        admin["email"] = "action_tester@example.org"
        await test_utils.post_items("users", [admin])
        g.user = admin
        g.auth = {"_id": ObjectId(), "user": g.user["_id"]}
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items(
            "vocabularies",
            [
                {
                    "_id": "eventoccurstatus",
                    "display_name": "Event Occurence Status",
                    "type": "manageable",
                    "items": [
                        {
                            "qcode": "eocstat:eos6",
                            "name": "Planned, occurs cancelled",
                            "label": "Cancelled",
                            "is_active": True,
                        },
                    ],
                }
            ],
        )
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    # helpers
    async def _create_event(self, **overrides) -> str:
        data = dict(
            type=PlanningItemType.EVENT,
            name="Test Event",
            dates={"start": "2026-06-30T15:30:55+0000", "end": "2026-06-30T17:30:55+0000"},
        )
        data.update(overrides)
        event = UnifiedPlanningResource.from_dict(data)
        return (await self.service.create([event]))[0].id

    async def _create_planning(self, **overrides) -> str:
        data = dict(
            type=PlanningItemType.PLANNING,
            name="Test Planning",
            dates={"start": "2026-06-30T15:30:55+0000"},
        )
        data.update(overrides)
        planning = UnifiedPlanningResource.from_dict(data)
        return (await self.service.create([planning]))[0].id

    async def _event_dict(self, event_id: str) -> dict:
        return await self.events_service.find_one_async(req=None, _id=event_id)

    async def _lock_event(self, event_id: str, action: str) -> dict:
        # Event action endpoints require the item to be locked for that action
        event_obj = await self.service.find_by_id(event_id)
        await lock_item(event_obj, LockFields(lock_action=action))
        return await self._event_dict(event_id)

    async def _planning_dict(self, planning_id: str) -> dict:
        return await self.planning_service.find_one_async(req=None, _id=planning_id)

    # ------------------------------------------------------------------ cancel
    async def test_cancel_planning_item(self):
        planning_id = await self._create_planning()
        original = await self._planning_dict(planning_id)

        cancelled = await process_cancel({"reason": "venue closed"}, original)
        self.assertEqual("cancelled", cancelled["state"])
        self.assertEqual("venue closed", cancelled["state_reason"])

    async def test_cancel_event_cascades_to_linked_planning(self):
        event_id = await self._create_event()
        planning_id = await self._create_planning(
            related_events=[{"_id": event_id, "link_type": "primary"}],
        )

        original = await self._lock_event(event_id, "cancel")
        cancelled = await process_cancel({"reason": "off"}, original)
        self.assertEqual("cancelled", cancelled["state"])

        # The linked (primary) Planning item is cancelled as part of the event cancel
        linked = await self._planning_dict(planning_id)
        self.assertEqual("cancelled", linked["state"])

    async def test_cancel_all_coverage_cancels_coverages_not_item(self):
        planning_id = await self._create_planning(
            coverages=[
                {
                    "coverage_id": "cov1",
                    "original_creator": g.user["_id"],
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "planning": {"g2_content_type": "text", "slugline": "story"},
                }
            ],
        )
        original = await self._planning_dict(planning_id)

        result = await process_cancel({"reason": "no photog"}, original, cancel_all_coverage=True)

        # Coverage is cancelled, but the Planning item itself is NOT cancelled
        self.assertEqual("cancelled", result["coverages"][0]["workflow_status"])
        self.assertNotEqual("cancelled", result["state"])

    async def test_cancel_all_coverage_still_records_history(self):
        # The cancel_all_coverage path must still fire the cancel history + re-post
        # side effects that the removed Eve on_updated_planning_cancel signal did.
        planning_id = await self._create_planning(
            coverages=[
                {
                    "coverage_id": "cov1",
                    "original_creator": g.user["_id"],
                    "workflow_status": "draft",
                    "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
                    "planning": {"g2_content_type": "text", "slugline": "story"},
                }
            ],
        )
        original = await self._planning_dict(planning_id)

        with patch(
            "planning.unified.actions.cancel.UnifiedPlanningHistoryService.on_cancel", new_callable=AsyncMock
        ) as on_cancel:
            await process_cancel_planning_item({"reason": "Event Completed"}, original, cancel_all_coverage=True)

        on_cancel.assert_awaited_once()

    async def test_cancel_event_leaves_unrelated_planning_untouched(self):
        # A Planning item that is NOT linked to the Event must remain untouched,
        # even though it lives in the same unified_planning collection.
        event_id = await self._create_event()
        planning_id = await self._create_planning()

        original = await self._lock_event(event_id, "cancel")
        await process_cancel({"reason": "off"}, original)

        unrelated = await self._planning_dict(planning_id)
        self.assertEqual("draft", unrelated["state"])

    # -------------------------------------------------------------- reschedule
    async def test_reschedule_event_in_use_duplicates_and_reschedules_planning(self):
        event_id = await self._create_event()
        planning_id = await self._create_planning(
            related_events=[{"_id": event_id, "link_type": "primary"}],
        )

        original = await self._lock_event(event_id, "reschedule")
        updates = {
            "reason": "moved",
            "dates": {"start": "2026-07-15T15:30:55+0000", "end": "2026-07-15T17:30:55+0000"},
        }
        rescheduled = await process_reschedule_event(updates, original)

        # The in-use Event is marked rescheduled and points at the duplicate
        self.assertEqual("rescheduled", rescheduled["state"])
        self.assertIsNotNone(rescheduled.get("reschedule_to"))

        # The related Planning item is rescheduled in the same collection
        linked = await self._planning_dict(planning_id)
        self.assertEqual("rescheduled", linked["state"])

    # ------------------------------------------------------------- update_time
    async def test_update_time_single_event(self):
        event_id = await self._create_event()
        original = await self._lock_event(event_id, "update_time")

        updates = {
            "dates": {"start": "2026-06-30T18:00:00+0000", "end": "2026-06-30T19:00:00+0000"},
        }
        updated = await process_update_time(updates, original)
        self.assertEqual("2026-06-30T18:00:00+0000", updated["dates"]["start"].strftime("%Y-%m-%dT%H:%M:%S%z"))

    # ------------------------------------------------------- update_repetitions
    async def test_internal_series_excludes_planning_sharing_recurrence_id(self):
        # get_internal_series must return only Events of the series, never a
        # Planning item that happens to share the recurrence_id.
        recurrence_id = "recurrence-xyz"
        first_id = await self._create_event(
            recurrence_id=recurrence_id,
            dates={"start": "2026-06-01T10:00:00+0000", "end": "2026-06-01T11:00:00+0000"},
        )
        second_id = await self._create_event(
            recurrence_id=recurrence_id,
            dates={"start": "2026-06-08T10:00:00+0000", "end": "2026-06-08T11:00:00+0000"},
        )
        planning_id = await self._create_planning(recurrence_id=recurrence_id)

        original = await self._event_dict(first_id)
        series = await get_internal_series(original)
        series_ids = {item["_id"] for item in series}

        self.assertEqual({first_id, second_id}, series_ids)
        self.assertNotIn(planning_id, series_ids)

    # ---------------------------------------------------- related-planning read
    async def test_event_has_planning_items_reads_unified_index(self):
        event_id = await self._create_event()
        self.assertFalse(await event_has_planning_items(event_id))

        await self._create_planning(related_events=[{"_id": event_id, "link_type": "primary"}])
        self.assertTrue(await event_has_planning_items(event_id))
