from superdesk.utc import get_date
from planning.types.unified import UnifiedPlanningResource
from planning.tests import TestCase


class TestUnifiedPlanningResourceService(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.service = UnifiedPlanningResource.get_service()

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
