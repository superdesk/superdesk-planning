# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any

import pytz
import arrow
from pytest import mark
from copy import deepcopy
from bson import ObjectId
from mock import Mock, patch
from datetime import datetime, timedelta

from planning.planning import PlanningAsyncService
from planning.types.common import RelatedEvent
from superdesk.utc import utcnow
from superdesk import get_resource_service

from planning.tests import TestCase
from planning.common import format_address, POST_STATE
from planning.item_lock import LockService
from planning.events.events import generate_recurring_dates
from planning.types import PlanningRelatedEventLink
from planning.events import EventsAsyncService
from planning.events.events_utils import get_recurring_timeline


class EventsBaseTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.events_service = EventsAsyncService()


class EventTestCase(EventsBaseTestCase):
    def test_recurring_dates_generation(self):
        # Every other thurdsay and friday afternoon on January 2016
        self.assertEquals(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 1, 15, 0),
                    frequency="WEEKLY",
                    byday="TH FR",
                    interval=2,
                    until=datetime(2016, 2, 1),
                    end_repeat_mode="until",
                )
            ),
            [
                datetime(2016, 1, 1, 15, 0),  # friday 1st
                datetime(2016, 1, 14, 15, 0),  # thursday 14th
                datetime(2016, 1, 15, 15, 0),  # friday 15th
                datetime(2016, 1, 28, 15, 0),  # thursday 28th
                datetime(2016, 1, 29, 15, 0),  # friday 29th
            ],
        )
        # Every working day - 2 cycles
        self.assertEquals(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 1),
                    frequency="WEEKLY",
                    byday="MO TU WE TH FR",
                    count=2,
                    end_repeat_mode="count",
                )
            ),
            [
                datetime(2016, 1, 1),  # friday
                datetime(2016, 1, 4),  # monday
                datetime(2016, 1, 5),
                datetime(2016, 1, 6),
                datetime(2016, 1, 7),
                datetime(2016, 1, 8),  # friday again
                datetime(2016, 1, 11),
                datetime(2016, 1, 12),
                datetime(2016, 1, 13),
                datetime(2016, 1, 14),
            ],
        )
        # Next 4 Summer Olympics
        self.assertEquals(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 1, 2),
                    frequency="YEARLY",
                    interval=4,
                    count=4,
                    end_repeat_mode="count",
                )
            ),
            [
                datetime(2016, 1, 2),
                datetime(2020, 1, 2),
                datetime(2024, 1, 2),
                datetime(2028, 1, 2),
            ],
        )
        # All my birthdays
        my_birthdays = generate_recurring_dates(
            start=datetime(1989, 12, 13),
            frequency="YEARLY",
            end_repeat_mode="count",
            count=200,
        )
        self.assertTrue(datetime(1989, 12, 13) in my_birthdays)
        self.assertTrue(datetime(2016, 12, 13) in my_birthdays)
        self.assertTrue(datetime(2179, 12, 13) in my_birthdays)
        # Time zone
        self.assertEquals(
            list(
                generate_recurring_dates(
                    start=datetime(2016, 11, 17, 23, 00),
                    frequency="WEEKLY",
                    byday="FR",
                    count=3,
                    end_repeat_mode="count",
                    tz=pytz.timezone("Europe/Berlin"),
                )
            ),
            [
                datetime(2016, 11, 17, 23, 00),  # it's friday in Berlin
                datetime(2016, 11, 24, 23, 00),  # it's friday in Berlin
                datetime(2016, 12, 1, 23, 00),  # it's friday in Berlin
            ],
        )

    async def test_get_recurring_timeline(self):
        generated_events = generate_recurring_events(10)
        self.app.data.insert("events", generated_events)

        selected = await self.events_service.find_one_raw(name="Event 5")
        self.assertEquals("Event 5", selected["name"])

        (historic, past, future) = await get_recurring_timeline(selected)

        self.assertEquals(2, len(historic))
        self.assertEquals(3, len(past))
        self.assertEquals(4, len(future))

        expected_time = generated_events[0]["dates"]["start"]
        for e in historic:
            self.assertEquals(e["dates"]["start"], expected_time)
            expected_time += timedelta(days=1)

        for e in past:
            self.assertEquals(e["dates"]["start"], expected_time)
            expected_time += timedelta(days=1)

        self.assertEquals(selected["dates"]["start"], expected_time)
        expected_time += timedelta(days=1)

        for e in future:
            self.assertEquals(e["dates"]["start"], expected_time)
            expected_time += timedelta(days=1)

    async def test_create_cancelled_event(self):
        await self.events_service.create(
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

        event = await self.events_service.find_one(guid="test")
        assert event is not None
        assert event.pubstatus == "cancelled"


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
    async def _get_all_events_raw(self) -> list[dict[str, Any]]:
        events_cursor = await self.events_service.find({})
        return await events_cursor.to_list_raw()

    def assertPlanningSchedule(self, events, event_count):
        self.assertEqual(len(events), event_count)
        for evt in events:
            self.assertEqual(
                evt.get("dates").get("start"),
                evt.get("_planning_schedule")[0].get("scheduled"),
            )

    async def test_planning_schedule_for_recurring_event(self):
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

        await self.events_service.create([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

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
        await self.events_service.create([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        # reschedule recurring event before posting
        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)
        schedule["end"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=5)

        reschedule = get_resource_service("events_reschedule")
        reschedule.REQUIRE_LOCK = False
        # mocking function
        is_original_event_func = reschedule.is_original_event
        reschedule.is_original_event = Mock(return_value=False)

        res = reschedule.patch(events[0].get("_id"), {"dates": schedule})
        self.assertEqual(res.get("dates").get("start"), schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        # post recurring events
        get_resource_service("events_post").post(
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
        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)
        schedule["end"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)

        res = reschedule.patch(events[0].get("_id"), {"dates": schedule})
        rescheduled_event = await self.events_service.find_by_id_raw(events[0].get("_id"))
        self.assertNotEqual(rescheduled_event.get("dates").get("start"), schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 4)

        # reset mocked function
        reschedule.is_original_event = is_original_event_func
        reschedule.REQUIRE_LOCK = True

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

        await self.events_service.create([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
        schedule["end"] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

        update_time = get_resource_service("events_update_time")
        update_time.REQUIRE_LOCK = False
        # mocking function
        is_original_event_func = update_time.is_original_event
        update_time.is_original_event = Mock(return_value=False)

        res = update_time.patch(events[0].get("_id"), {"dates": schedule, "update_method": "all"})
        self.assertEqual(res.get("dates").get("start"), schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(events[1].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 20, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)
        schedule["end"] = datetime(2099, 11, 21, 21, 00, 00, tzinfo=pytz.UTC) + timedelta(hours=2)

        res = update_time.patch(events[0].get("_id"), {"dates": schedule, "update_method": "single"})
        self.assertEqual(res.get("dates").get("start"), schedule["start"])

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        # reset mocked function
        update_time.is_original_event = is_original_event_func
        update_time.REQUIRE_LOCK = True

    async def test_planning_schedule_update_repetitions(self):
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

        ids = await self.events_service.create([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)

        schedule = deepcopy(event["dates"])
        schedule["recurring_rule"]["count"] = 5

        update_repetitions = get_resource_service("events_update_repetitions")
        update_repetitions.REQUIRE_LOCK = False
        # mocking function
        is_original_event_func = update_repetitions.is_original_event
        update_repetitions.is_original_event = Mock(return_value=False)
        update_repetitions.patch(events[0].get("_id"), {"dates": schedule})

        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 5)

        # reset mocked function
        update_repetitions.is_original_event = is_original_event_func
        update_repetitions.REQUIRE_LOCK = True

    @patch("planning.events.events.get_user")
    async def test_planning_schedule_convert_to_recurring(self, get_user_mock):
        get_user_mock.return_value = {"_id": "None"}
        event = {
            "name": "Friday Club",
            "dates": {
                "start": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                "end": datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC),
                "tz": "Australia/Sydney",
            },
        }

        await self.events_service.create([event])
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 1)

        # TODO-ASYNC: adjust when `LockService` is async as it uses `get_resource_service` dynamically
        lock_service = LockService(self.app)
        locked_event = lock_service.lock(events[0], None, ObjectId(), "convert_recurring", "events")
        self.assertEqual(locked_event.get("lock_action"), "convert_recurring")

        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC)
        schedule["end"] = datetime(2099, 11, 21, 14, 00, 00, tzinfo=pytz.UTC)
        schedule["recurring_rule"] = {
            "frequency": "DAILY",
            "interval": 1,
            "count": 3,
            "end_repeat_mode": "count",
        }

        await self.events_service.update(events[0].get("_id"), {"dates": schedule})
        events = await self._get_all_events_raw()
        self.assertPlanningSchedule(events, 3)


def generate_recurring_events(num_events):
    events = []
    days = -2
    now = utcnow()
    for i in range(num_events):
        start = now + timedelta(days=days)
        end = start + timedelta(hours=4)
        events.append(
            {
                "slugline": "Event",
                "name": "Event {}".format(i),
                "recurrence_id": "rec1",
                "dates": {"start": start, "end": end},
            }
        )
        days += 1
    return events


class EventsRelatedPlanningAutoPublish(EventsBaseTestCase):
    async def test_planning_item_is_published_with_events(self):
        planning_service = PlanningAsyncService()
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
        event_id = await self.events_service.create([event])
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
            "related_events": [PlanningRelatedEventLink(_id=event_id[0], link_type="primary")],
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
        planning_id = await planning_service.create([planning])
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
        self.app.data.insert(
            "planning_types",
            [
                {
                    "_id": "event",
                    "name": "event",
                    "editor": {
                        "language": {"enabled": True},
                        "related_plannings": {"enabled": True},
                    },
                    "schema": schema,
                }
            ],
        )
        now = utcnow()
        get_resource_service("events_post").post(
            [{"event": event_id[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )

        event_item = await self.events_service.find_by_id_raw(event_id[0])
        self.assertEqual(len([event_item]), 1)
        self.assertEqual(event_item.get("state"), "scheduled")

        planning_item = await planning_service.find_by_id_raw(planning_id[0])
        self.assertEqual(len([planning_item]), 1)
        self.assertEqual(planning_item.get("state"), "scheduled")
        assert now <= arrow.get(planning_item.get("versionposted")).datetime < now + timedelta(seconds=5)

    async def test_new_planning_is_published_when_adding_to_published_event(self):
        planning_service = PlanningAsyncService()

        self.app.data.insert(
            "planning_types",
            [
                {
                    "_id": "event",
                    "name": "event",
                    "editor": {"related_plannings": {"enabled": True}},
                    "schema": {"related_plannings": {"planning_auto_publish": True}},
                }
            ],
        )
        event_id = await self.events_service.create(
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
        get_resource_service("events_post").post(
            [{"event": event_id[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )
        planning_id = await planning_service.create(
            [
                {
                    "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    "name": "Demo 1",
                    "type": "planning",
                    "related_events": [RelatedEvent(id=event_id[0], link_type="primary")],
                }
            ]
        )

        event_item = await self.events_service.find_by_id_raw(event_id)
        self.assertIsNotNone(event_item)
        self.assertEqual(event_item["pubstatus"], POST_STATE.USABLE)

        planning_item = await planning_service.find_by_id_raw(planning_id[0])
        self.assertIsNotNone(planning_item)

        # TODO-ASYNC: fix once `events_post` is migrated
        # self.assertEqual(planning_item["pubstatus"], POST_STATE.USABLE)

    # TODO-ASYNC: figure out
    @mark.skip(reason="Fails with an async unrelated error")
    async def test_related_planning_item_fields_validation_on_post(self):
        planning_service = PlanningAsyncService()
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
        event_id = await self.events_service.create([event])
        planning = {
            "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
            "name": "Demo 1",
            "place": [],
            "language": "en",
            "type": "planning",
            "slugline": "slug",
            "agendas": [],
            "languages": ["en"],
            "event_item": event_id[0],
            "coverages": [
                {
                    "coverage_id": "urn:newsmle264a179-5b1a-4b52-b73b-332660848cae",
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
        planning_id = await planning_service.create([planning])
        self.app.data.insert(
            "planning_types",
            [
                {
                    "_id": "event",
                    "name": "event",
                    "editor": {
                        "related_plannings": {"enabled": True},
                    },
                    "schema": {
                        "related_plannings": {"planning_auto_publish": True},
                    },
                },
                {
                    "_id": "planning",
                    "name": "planning",
                    "editor": {"subject": {"enabled": False}},
                    "schema": {"subject": {"required": True}},
                },
            ],
        )
        get_resource_service("events_post").post(
            [{"event": event_id[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )

        event_item = await self.events_service.find_by_id_raw(event_id[0])
        self.assertEqual(len([event_item]), 1)
        self.assertEqual(event_item.get("state"), "scheduled")

        planning_item = await planning_service.find_by_id_raw(planning_id[0])
        self.assertEqual(len([planning_item]), 1)
        self.assertEqual(planning_item.get("state"), "scheduled")
