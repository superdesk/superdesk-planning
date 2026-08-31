from superdesk.core.utils import str_to_date
from superdesk.tests import fixtures
from superdesk.tests import setup_db_user

from planning.types import UnifiedPlanningResource, PlanningTemplateResource
from planning.tests import TestCase, fixtures as planning_fixtures


class RecentTemplatesTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.headers = []
        await setup_db_user(self, fixtures.users.admin().to_dict())

    async def _get_template_order(self, assert_total: int | None = None, limit: int | None = None) -> list[str]:
        url = "/api/recent_events_template"
        if limit:
            url += f"?limit={limit}"
        response = await self.test_client.get(url, headers=self.headers)
        body = await response.get_json()
        if assert_total is not None:
            self.assertEqual(body["_meta"]["total"], assert_total)
        return [template["template_name"] for template in body["_items"]]

    async def test_listing_recent_events(self):
        resource_service = UnifiedPlanningResource.get_service()
        template_service = PlanningTemplateResource.get_service()

        original_events = [
            {
                **planning_fixtures.events.event1(),
                "_created": str_to_date("2026-06-10T09:00:00+0000"),
            },
            {
                **planning_fixtures.events.event1(),
                "_id": "event2",
                "guid": "event2",
                "_created": str_to_date("2026-06-10T09:00:00+0000"),
            },
            {
                **planning_fixtures.events.event1(),
                "_id": "event3",
                "guid": "event3",
                "_created": str_to_date("2026-06-10T09:00:00+0000"),
            },
        ]

        await resource_service.mongo_async.insert_many(original_events)

        templates = await template_service.create(
            [
                PlanningTemplateResource(
                    template_name="Grand Prix 3 - Used", based_on_event=original_events[1]["guid"]
                ),
                PlanningTemplateResource(
                    template_name="Grand Prix 1 - Unused", based_on_event=original_events[0]["guid"]
                ),
                PlanningTemplateResource(
                    template_name="Grand Prix 4 - Unused", based_on_event=original_events[2]["guid"]
                ),
                PlanningTemplateResource(
                    template_name="Grand Prix 2 - Used", based_on_event=original_events[0]["guid"]
                ),
            ]
        )

        # 1. Test 0 used templates, sorting the rest by name
        self.assertEqual(
            await self._get_template_order(4),
            [
                # None used: sorted by name
                "Grand Prix 1 - Unused",
                "Grand Prix 2 - Used",
                "Grand Prix 3 - Used",
                "Grand Prix 4 - Unused",
            ],
        )

        # 2. Test 1 used template, sorting the rest by name
        await resource_service.mongo_async.insert_one(
            {
                **planning_fixtures.events.event1(),
                "_id": "event4",
                "guid": "event4",
                "_created": str_to_date("2026-06-10T09:00:00+0000"),
                "template": templates[3].id,  # "Grand Prix 2 - Used"
            }
        )
        self.assertEqual(
            await self._get_template_order(4),
            [
                # Only 1 used
                "Grand Prix 2 - Used",
                # Rest sorted by name
                "Grand Prix 1 - Unused",
                "Grand Prix 3 - Used",
                "Grand Prix 4 - Unused",
            ],
        )

        # 3. Test 2 used templates, sorting the rest by name
        await resource_service.mongo_async.insert_one(
            {
                **planning_fixtures.events.event1(),
                "_id": "event5",
                "guid": "event5",
                "_created": str_to_date("2026-06-11T09:00:00+0000"),
                "template": templates[0].id,  # "Grand Prix 3 - Used"
            }
        )
        self.assertEqual(
            await self._get_template_order(4),
            [
                # 2 used, sorted by _created of Event
                "Grand Prix 3 - Used",
                "Grand Prix 2 - Used",
                # Rest sorted by name
                "Grand Prix 1 - Unused",
                "Grand Prix 4 - Unused",
            ],
        )

        # 4. Test the `limit` param to restrict recently used by 1, sorting the rest by name
        self.assertEqual(
            await self._get_template_order(4, limit=1),
            [
                # 1 used, matching the limit param
                "Grand Prix 3 - Used",
                # Rest sorted by name (including those in use outside the limit)
                "Grand Prix 1 - Unused",
                "Grand Prix 2 - Used",
                "Grand Prix 4 - Unused",
            ],
        )
