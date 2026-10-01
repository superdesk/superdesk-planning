from typing import Any

import pytz
import arrow
from copy import deepcopy
from mock import Mock, patch
from datetime import datetime, timedelta

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.types.common import RelatedEvent
from superdesk.utc import utcnow
from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase, fixtures as planning_fixtures
from planning.common import format_address, POST_STATE, TO_BE_CONFIRMED_FIELD
from planning.types import PlanningRelatedEventLink
from planning.unified.actions import process_reschedule_event, process_update_time


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
        schedule = deepcopy(events[0].get("dates"))
        schedule["start"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)
        schedule["end"] = datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC) + timedelta(days=3)

        res = await process_reschedule_event({"dates": schedule}, events[0], False)
        rescheduled_event = await self.events_service.find_one_async(req=None, _id=events[0].get("_id"))
        self.assertNotEqual(rescheduled_event["dates"]["start"], schedule["start"])

        events = await self._get_all_events_raw()
        # TODO-ASYNC: Not sure why this one is meant to be 4 instead of 3
        # needs investigation for either correctness of the test or the code
        self.assertPlanningSchedule(events, 3)

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
                    "_id": "event",
                    "name": "event",
                    "type": "event",
                    "editor": {
                        "language": {"enabled": True},
                        "related_plannings": {"enabled": True},
                    },
                    "schema": schema,
                }
            ],
        )
        now = utcnow()
        await get_resource_service("events_post").post_async(
            [{"event": new_events[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )

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
        await get_resource_service("events_post").post_async(
            [{"event": new_events[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )
        new_plannings = await planning_service.post_async(
            [
                {
                    "planning_date": datetime(2099, 11, 21, 12, 00, 00, tzinfo=pytz.UTC),
                    "name": "Demo 1",
                    "type": "planning",
                    "related_events": [RelatedEvent(id=new_events[0], link_type="primary").to_dict()],
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
                        "genre": "None",
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
                    "_id": "event",
                    "name": "event",
                    "type": "event",
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
        await get_resource_service("events_post").post_async(
            [{"event": new_events[0], "pubstatus": "usable", "update_method": "single", "failed_planning_ids": []}]
        )

        event_item = await self.events_service.find_one_async(req=None, _id=new_events[0])
        self.assertEqual(len([event_item]), 1)
        self.assertEqual(event_item.get("state"), "scheduled")

        planning_item = await planning_service.find_one_async(req=None, _id=new_plannings[0])
        self.assertEqual(len([planning_item]), 1)
        self.assertEqual(planning_item.get("state"), "scheduled")
