from copy import deepcopy

import pytz
from bson import ObjectId
from mock import Mock, patch
from datetime import datetime, timedelta, timezone

from planning.unified.actions import process_update_repetitions
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types import UnifiedPlanningResource, LockFields, PlanningItemType
from planning.types.unified import RecurringFrequency
from planning.unified.common import generate_recurring_dates, get_recurring_timeline
from planning.locks.lock import lock_item

from planning.tests import TestCase, fixtures as planning_fixtures


class BaseRecurringTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

        self.items_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()


class RecurringItemsTestCase(BaseRecurringTestCase):
    async def get_all_events(self) -> list[UnifiedPlanningResource]:
        return [item async for item in await self.items_service.find({}, sort=[("dates.start", 1)])]

    def assert_planning_schedule(self, items: list[UnifiedPlanningResource], item_count: int) -> None:
        self.assertEqual(len(items), item_count)
        for item in items:
            self.assertEqual(item.dates.start, item.planning_schedule[0].scheduled)

    def test_recurring_dates_generation(self):
        # Every other thurdsay and friday afternoon on January 2016
        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 1, 15, 0),
                    frequency=RecurringFrequency.WEEKLY,
                    byday="TH FR",
                    interval=2,
                    until=datetime(2016, 2, 1),
                    end_repeat_mode="until",
                )
            ),
            [
                datetime(2016, 1, 1, 15, 0, tzinfo=timezone.utc),  # friday 1st
                datetime(2016, 1, 14, 15, 0, tzinfo=timezone.utc),  # thursday 14th
                datetime(2016, 1, 15, 15, 0, tzinfo=timezone.utc),  # friday 15th
                datetime(2016, 1, 28, 15, 0, tzinfo=timezone.utc),  # thursday 28th
                datetime(2016, 1, 29, 15, 0, tzinfo=timezone.utc),  # friday 29th
            ],
        )
        # Every working day - 2 cycles
        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 1),
                    frequency=RecurringFrequency.WEEKLY,
                    byday="MO TU WE TH FR",
                    count=2,
                    end_repeat_mode="count",
                )
            ),
            [
                datetime(2016, 1, 1, tzinfo=timezone.utc),  # friday
                datetime(2016, 1, 4, tzinfo=timezone.utc),  # monday
                datetime(2016, 1, 5, tzinfo=timezone.utc),
                datetime(2016, 1, 6, tzinfo=timezone.utc),
                datetime(2016, 1, 7, tzinfo=timezone.utc),
                datetime(2016, 1, 8, tzinfo=timezone.utc),  # friday again
                datetime(2016, 1, 11, tzinfo=timezone.utc),
                datetime(2016, 1, 12, tzinfo=timezone.utc),
                datetime(2016, 1, 13, tzinfo=timezone.utc),
                datetime(2016, 1, 14, tzinfo=timezone.utc),
            ],
        )
        # Next 4 Summer Olympics
        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 2),
                    frequency=RecurringFrequency.YEARLY,
                    interval=4,
                    count=4,
                    end_repeat_mode="count",
                )
            ),
            [
                datetime(2016, 1, 2, tzinfo=timezone.utc),
                datetime(2020, 1, 2, tzinfo=timezone.utc),
                datetime(2024, 1, 2, tzinfo=timezone.utc),
                datetime(2028, 1, 2, tzinfo=timezone.utc),
            ],
        )
        # All my birthdays
        my_birthdays = generate_recurring_dates(
            start=datetime(1989, 12, 13),
            frequency=RecurringFrequency.YEARLY,
            end_repeat_mode="count",
            count=200,
        )
        self.assertTrue(datetime(1989, 12, 13, tzinfo=timezone.utc) in my_birthdays)
        self.assertTrue(datetime(2016, 12, 13, tzinfo=timezone.utc) in my_birthdays)
        self.assertTrue(datetime(2179, 12, 13, tzinfo=timezone.utc) in my_birthdays)
        # Time zone
        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 11, 17, 23, 00),
                    frequency=RecurringFrequency.WEEKLY,
                    byday="FR",
                    count=3,
                    end_repeat_mode="count",
                    tz=pytz.timezone("Europe/Berlin"),
                )
            ),
            [
                datetime(2016, 11, 17, 23, 00, tzinfo=timezone.utc),  # it's friday in Berlin
                datetime(2016, 11, 24, 23, 00, tzinfo=timezone.utc),  # it's friday in Berlin
                datetime(2016, 12, 1, 23, 00, tzinfo=timezone.utc),  # it's friday in Berlin
            ],
        )

    async def test_get_recurring_timeline(self):
        await self.items_service.create([planning_fixtures.recurring.daily_series()])
        items = await self.get_all_events()
        selected = items[5]
        (historic, past, future) = await get_recurring_timeline(selected)

        self.assertEqual(len(historic + past + [selected] + future), 10)
        self.assertEqual(len(historic), 2)
        self.assertEqual(len(past), 3)
        self.assertEqual(len(future), 4)

        expected_time = items[0].dates.start
        for e in historic:
            self.assertEqual(e.dates.start, expected_time)
            expected_time += timedelta(days=1)

        for e in past:
            self.assertEqual(e.dates.start, expected_time)
            expected_time += timedelta(days=1)

        self.assertEqual(selected.dates.start, expected_time)
        expected_time += timedelta(days=1)

        for e in future:
            self.assertEqual(e.dates.start, expected_time)
            expected_time += timedelta(days=1)

    async def test_planning_schedule_for_recurring_event(self):
        await self.items_service.create([planning_fixtures.recurring.daily_series()])
        items = await self.get_all_events()
        self.assert_planning_schedule(items, 10)

    async def test_planning_schedule_update_repetitions(self):
        event = {
            "name": "Friday Club",
            "type": PlanningItemType.EVENT,
            "dates": {
                "start": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "end_repeat_mode": "count",
                },
            },
        }

        await self.items_service.create([event])
        events = await self.get_all_events()
        self.assert_planning_schedule(events, 3)

        schedule = deepcopy(event["dates"])
        schedule["recurring_rule"]["count"] = 5

        await process_update_repetitions({"dates": schedule}, events[0], require_lock=False)

        events = await self.get_all_events()
        self.assert_planning_schedule(events, 5)

    async def test_planning_schedule_convert_to_recurring(self):
        event = {
            "name": "Friday Club",
            "type": PlanningItemType.EVENT,
            "dates": {
                "start": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
            },
        }

        await self.items_service.create([event])
        events = await self.get_all_events()
        event = events[0]
        event_dict = event.to_dict()

        self.assert_planning_schedule([event], 1)

        locked_event = await lock_item(event, LockFields(lock_action="convert_recurring"))
        self.assertEqual(locked_event.lock_action, "convert_recurring")

        schedule = deepcopy(event_dict.get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC)
        schedule["end"] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC)
        schedule["recurring_rule"] = {
            "frequency": "DAILY",
            "interval": 1,
            "count": 3,
            "end_repeat_mode": "count",
        }

        await self.items_service.update(event.id, {"dates": schedule})
        events = await self.get_all_events()
        self.assert_planning_schedule(events, 3)

    async def test_tbc_preserved_for_recurring_event_creation(self):
        event = {
            "name": "TBC Recurring Event",
            "type": PlanningItemType.EVENT,
            "_time_to_be_confirmed": True,
            "dates": {
                "start": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count",
                },
            },
        }

        await self.items_service.create([event])
        events = await self.get_all_events()
        self.assert_planning_schedule(events, 3)

        for evt in events:
            self.assertTrue(
                evt.time_to_be_confirmed,
                f"Event {evt.id} should have _time_to_be_confirmed=True, " f"got {evt.time_to_be_confirmed}",
            )

    async def test_tbc_preserved_for_update_repetitions(self):
        event = {
            "name": "TBC Update Repetitions",
            "type": PlanningItemType.EVENT,
            "_time_to_be_confirmed": True,
            "dates": {
                "start": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
                "recurring_rule": {
                    "frequency": "DAILY",
                    "interval": 1,
                    "count": 3,
                    "endRepeatMode": "count",
                },
            },
        }

        await self.items_service.create([event])
        events = await self.get_all_events()
        self.assert_planning_schedule(events, 3)

        schedule = deepcopy(events[0].dates)
        schedule.recurring_rule.count = 5

        await process_update_repetitions({"dates": schedule.to_dict()}, events[0], require_lock=False)

        events = await self.get_all_events()
        self.assert_planning_schedule(events, 5)

        for evt in events:
            self.assertTrue(
                evt.time_to_be_confirmed,
                f"Event {evt.id} should have _time_to_be_confirmed=True, " f"got {evt.time_to_be_confirmed}",
            )
