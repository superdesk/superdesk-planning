from bson import ObjectId

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.unified.actions import process_spike, process_unspike, process_postpone, process_duplicate
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceActionsTestCase(TestCase):
    """Spike/unspike, postpone and duplicate are merged into a single, item_type
    dispatched implementation (SDBELGA-1119). Both the ``events/*`` and
    ``planning/*`` endpoints call the same ``process_*`` entry points; these tests
    exercise them against the single ``unified_planning`` collection for both
    item types.
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
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
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

    async def _planning_dict(self, planning_id: str) -> dict:
        return await self.planning_service.find_one_async(req=None, _id=planning_id)

    # planning items
    async def test_spike_and_unspike_planning_item(self):
        planning_id = await self._create_planning()

        original = await self._planning_dict(planning_id)
        self.assertEqual("draft", original["state"])

        spiked = await process_spike({}, original)
        self.assertEqual("spiked", spiked["state"])
        self.assertEqual("draft", spiked["revert_state"])
        # `expiry` is set from PLANNING_EXPIRY_MINUTES (None in tests) but must be present
        self.assertIn("expiry", spiked)

        original = await self._planning_dict(planning_id)
        unspiked = await process_unspike({}, original)
        self.assertEqual("draft", unspiked["state"])
        self.assertIsNone(unspiked["revert_state"])

    async def test_postpone_planning_item(self):
        planning_id = await self._create_planning()
        original = await self._planning_dict(planning_id)

        postponed = await process_postpone({"reason": "venue lost"}, original)
        self.assertEqual("postponed", postponed["state"])
        self.assertEqual("venue lost", postponed["state_reason"])

    async def test_postpone_planning_fires_history_signal(self):
        # The direct planning postpone must fire `planning_postponed` (history);
        # the merged code fires it inside process_postpone_planning_item.
        from planning import signals

        fired = []

        async def _listener(updates, original):
            fired.append((updates, original))

        signals.planning_postponed.connect(_listener)
        try:
            planning_id = await self._create_planning()
            original = await self._planning_dict(planning_id)
            await process_postpone({"reason": "x"}, original)
            self.assertEqual(1, len(fired))
        finally:
            signals.planning_postponed.clear_listeners()

    async def test_duplicate_planning_item(self):
        planning_id = await self._create_planning(slugline="dup-me")
        original = await self._planning_dict(planning_id)

        duplicated = await process_duplicate(original)
        self.assertNotEqual(planning_id, duplicated["_id"])
        self.assertEqual("draft", duplicated["state"])
        self.assertEqual("planning", duplicated["type"])

        # Both the original and the duplicate exist in the unified collection
        self.assertIsNotNone(await self._planning_dict(planning_id))
        self.assertIsNotNone(await self._planning_dict(duplicated["_id"]))

    # event items
    async def test_spike_event_cascades_to_linked_planning(self):
        event_id = await self._create_event()
        planning_id = await self._create_planning(
            related_events=[{"_id": event_id, "link_type": "primary"}],
        )

        original = await self._event_dict(event_id)
        spiked = await process_spike({}, original)
        self.assertEqual("spiked", spiked["state"])

        # The linked draft Planning item is spiked as part of the event spike
        linked = await self._planning_dict(planning_id)
        self.assertEqual("spiked", linked["state"])

    async def test_duplicate_event_is_rejected(self):
        event_id = await self._create_event()
        original = await self._event_dict(event_id)

        with self.assertRaises(SuperdeskApiError) as ctx:
            await process_duplicate(original)
        self.assertEqual(400, ctx.exception.status_code)

    async def test_event_series_timeline_excludes_planning_items(self):
        # A Planning item sharing an Event's `recurrence_id` must NOT be pulled
        # into the event series (both live in the one `unified_planning` collection).
        from planning.events.events_utils import get_recurring_timeline

        recurrence_id = "recurrence-abc"
        selected_id = await self._create_event(
            recurrence_id=recurrence_id,
            dates={"start": "2026-06-01T10:00:00+0000", "end": "2026-06-01T11:00:00+0000"},
        )
        sibling_event_id = await self._create_event(
            recurrence_id=recurrence_id,
            dates={"start": "2026-06-08T10:00:00+0000", "end": "2026-06-08T11:00:00+0000"},
        )
        planning_id = await self._create_planning(recurrence_id=recurrence_id)

        selected = await self._event_dict(selected_id)
        historic, past, future = await get_recurring_timeline(selected)
        series_ids = {item["_id"] for item in historic + past + future}

        self.assertIn(sibling_event_id, series_ids)
        self.assertNotIn(planning_id, series_ids)

    # dispatch
    async def test_dispatch_routes_by_item_type(self):
        event_id = await self._create_event()
        planning_id = await self._create_planning()

        spiked_event = await process_spike({}, await self._event_dict(event_id))
        spiked_planning = await process_spike({}, await self._planning_dict(planning_id))

        # Event spike issues an `events:spiked` notification path; planning a
        # `planning:spiked` one. Both land as spiked in the same collection.
        self.assertEqual("event", spiked_event["type"])
        self.assertEqual("spiked", spiked_event["state"])
        self.assertEqual("planning", spiked_planning["type"])
        self.assertEqual("spiked", spiked_planning["state"])
