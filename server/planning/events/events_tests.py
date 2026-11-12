from typing import Any

import pytz
import arrow
from copy import deepcopy
from datetime import datetime, timedelta
from unittest import mock

from superdesk.utc import utcnow
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType, RelatedEventLink
from planning.tests import TestCase, fixtures as planning_fixtures
from planning.common import format_address, POST_STATE, TO_BE_CONFIRMED_FIELD
from planning.content_profiles.utils import is_post_planning_with_event_enabled
from planning.types import PlanningRelatedEventLink
from planning.unified.actions import process_reschedule_event, process_update_time
from planning.utils import get_related_planning_for_events_async


class EventsBaseTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.events_service = get_resource_service("events")
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await planning_fixtures.publish_config.configure_planning_publishing()


class EventTestCase(EventsBaseTestCase):
    def test_tbc_date_only_ranges(self):
        for timezone, start_hour in (("America/Toronto", 15), ("Australia/Sydney", 1)):
            for flag in ("no_end_time", "all_day"):
                for end_day in (20, 21, 22):
                    with self.subTest(timezone=timezone, flag=flag, end_day=end_day):
                        event = {
                            "type": "event",
                            TO_BE_CONFIRMED_FIELD: True,
                            "dates": {
                                "start": datetime(
                                    2099, 11, 21, 0 if flag == "all_day" else start_hour, tzinfo=pytz.UTC
                                ),
                                "end": datetime(2099, 11, end_day, tzinfo=pytz.UTC),
                                "tz": timezone,
                                flag: True,
                            },
                        }
                        if end_day < 21:
                            with self.assertRaisesRegex(SuperdeskApiError, "END DATE should be after START DATE"):
                                UnifiedPlanningResource.from_dict(event)
                        else:
                            UnifiedPlanningResource.from_dict(event)

    def test_tbc_compares_timed_dates_in_toronto(self):
        event = {
            "type": "event",
            TO_BE_CONFIRMED_FIELD: True,
            "dates": {
                "start": datetime(2099, 11, 21, 1, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 20, 23, tzinfo=pytz.UTC),
                "tz": "America/Toronto",
            },
        }
        UnifiedPlanningResource.from_dict(event)

    def test_tbc_allows_end_time_before_start_time_on_same_local_date(self):
        event = {
            "type": "event",
            TO_BE_CONFIRMED_FIELD: True,
            "dates": {
                "start": datetime(2099, 11, 21, 1, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 20, 23, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
            },
        }
        UnifiedPlanningResource.from_dict(event)

    def test_tbc_rejects_end_date_before_start_date(self):
        event = {
            "type": "event",
            TO_BE_CONFIRMED_FIELD: True,
            "dates": {
                "start": datetime(2099, 11, 21, 1, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 19, 23, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
            },
        }
        with self.assertRaises(SuperdeskApiError):
            UnifiedPlanningResource.from_dict(event)

    async def test_create_cancelled_event(self):
        await self.events_service.post_async(
            [
                {
                    "guid": "test",
                    "name": "Test Event",
                    "pubstatus": "cancelled",
                    "dates": {
                        "start": datetime.now(),
                        "end": datetime.now() + timedelta(days=1),
                    },
                }
            ]
        )

        event = await self.events_service.find_one_async(req=None, guid="test")
        assert event is not None
        assert event["pubstatus"] == "cancelled"


class EventLocationFormatAddress(EventsBaseTestCase):
    def test_format_address(self):
        location = {
            "address": {
                "postal_code": "2150",
                "line": ["The Pub"],
                "area": "Parramatta",
                "locality": "Sydney",
                "country": "Australia",
            },
            "name": "Parramatta",
            "location": {"lat": -33.8139843, "lon": 151.002666},
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565",
        }

        format_address(location)
        self.assertEqual(location["formatted_address"], "The Pub Parramatta Sydney 2150 Australia")

        location = {
            "address": {
                "line": [""],
            },
            "name": "Parramatta",
            "location": {"lat": -33.8139843, "lon": 151.002666},
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565",
        }

        format_address(location)
        self.assertEqual(location["formatted_address"], "")

        location = {
            "address": {},
            "name": "Parramatta",
            "location": {"lat": -33.8139843, "lon": 151.002666},
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565",
        }

        format_address(location)
        self.assertEqual(location["formatted_address"], "")

        location = {
            "address": {"line": []},
            "name": "Parramatta",
            "location": {"lat": -33.8139843, "lon": 151.002666},
            "qcode": "urn:newsml:localhost:2017-11-28T13:21:06.571812:1ce975e9-19c2-4fad-9cd6-8cda4020e565",
        }

        format_address(location)
        self.assertEqual(location["formatted_address"], "")


class EventPlanningSchedule(EventsBaseTestCase):
    async def _create_all_day_series(self):
        await self.events_service.post_async(
            [
                {
                    "name": "All-day series",
                    "dates": {
                        "start": datetime(2035, 3, 10, tzinfo=pytz.UTC),
                        "end": datetime(2035, 3, 10, tzinfo=pytz.UTC),
                        "tz": "America/Toronto",
                        "all_day": True,
                        "no_end_time": True,
                        "recurring_rule": {
                            "frequency": "DAILY",
                            "interval": 1,
                            "count": 3,
                            "endRepeatMode": "count",
                        },
                    },
                }
            ]
        )
        return sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])

    async def _get_all_events_raw(self) -> list[dict[str, Any]]:
        events_cursor = await self.events_service.get_from_mongo_async(req=None, lookup=None)
        return await events_cursor.to_list()

    async def _get_all_events(self) -> list[UnifiedPlanningResource]:
        cursor = await UnifiedPlanningResource.get_service().find({"type": PlanningItemType.EVENT.value})
        return await cursor.to_list()

    def assertPlanningSchedule(self, events, event_count):
        self.assertEqual(len(events), event_count)
        for evt in events:
            self.assertEqual(
                evt.get("dates").get("start"),
                evt.get("_planning_schedule")[0].get("scheduled"),
            )

    async def test_planning_schedule_reschedule_event(self):
        event = {
            "name": "Friday Club",
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

        # create recurring events
        await self.events_service.post_async([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        # reschedule recurring event before posting
        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)
        schedule["end"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)

        res = await process_reschedule_event({"dates": schedule}, events[0], False)
        self.assertEqual(res["dates"]["start"], schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        # post recurring events
        await get_resource_service("events_post").post_async(
            [
                {
                    "event": events[0].get("_id"),
                    "etag": events[0].get("etag"),
                    "pubstatus": "usable",
                    "update_method": "all",
                    "failed_planning_ids": [],
                }
            ]
        )

        # reschedule posted recurring event
        # Reschedule decides whether the event is in use from the `original` it is given,
        # so it has to be the posted version and not the one fetched before posting.
        posted_event = await self.events_service.find_one_async(req=None, _id=events[0].get("_id"))
        schedule = deepcopy(posted_event.get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)
        schedule["end"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)

        await process_reschedule_event({"dates": schedule}, posted_event, False)
        rescheduled_event = await self.events_service.find_one_async(req=None, _id=posted_event.get("_id"))
        self.assertEqual(rescheduled_event["dates"]["start"], posted_event["dates"]["start"])
        self.assertEqual(rescheduled_event["state"], "rescheduled")

        new_event = await self.events_service.find_one_async(req=None, _id=rescheduled_event["reschedule_to"])
        self.assertEqual(new_event["reschedule_from"], posted_event["_id"])
        self.assertEqual(new_event["dates"]["start"], schedule["start"])

        # the 3 events of the series plus the one created by the reschedule
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 4)

    async def test_planning_schedule_update_time(self):
        event = {
            "name": "Friday Club",
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

        await self.events_service.post_async([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
        schedule["end"] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

        res = await process_update_time({"dates": schedule, "update_method": "all"}, events[0], False)
        self.assertEqual(res["dates"]["start"], schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(events[1].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 20, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
        schedule["end"] = datetime(2099, 11, 21, 21, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

        res = await process_update_time({"dates": schedule, "update_method": "single"}, events[0], False)
        self.assertEqual(res["dates"]["start"], schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

    async def test_update_all_day_series_with_start_time_only(self):
        original_events = await self._create_all_day_series()
        selected = original_events[1]
        schedule = deepcopy(selected["dates"])
        schedule.update(
            start=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 11, 10)),
            all_day=False,
            no_end_time=True,
        )

        await process_update_time({"dates": schedule, "update_method": "all"}, selected, False)

        events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        self.assertEqual([event["_id"] for event in original_events], [event["_id"] for event in events])
        timezone = pytz.timezone("America/Toronto")
        self.assertEqual(
            [event["dates"]["start"].astimezone(timezone).utcoffset() for event in events],
            [timedelta(hours=-5), timedelta(hours=-4), timedelta(hours=-4)],
        )
        for day, event in enumerate(events, start=10):
            with self.subTest(day=day):
                dates = event["dates"]
                local_start = dates["start"].astimezone(timezone)
                self.assertEqual(local_start.replace(tzinfo=None), datetime(2035, 3, day, 10))
                expected_start = timezone.localize(datetime(2035, 3, day, 10))
                self.assertEqual(dates["start"], expected_start)
                self.assertEqual(dates["end"], datetime(2035, 3, day, tzinfo=pytz.UTC))
                self.assertFalse(dates["all_day"])
                self.assertTrue(dates["no_end_time"])
                self.assertEqual(event["_planning_schedule"][0]["scheduled"], expected_start)
                self.assertEqual(event["_updates_schedule"][0]["scheduled"], expected_start)

    async def test_update_future_all_day_events_with_start_and_end_times(self):
        original_events = await self._create_all_day_series()
        selected = original_events[1]
        schedule = deepcopy(selected["dates"])
        schedule.update(
            start=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 11, 10)),
            end=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 11, 11)),
            all_day=False,
            no_end_time=False,
        )

        await process_update_time({"dates": schedule, "update_method": "future"}, selected, False)

        events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        self.assertEqual([event["_id"] for event in original_events], [event["_id"] for event in events])
        self.assertEqual(events[0]["dates"], original_events[0]["dates"])
        for day, event in zip((11, 12), events[1:]):
            with self.subTest(day=day):
                dates = event["dates"]
                self.assertEqual(dates["start"], pytz.timezone("America/Toronto").localize(datetime(2035, 3, day, 10)))
                self.assertEqual(dates["end"], pytz.timezone("America/Toronto").localize(datetime(2035, 3, day, 11)))
                self.assertFalse(dates["all_day"])
                self.assertFalse(dates["no_end_time"])

    async def test_clear_times_on_a_timed_series_preserves_occurrence_dates(self):
        events = await self._create_all_day_series()
        schedule = deepcopy(events[1]["dates"])
        schedule.update(
            start=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 11, 23, 30)),
            end=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 12, 0, 30)),
            all_day=False,
            no_end_time=False,
        )
        await process_update_time({"dates": schedule, "update_method": "all"}, events[1], False)

        timed_events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        schedule = deepcopy(timed_events[1]["dates"])
        schedule.update(
            start=datetime(2035, 3, 11, tzinfo=pytz.UTC),
            end=datetime(2035, 3, 12, tzinfo=pytz.UTC),
            all_day=True,
            no_end_time=True,
        )
        await process_update_time({"dates": schedule, "update_method": "all"}, timed_events[1], False)

        events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        self.assertEqual(len(events), 3)
        for day, event in zip((10, 11, 12), events):
            with self.subTest(day=day):
                dates = event["dates"]
                self.assertEqual(dates["start"], datetime(2035, 3, day, tzinfo=pytz.UTC))
                self.assertEqual(dates["end"], datetime(2035, 3, day + 1, tzinfo=pytz.UTC))
                self.assertTrue(dates["all_day"])
                self.assertTrue(dates["no_end_time"])
                self.assertEqual(event["_planning_schedule"][0]["scheduled"], dates["start"])
                self.assertEqual(event["_updates_schedule"][0]["scheduled"], dates["start"])

    async def test_clearing_end_times_preserves_date_only_ends_across_dst(self):
        events = await self._create_all_day_series()
        schedule = deepcopy(events[1]["dates"])
        schedule.update(
            start=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 11, 23, 30)),
            end=pytz.timezone("America/Toronto").localize(datetime(2035, 3, 12, 0, 30)),
            all_day=False,
            no_end_time=False,
        )
        await process_update_time({"dates": schedule, "update_method": "all"}, events[1], False)

        events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        schedule = deepcopy(events[1]["dates"])
        schedule.update(end=datetime(2035, 3, 12, tzinfo=pytz.UTC), no_end_time=True)
        await process_update_time({"dates": schedule, "update_method": "all"}, events[1], False)

        events = sorted(await self._get_all_events_raw(), key=lambda event: event["dates"]["start"])
        self.assertEqual(len(events), 3)
        timezone = pytz.timezone("America/Toronto")
        self.assertEqual(
            [event["dates"]["start"].astimezone(timezone).utcoffset() for event in events],
            [timedelta(hours=-5), timedelta(hours=-4), timedelta(hours=-4)],
        )
        for day, event in enumerate(events, start=10):
            with self.subTest(day=day):
                dates = event["dates"]
                local_start = dates["start"].astimezone(timezone)
                self.assertEqual(local_start.replace(tzinfo=None), datetime(2035, 3, day, 23, 30))
                self.assertEqual(dates["start"], timezone.localize(datetime(2035, 3, day, 23, 30)))
                self.assertEqual(dates["end"], datetime(2035, 3, day + 1, tzinfo=pytz.UTC))
                self.assertFalse(dates["all_day"])
                self.assertTrue(dates["no_end_time"])

    async def test_tbc_preserved_for_reschedule_event(self):
        service = get_resource_service("events")
        event = {
            "name": "TBC Reschedule Event",
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

        await service.post_async([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        for evt in events:
            self.assertTrue(
                evt.get(TO_BE_CONFIRMED_FIELD),
                f"Event {evt.get('_id')} should have _time_to_be_confirmed=True after creation, "
                f"got {evt.get(TO_BE_CONFIRMED_FIELD)}",
            )

        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)
        schedule["end"] = schedule["start"] + timedelta(hours=2)

        await process_reschedule_event({"dates": schedule}, events[0], False)

        events = await self._get_all_events_raw()
        for evt in events:
            self.assertTrue(
                evt.get(TO_BE_CONFIRMED_FIELD),
                f"Event {evt.get('_id')} should have _time_to_be_confirmed=True after reschedule, "
                f"got {evt.get(TO_BE_CONFIRMED_FIELD)}",
            )


class EventsRelatedPlanningAutoPublish(EventsBaseTestCase):
    async def test_publishes_all_related_planning_search_pages(self):
        planning_service = get_resource_service("planning")
        new_events = await self.events_service.post_async(
            [
                {
                    "type": "event",
                    "name": "Event with several plans",
                    "state": "draft",
                    "dates": {
                        "start": datetime(2099, 11, 21, 11, 0, tzinfo=pytz.UTC),
                        "end": datetime(2099, 11, 21, 12, 0, tzinfo=pytz.UTC),
                    },
                }
            ]
        )
        new_plannings = await planning_service.post_async(
            [
                {
                    "type": "planning",
                    "name": f"Planning {index}",
                    "planning_date": datetime(2099, 11, 21, 12, 0, tzinfo=pytz.UTC),
                    "related_events": [{"_id": new_events[0], "link_type": "primary"}],
                }
                for index in range(3)
            ]
        )
        await test_utils.post_items(
            "planning_types",
            [
                {
                    "name": "event",
                    "type": "event",
                    "editor": {"related_plannings": {"enabled": True}},
                    "schema": {"related_plannings": {"planning_auto_publish": True}},
                }
            ],
        )
        post_request = {
            "event": new_events[0],
            "pubstatus": "usable",
            "update_method": "single",
            "failed_planning_ids": [],
        }
        with mock.patch("planning.utils.RELATED_PLANNING_PAGE_SIZE", 1):
            related_plannings = await get_related_planning_for_events_async(new_events, "primary")
            self.assertEqual([planning["_id"] for planning in related_plannings], sorted(new_plannings))
            filtered_plannings = await get_related_planning_for_events_async(
                new_events, "primary", exclude_planning_ids=[new_plannings[1]]
            )
            self.assertEqual(
                {planning["_id"] for planning in filtered_plannings}, set(new_plannings) - {new_plannings[1]}
            )
            await get_resource_service("events_post").post_async([post_request])

        self.assertEqual(post_request["failed_planning_ids"], [])
        for planning_id in new_plannings:
            planning_item = await planning_service.find_one_async(req=None, _id=planning_id)
            self.assertEqual(planning_item["state"], "scheduled")

    async def test_related_planning_validation_errors_are_reported(self):
        planning_service = get_resource_service("planning")
        event_ids = await self.events_service.post_async(
            [
                {
                    "type": "event",
                    "name": "Event",
                    "state": "draft",
                    "dates": {
                        "start": datetime(2099, 11, 21, 11, 0, tzinfo=pytz.UTC),
                        "end": datetime(2099, 11, 21, 12, 0, tzinfo=pytz.UTC),
                    },
                }
            ]
        )
        planning_ids = await planning_service.post_async(
            [
                {
                    "type": "planning",
                    "name": "Planning without a slugline",
                    "planning_date": datetime(2099, 11, 21, 12, 0, tzinfo=pytz.UTC),
                    "related_events": [{"_id": event_ids[0], "link_type": "primary"}],
                }
            ]
        )
        await test_utils.post_items(
            "planning_types",
            [
                {
                    "name": "event",
                    "type": "event",
                    "editor": {"related_plannings": {"enabled": True}},
                    "schema": {"related_plannings": {"planning_auto_publish": True}},
                },
                {
                    "name": "planning",
                    "type": "planning",
                    "editor": {"slugline": {"enabled": True}},
                    "schema": {"slugline": {"type": "string", "required": True}},
                },
            ],
        )
        post_request = {
            "event": event_ids[0],
            "pubstatus": "usable",
            "update_method": "single",
            "failed_planning_ids": [],
        }

        await get_resource_service("events_post").post_async([post_request])

        self.assertEqual(
            post_request["failed_planning_ids"],
            [{"_id": planning_ids[0], "error": ["Related planning : SLUGLINE is a required field"]}],
        )
        event_item = await self.events_service.find_one_async(req=None, _id=event_ids[0])
        planning_item = await planning_service.find_one_async(req=None, _id=planning_ids[0])
        self.assertEqual(event_item["state"], "scheduled")
        self.assertEqual(planning_item["state"], "draft")

    async def test_planning_item_is_published_with_events(self):
        planning_service = get_resource_service("planning")
        event = {
            "type": "event",
            "_id": "123",
            "occur_status": {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly",
            },
            "dates": {
                "start": datetime(2099, 11, 21, 11, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "tz": "Asia/Calcutta",
            },
            "calendars": [],
            "state": "draft",
            "language": "en",
            "languages": ["en"],
            "place": [],
            "_time_to_be_confirmed": False,
            "name": "Demo ",
            "update_method": "single",
        }
        new_events = await self.events_service.post_async([event])
        planning = {
            "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
            "name": "Demo 1",
            "place": [],
            "language": "en",
            "type": "planning",
            "slugline": "slug",
            "agendas": [],
            "languages": ["en"],
            "user": "12234553",
            "related_events": [PlanningRelatedEventLink(_id=new_events[0], link_type="primary")],
            "coverages": [
                {
                    "coverage_id": "urn:newsml:localhost:5000:2023-09-08T17:40:56.290922:e264a179-5b1a-4b52-b73b-332660848cae",
                    "planning": {
                        "scheduled": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                        "g2_content_type": "text",
                        "language": "en",
                    },
                    "news_coverage_status": {
                        "qcode": "ncostat:int",
                        "name": "coverage intended",
                        "label": "Planned",
                    },
                    "workflow_status": "draft",
                    "assigned_to": {},
                    "firstcreated": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                }
            ],
        }
        new_plannings = await planning_service.post_async([planning])
        schema = {
            "language": {
                "languages": ["en", "de"],
                "default_language": "en",
                "multilingual": True,
                "required": True,
            },
            "name": {"multilingual": True},
            "slugline": {"multilingual": True},
            "definition_short": {"multilingual": True},
            "related_plannings": {"planning_auto_publish": True},
        }
        await test_utils.post_items(
            "planning_types",
            [
                {
                    "_id": "65a000000000000000000003",
                    "name": "event",
                    "type": "event",
                    "item_type": "event",
                    "editor": {
                        "language": {"enabled": True},
                        "related_plannings": {"enabled": True},
                    },
                    "schema": schema,
                }
            ],
        )
        self.assertTrue(await is_post_planning_with_event_enabled())
        related_plannings = await get_related_planning_for_events_async(new_events, "primary")
        self.assertEqual([planning["_id"] for planning in related_plannings], new_plannings)
        now = utcnow()
        post_request = {
            "event": new_events[0],
            "pubstatus": "usable",
            "update_method": "single",
            "failed_planning_ids": [],
        }
        await get_resource_service("events_post").post_async([post_request])
        self.assertEqual(post_request["failed_planning_ids"], [])

        event_item = await self.events_service.find_one_async(req=None, _id=new_events[0])
        self.assertEqual(len([event_item]), 1)
        self.assertEqual(event_item.get("state"), "scheduled")

        planning_item = await planning_service.find_one_async(req=None, _id=new_plannings[0])
        self.assertEqual(len([planning_item]), 1)
        self.assertEqual(planning_item.get("state"), "scheduled")
        assert now <= arrow.get(planning_item.get("versionposted")).datetime < now + timedelta(seconds=5)

    async def test_new_planning_is_published_when_adding_to_published_event(self):
        planning_service = get_resource_service("planning")

        await test_utils.post_items(
            "planning_types",
            [
                {
                    "name": "event",
                    "type": "event",
                    "editor": {"related_plannings": {"enabled": True}},
                    "schema": {"related_plannings": {"planning_auto_publish": True}},
                }
            ],
        )
        new_events = await self.events_service.post_async(
            [
                {
                    "type": "event",
                    "occur_status": {
                        "qcode": "eocstat:eos5",
                        "name": "Planned, occurs certainly",
                        "label": "Planned, occurs certainly",
                    },
                    "dates": {
                        "start": datetime(2099, 11, 21, 11, 00, 00, tzinfo=pytz.UTC),
                        "end": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                        "tz": "Australia/Sydney",
                    },
                    "state": "draft",
                    "name": "Demo",
                }
            ]
        )
        post_request = {
            "event": new_events[0],
            "pubstatus": "usable",
            "update_method": "single",
            "failed_planning_ids": [],
        }
        await get_resource_service("events_post").post_async([post_request])
        self.assertEqual(post_request["failed_planning_ids"], [])
        new_plannings = await planning_service.post_async(
            [
                {
                    "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    "name": "Demo 1",
                    "type": "planning",
                    "related_events": [RelatedEventLink(_id=new_events[0]).to_dict()],
                }
            ]
        )

        event_item = await self.events_service.find_one_async(req=None, _id=new_events[0])
        self.assertIsNotNone(event_item)
        self.assertEqual(event_item["pubstatus"], POST_STATE.USABLE)

        planning_item = await planning_service.find_one_async(req=None, _id=new_plannings[0])
        self.assertIsNotNone(planning_item)

        # TODO-ASYNC: fix once `events_post` is migrated
        self.assertEqual(planning_item["pubstatus"], POST_STATE.USABLE)

    async def test_related_planning_item_fields_validation_on_post(self):
        planning_service = get_resource_service("planning")
        event = {
            "type": "event",
            "_id": "1234",
            "occur_status": {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly",
            },
            "dates": {
                "start": datetime(2099, 11, 21, 11, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "tz": "Asia/Calcutta",
            },
            "calendars": [],
            "state": "draft",
            "language": "en",
            "languages": ["en"],
            "place": [],
            "_time_to_be_confirmed": False,
            "name": "Demo ",
            "update_method": "single",
        }
        new_events = await self.events_service.post_async([event])
        planning = {
            "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
            "name": "Demo 1",
            "place": [],
            "language": "en",
            "type": "planning",
            "slugline": "slug",
            "agendas": [],
            "languages": ["en"],
            "event_item": new_events[0],
            "related_events": [
                {
                    "_id": new_events[0],
                    "link_type": "primary",
                }
            ],
            "coverages": [
                {
                    "coverage_id": "urn:newsmle264a179-5b1a-4b52-b73b-332660848cae",
                    "planning": {
                        "scheduled": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                        "g2_content_type": "text",
                        "language": "en",
                        "genre": [],
                    },
                    "news_coverage_status": {
                        "qcode": "ncostat:int",
                        "name": "coverage intended",
                        "label": "Planned",
                    },
                    "workflow_status": "draft",
                    "assigned_to": {},
                    "firstcreated": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                }
            ],
        }
        new_plannings = await planning_service.post_async([planning])
        await test_utils.post_items(
            "planning_types",
            [
                {
                    "_id": "65a000000000000000000001",
                    "name": "event",
                    "type": "event",
                    "item_type": "event",
                    "editor": {
                        "related_plannings": {"enabled": True},
                    },
                    "schema": {
                        "related_plannings": {"planning_auto_publish": True},
                    },
                },
                {
                    "_id": "65a000000000000000000002",
                    "name": "planning",
                    "type": "planning",
                    "item_type": "planning",
                    "editor": {"subject": {"enabled": False}, "planning_date": {"enabled": True}},
                    "schema": {
                        "subject": {"required": True},
                        "planning_date": {"type": "datetime", "required": True, "validate_on_post": True},
                    },
                },
            ],
        )
        self.assertTrue(await is_post_planning_with_event_enabled())
        related_plannings = await get_related_planning_for_events_async(new_events, "primary")
        self.assertEqual([planning["_id"] for planning in related_plannings], new_plannings)
        post_request = {
            "event": new_events[0],
            "pubstatus": "usable",
            "update_method": "single",
            "failed_planning_ids": [],
        }
        await get_resource_service("events_post").post_async([post_request])
        self.assertEqual(post_request["failed_planning_ids"], [])

        event_item = await self.events_service.find_one_async(req=None, _id=new_events[0])
        self.assertEqual(len([event_item]), 1)
        self.assertEqual(event_item.get("state"), "scheduled")

        planning_item = await planning_service.find_one_async(req=None, _id=new_plannings[0])
        self.assertEqual(len([planning_item]), 1)
        self.assertEqual(planning_item.get("state"), "scheduled")
        stored_plan = await UnifiedPlanningResource.get_service().find_by_id(new_plannings[0])
        self.assertEqual(stored_plan.dates.start, datetime(2099, 11, 21, 12, 0, tzinfo=pytz.UTC))
