from planning.feeding_services.event_http_service import EventHTTPFeedingService
from planning.tests import TestCase


class EventHTTPFeedingServiceTestCase(TestCase):
    async def test_update(self):
        service = EventHTTPFeedingService()
        provider = {
            "_id": "ics_20",
            "name": "ics20",
            "feed_parser": "ics20",
            "config": {
                "url": "https://gist.github.com/vied12/9efa0655704c05b6e442c581c9eb1f89/"
                + "raw/539d2911052f5d03713811ebe19ca594391d6b80/event.ics",
            },
        }

        events = [event async for event in await service.update(provider, {})]
        self.assertEqual(len(events), 1)
