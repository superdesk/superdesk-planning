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

    async def test_save_and_post_recurring_event_with_direct_coverages(self):
        event = planning_fixtures.recurring.daily_series()
        event.dates.start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        event.dates.end = event.dates.start + timedelta(hours=1)
        event.dates.recurring_rule.count = 3
        coverage = {
            "coverage_id": "tempId-text",
            "planning": {
                "g2_content_type": "text",
                "scheduled": event.dates.end + timedelta(hours=1),
            },
            "news_coverage_status": {
                "qcode": "ncostat:int",
                "name": "coverage intended",
                "label": "Planned",
            },
        }
        await self.items_service.create([event.clone_with({"coverages": [coverage]})])
        events = await self.get_all_events()
        selected = events[1]
        coverages = selected.to_dict()["coverages"]
        coverages.append(
            {
                **coverage,
                "coverage_id": "tempId-picture",
                "planning": {
                    "g2_content_type": "picture",
                    "scheduled": selected.dates.end + timedelta(hours=1),
                },
            }
        )

        await self.items_service.update(
            selected.id,
            {
                "coverages": coverages,
                "pubstatus": "usable",
                "state": "scheduled",
                "update_method": "all",
            },
        )

        for item in await self.get_all_events():
            self.assertEqual(item.pubstatus, "usable")
            self.assertEqual(item.state, "scheduled")
            self.assertEqual(
                [coverage.planning.g2_content_type for coverage in item.coverages],
                ["text", "picture"],
            )

    def get_coverage(self, coverage_id: str, scheduled: datetime, content_type: str = "text") -> dict:
        return {
            "coverage_id": coverage_id,
            "planning": {"g2_content_type": content_type, "scheduled": scheduled},
            "news_coverage_status": {"qcode": "ncostat:int", "name": "coverage intended", "label": "Planned"},
        }

    async def create_series(self, coverages: list[dict] | None = None) -> list[UnifiedPlanningResource]:
        event = planning_fixtures.recurring.daily_series()
        event.dates.start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        event.dates.end = event.dates.start + timedelta(hours=1)
        assert event.dates.recurring_rule is not None
        event.dates.recurring_rule.count = 3
        await self.items_service.create([event.clone_with({"coverages": coverages or []})])
        return await self.get_all_events()

    def assert_series_coverages(
        self, events: list[UnifiedPlanningResource], content_type: str, offset: timedelta
    ) -> list[str]:
        """Check each Event has its own copy of the Coverage, due relative to the Event's own start"""

        coverage_ids = []
        original_ids = set()
        for event in events:
            coverage = next(item for item in event.coverages or [] if item.planning.g2_content_type == content_type)
            self.assertEqual(coverage.planning.scheduled, event.dates.start + offset)
            self.assertFalse(coverage.coverage_id.startswith("tempId-"))
            coverage_ids.append(coverage.coverage_id)
            original_ids.add(coverage.original_coverage_id)

        self.assertEqual(len(set(coverage_ids)), len(events))
        self.assertEqual(len(original_ids), 1)
        self.assertIn(original_ids.pop(), coverage_ids)
        return coverage_ids

    async def test_recurring_event_coverages_follow_each_occurrence(self):
        start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        events = await self.create_series([self.get_coverage("tempId-text", start + timedelta(hours=2))])

        self.assertEqual(len(events), 3)
        self.assert_series_coverages(events, "text", timedelta(hours=2))

    async def test_convert_to_recurring_event_coverages_follow_each_occurrence(self):
        start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        event = {
            "name": "Friday Club",
            "type": PlanningItemType.EVENT,
            "dates": {"start": start, "end": start + timedelta(hours=2), "tz": "Australia/Sydney"},
            "coverages": [self.get_coverage("tempId-text", start + timedelta(hours=3))],
        }
        await self.items_service.create([event])
        event = (await self.get_all_events())[0]
        await lock_item(event, LockFields(lock_action="convert_recurring"))

        schedule = deepcopy(event.to_dict()["dates"])
        schedule["recurring_rule"] = {"frequency": "DAILY", "interval": 1, "count": 3, "end_repeat_mode": "count"}
        await self.items_service.update(event.id, {"dates": schedule})

        events = await self.get_all_events()
        self.assertEqual(len(events), 3)
        self.assert_series_coverages(events, "text", timedelta(hours=3))

    async def test_add_coverage_to_all_events_in_series(self):
        events = await self.create_series()
        selected = events[1]

        await self.items_service.update(
            selected.id,
            {
                "coverages": [self.get_coverage("tempId-text", selected.dates.start + timedelta(hours=7))],
                "update_method": "all",
            },
        )

        events = await self.get_all_events()
        self.assertEqual([len(event.coverages or []) for event in events], [1, 1, 1])
        self.assert_series_coverages(events, "text", timedelta(hours=7))

    async def test_update_coverage_in_all_events_in_series(self):
        start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        events = await self.create_series([self.get_coverage("tempId-text", start + timedelta(hours=2))])
        coverage_ids = self.assert_series_coverages(events, "text", timedelta(hours=2))
        selected = events[1]
        coverages = selected.to_dict()["coverages"]
        coverages[0]["planning"]["scheduled"] += timedelta(hours=1)
        coverages[0]["planning"]["internal_note"] = "Moved one hour later"

        await self.items_service.update(selected.id, {"coverages": coverages, "update_method": "all"})

        events = await self.get_all_events()
        self.assertEqual(self.assert_series_coverages(events, "text", timedelta(hours=3)), coverage_ids)
        for event in events:
            self.assertEqual(event.coverages[0].planning.internal_note, "Moved one hour later")

    async def test_remove_coverage_from_all_events_in_series(self):
        start = datetime(2099, 11, 21, 12, tzinfo=timezone.utc)
        events = await self.create_series([self.get_coverage("tempId-text", start + timedelta(hours=2))])

        await self.items_service.update(events[1].id, {"coverages": [], "update_method": "all"})

        events = await self.get_all_events()
        self.assertEqual([len(event.coverages or []) for event in events], [0, 0, 0])

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

    async def test_generate_dates_for_all_day(self):
        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2030, 1, 1, 1, 0),
                    frequency=RecurringFrequency.DAILY,
                    count=5,
                    all_day=True,
                )
            ),
            [
                datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 2, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 3, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 4, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 5, 1, 0, tzinfo=timezone.utc),
            ],
        )

        self.assertEqual(
            list(
                generate_recurring_dates(
                    start=datetime(2030, 1, 1, 1, 0),
                    frequency=RecurringFrequency.DAILY,
                    count=5,
                    tz=pytz.timezone("Australia/Sydney"),
                    all_day=True,
                )
            ),
            [
                datetime(2030, 1, 1, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 2, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 3, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 4, 1, 0, tzinfo=timezone.utc),
                datetime(2030, 1, 5, 1, 0, tzinfo=timezone.utc),
            ],
        )
