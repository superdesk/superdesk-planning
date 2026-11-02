from eve.utils import ParsedRequest

from superdesk import get_resource_service
from superdesk.utc import get_date
from superdesk.tests import utils as test_utils
from planning.types import AgendasResourceModel, UnifiedPlanningHistoryResource
from planning.types.unified import UnifiedPlanningResource
from planning.tests import TestCase, fixtures


class TestUnifiedPlanningResourceService(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.service = UnifiedPlanningResource.get_service()
        await test_utils.post_items("vocabularies", fixtures.cvs.all_cvs())

    async def test_creating_an_event(self):
        events = await self.service.create(
            [
                {
                    "type": "event",
                    "dates": {
                        "start": "2029-10-12T14:00:00+0000",
                        "end": "2029-10-12T16:00:00+0000",
                    },
                }
            ]
        )

        self.assertEqual(len(events), 1)
        self.assertIsNotNone(events[0].dates)
        self.assertEqual(events[0].dates.start, get_date("2029-10-12T14:00:00+0000"))

        event = await self.service.find_by_id(events[0].id)

        self.assertIsNotNone(event)
        self.assertEqual(events[0].id, event.id)
        self.assertEqual(events[0].dates.start, event.dates.start)

    async def test_noop_update_does_not_record_transient_fields_in_history(self):
        event = (
            await self.service.create(
                [
                    {
                        "type": "event",
                        "dates": {"start": "2029-10-12T14:00:00+0000", "end": "2029-10-12T16:00:00+0000"},
                    }
                ]
            )
        )[0]

        await self.service.update(event.id, {"update_method": "single", "embedded_planning": []})

        history = await UnifiedPlanningHistoryResource.get_service().find({"item_id": event.id})
        self.assertEqual([entry.operation async for entry in history], ["create"])

    async def test_published_agendas_preserve_reference_order(self):
        agendas = await AgendasResourceModel.get_service().create([{"name": "First"}, {"name": "Second"}])
        agenda_ids = [agendas[1].id, agendas[0].id]
        document = {"type": "planning", "published_item": {"agendas": agenda_ids}}
        request = ParsedRequest()
        request.embedded = '{"agendas": 1}'

        await get_resource_service("published_planning")._resolve_embedded_item(document, request)

        self.assertEqual(
            [agenda["_id"] for agenda in document["published_item"]["agendas"]],
            [str(agenda_id) for agenda_id in agenda_ids],
        )

    async def test_duplicate_link_update_does_not_record_an_edited_history_entry(self):
        event = (
            await self.service.create(
                [
                    {
                        "type": "event",
                        "dates": {"start": "2029-10-12T14:00:00+0000", "end": "2029-10-12T16:00:00+0000"},
                    }
                ]
            )
        )[0]

        await self.service.update(event.id, {"duplicate_to": ["event-copy"]})

        history = await UnifiedPlanningHistoryResource.get_service().find({"item_id": event.id})
        self.assertEqual([entry.operation async for entry in history], ["create"])
