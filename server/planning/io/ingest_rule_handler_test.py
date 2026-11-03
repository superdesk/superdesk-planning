# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2022 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from bson import ObjectId
from datetime import datetime, timedelta

from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase, fixtures as planning_fixtures
from .ingest_rule_handler import PlanningRoutingRuleHandler
from planning.types import UnifiedPlanningHistoryResource


TEST_RULE = {
    "name": "Sports",
    "handler": "planning_publish",
    "filter": None,
    "actions": {
        "fetch": [],
        "publish": [],
        "exit": False,
        "extra": {
            "autopost": True,
            "calendars": [],
            "agenda": [],
        },
    },
}

AUTOPOST_RULE = {"actions": {"extra": {"autopost": True}}}


class IngestRuleHandlerTestCase(TestCase):
    calendars = [
        {"qcode": "sports", "name": "Sports", "is_active": True},
        {"qcode": "music", "name": "Music", "is_active": False},
    ]
    agendas = [
        {"_id": ObjectId("62c687e4dbff7ee3aaa1ede2"), "name": "Sports", "is_enabled": True},
        {"_id": ObjectId("62c687e4dbff7ee3aaa1ede3"), "name": "Music", "is_enabled": False},
    ]
    event_items = [
        {
            "_id": "event1",
            "dates": {
                "start": datetime.fromisoformat("2022-07-02T14:00:00+00:00"),
                "end": datetime.fromisoformat("2022-07-03T14:00:00+00:00"),
            },
            "type": "event",
            "pubstatus": "usable",
        },
        {
            "_id": "event2",
            "dates": {
                "start": "2022-07-03T14:00:00+0000",
                "end": "2022-07-04T14:00:00+0000",
            },
            "type": "event",
            "calendars": [calendars[0]],
        },
    ]
    planning_items = [
        {
            "_id": "plan1",
            "planning_date": "2022-07-03T14:00:00+0000",
            "type": "planning",
        },
        {
            "_id": "plan2",
            "planning_date": "2022-07-04T14:00:00+0000",
            "type": "planning",
            "agendas": [agendas[0]["_id"]],
        },
    ]

    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        self.app.data.insert(
            "vocabularies",
            [planning_fixtures.cvs.newscoveragestatus(), planning_fixtures.cvs.genre()],
        )
        await planning_fixtures.publish_config.configure_planning_publishing()
        self.handler = PlanningRoutingRuleHandler()

    async def test_can_handle_content(self):
        self.assertTrue(await self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.EVENT}, {}))
        self.assertTrue(await self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.PLANNING}, {}))
        self.assertFalse(await self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.TEXT}, {}))

    async def test_adds_event_calendars(self):
        self.app.data.insert(
            "vocabularies",
            [
                {
                    "_id": "event_calendars",
                    "items": self.calendars,
                }
            ],
        )
        event = self.event_items[0]
        await self.app.data.insert_async("events", [event])
        original = await get_resource_service("events").find_one_async(req=None, _id=event["_id"])

        await self.handler.apply_rule({"actions": {"extra": {"calendars": [self.calendars[0]["qcode"]]}}}, event, {})

        updated = await get_resource_service("events").find_one_async(req=None, _id=event["_id"])
        self.assertNotEqual(original["_etag"], updated["_etag"])

        calendars = [calendar["qcode"] for calendar in updated["calendars"]]
        self.assertEqual(len(calendars), 1)
        self.assertEqual(calendars[0], "sports")

    async def test_skips_disabled_and_existing_calendars(self):
        self.app.data.insert(
            "vocabularies",
            [
                {
                    "_id": "event_calendars",
                    "items": self.calendars,
                }
            ],
        )
        event = self.event_items[1]
        await self.app.data.insert_async("events", [event])
        original = await get_resource_service("events").find_one_async(req=None, _id=event["_id"])

        await self.handler.apply_rule(
            {"actions": {"extra": {"calendars": [self.calendars[0]["qcode"], self.calendars[1]["qcode"]]}}},
            event,
            {},
        )

        updated = await get_resource_service("events").find_one_async(req=None, _id=event["_id"])
        self.assertEqual(original["_etag"], updated["_etag"])

        calendars = [calendar["qcode"] for calendar in updated["calendars"]]
        self.assertEqual(len(calendars), 1)
        self.assertEqual(calendars[0], "sports")

    async def test_adds_planning_agendas(self):
        await test_utils.post_items("agenda", self.agendas)
        plan = self.planning_items[0]
        await self.app.data.insert_async("planning", [plan])
        original = await get_resource_service("planning").find_one_async(req=None, _id=plan["_id"])

        await self.handler.apply_rule({"actions": {"extra": {"agendas": [self.agendas[0]["_id"]]}}}, plan, {})

        updated = await get_resource_service("planning").find_one_async(req=None, _id=plan["_id"])
        self.assertNotEqual(original["_etag"], updated["_etag"])

        self.assertEqual(len(updated["agendas"]), 1)
        self.assertEqual(updated["agendas"][0], str(self.agendas[0]["_id"]))

    async def test_skips_disabled_and_existing_agendas(self):
        await test_utils.post_items("agenda", self.agendas)
        plan = self.planning_items[1]
        await self.app.data.insert_async("planning", [plan])
        original = await get_resource_service("planning").find_one_async(req=None, _id=plan["_id"])

        await self.handler.apply_rule(
            {"actions": {"extra": {"agendas": [self.agendas[0]["_id"], self.agendas[1]["_id"]]}}}, plan, {}
        )

        updated = await get_resource_service("planning").find_one_async(req=None, _id=plan["_id"])
        self.assertEqual(original["_etag"], updated["_etag"])

        self.assertEqual(len(updated["agendas"]), 1)
        self.assertEqual(updated["agendas"][0], str(self.agendas[0]["_id"]))

    async def test_autopost(self):
        event = self.event_items[0].copy()
        events_service = get_resource_service("events")
        await events_service.post_async([event])

        history = await self.get_event_history()
        assert len(history) == 1
        assert history[0].operation == "create"

        await self.handler.apply_rule(AUTOPOST_RULE, event, {})

        history = await self.get_event_history()
        assert len(history) == 2
        assert history[-1].operation == "post"

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "usable"

        event["pubstatus"] = "cancelled"
        event["versioncreated"] = datetime.now()
        await events_service.patch_in_mongo(event["_id"], event, original)

        await self.handler.apply_rule(AUTOPOST_RULE, event, {})

        history = await self.get_event_history()
        assert len(history) == 4
        assert history[-2].operation == "ingested"
        assert history[-1].operation == "post"

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "cancelled"

    async def test_autopost_cancelled(self):
        event = self.event_items[0].copy()
        event["pubstatus"] = None
        event["ingest_pubstatus"] = "cancelled"
        events_service = get_resource_service("events")
        await events_service.post_async([event])

        await self.handler.apply_rule(AUTOPOST_RULE, event, {})

        history = await self.get_event_history()
        assert len(history) == 2
        assert history[-1].operation == "post"

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "cancelled"

    async def get_event_history(self, event_id=None):
        query = {"item_type": "event"}
        if event_id is not None:
            query["item_id"] = event_id
        cursor = await UnifiedPlanningHistoryResource.get_service().find(query, use_mongo=True)
        return [item async for item in cursor]

    async def test_autopost_with_calendars(self):
        event = self.event_items[0].copy()
        event["pubstatus"] = None
        events_service = get_resource_service("events")
        await events_service.post_async([event])

        self.app.data.insert(
            "vocabularies",
            [
                {
                    "_id": "event_calendars",
                    "items": self.calendars,
                }
            ],
        )

        calendars_rule = {"actions": {"extra": {"autopost": True, "calendars": ["sports"]}}}
        await self.handler.apply_rule(calendars_rule, event, {})

        history = await self.get_event_history()
        assert len(history) == 2
        assert history[-1].operation == "post"

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "usable"
        assert original["state"] == "scheduled"

    async def test_autopost_draft_event(self):
        event = self.event_items[0].copy()
        event["versioncreated"] = datetime.now() - timedelta(minutes=10)
        events_service = get_resource_service("events")
        await events_service.post_async([event])

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "usable"
        assert original["state"] == "draft"

        event.pop("state", None)
        event["name"] = "updated name"
        event["pubstatus"] = "usable"
        event["versioncreated"] = datetime.now()
        await events_service.patch_in_mongo(event["_id"], event, original)

        original = await events_service.find_one_async(req=None, _id=event["_id"])
        assert original["pubstatus"] == "usable"
        assert original["state"] == "ingested"

    async def create_ingested_event(self, event_id, pubstatus=None):
        event = {
            "guid": event_id,
            "type": "event",
            "name": "Original",
            "dates": self.event_items[0]["dates"].copy(),
        }
        if pubstatus is not None:
            event["pubstatus"] = pubstatus

        events_service = get_resource_service("events")
        await events_service.post_in_mongo([event])
        # A completed ingest batch indexes events after storing them in Mongo.
        await events_service.backend.create_in_search_async(events_service.datasource, [event])
        return await events_service.find_one_async(req=None, _id=event_id)

    async def test_ingest_updates_leave_unposted_events_unpublished(self):
        events_service = get_resource_service("events")
        cases = (
            ("default", None, "usable"),
            ("usable", "usable", "usable"),
            ("cancelled", "cancelled", "cancelled"),
        )
        for label, incoming_status, expected_status in cases:
            with self.subTest(incoming_status=label):
                event_id = f"unposted-{label}"
                original = await self.create_ingested_event(event_id)
                self.assertIsNone(original.get("pubstatus"))

                updates = {"guid": event_id, "type": "event", "name": "Updated"}
                if incoming_status is not None:
                    updates["pubstatus"] = incoming_status
                if incoming_status == "cancelled":
                    updates["state"] = "killed"
                await events_service.patch_in_mongo(event_id, updates, original)

                updated = await events_service.find_one_async(req=None, _id=event_id)
                self.assertEqual(updated["name"], "Updated")
                self.assertEqual(updated["ingest_pubstatus"], expected_status)
                self.assertIsNone(updated.get("pubstatus"))
                self.assertIsNone(updated.get("firstpublished"))
                self.assertEqual(updated["state"], "killed" if incoming_status == "cancelled" else "ingested")

                await self.handler.apply_rule({"actions": {"extra": {"autopost": False}}}, updated, {})

                stored = await events_service.find_one_async(req=None, _id=event_id)
                self.assertIsNone(stored.get("pubstatus"))
                self.assertEqual(
                    [entry.operation for entry in await self.get_event_history(event_id)],
                    ["ingested"],
                )

    async def test_autopost_rule_posts_previously_unposted_ingest_update(self):
        events_service = get_resource_service("events")
        cases = (("default", None, "usable"), ("cancelled", "cancelled", "cancelled"))
        for label, incoming_status, expected_status in cases:
            with self.subTest(incoming_status=label):
                event_id = f"autopost-update-{label}"
                original = await self.create_ingested_event(event_id)
                updates = {"guid": event_id, "type": "event", "name": "Updated"}
                if incoming_status is not None:
                    updates["pubstatus"] = incoming_status
                    updates["state"] = "killed"
                await events_service.patch_in_mongo(event_id, updates, original)

                updated = await events_service.find_one_async(req=None, _id=event_id)
                self.assertIsNone(updated.get("pubstatus"))
                await self.handler.apply_rule(AUTOPOST_RULE, updated, {})

                posted = await events_service.find_one_async(req=None, _id=event_id)
                self.assertEqual(posted["pubstatus"], expected_status)
                self.assertIsNotNone(posted.get("firstpublished"))
                self.assertEqual(
                    [entry.operation for entry in await self.get_event_history(event_id)],
                    ["ingested", "post"],
                )

    async def test_ingest_updates_repost_previously_posted_events(self):
        g.user = {}
        events_service = get_resource_service("events")
        cases = (
            ("usable-default", "usable", None, "usable"),
            ("usable-cancelled", "usable", "cancelled", "cancelled"),
            ("cancelled-usable", "cancelled", "usable", "usable"),
            ("cancelled-cancelled", "cancelled", "cancelled", "cancelled"),
        )
        for label, original_status, incoming_status, expected_status in cases:
            with self.subTest(status_transition=label):
                event_id = f"posted-{label}"
                event = await self.create_ingested_event(event_id, original_status)
                await self.handler.apply_rule(AUTOPOST_RULE, event, {})
                original = await events_service.find_one_async(req=None, _id=event_id)
                self.assertEqual(original["pubstatus"], original_status)

                updates = {"guid": event_id, "type": "event", "name": "Updated"}
                if incoming_status is not None:
                    updates["pubstatus"] = incoming_status
                if incoming_status == "cancelled":
                    updates["state"] = "killed"
                self.assertTrue(events_service.should_update(original, updates, {}))
                await events_service.patch_in_mongo(event_id, updates, original)

                updated = await events_service.find_one_async(req=None, _id=event_id)
                self.assertEqual(updated["name"], "Updated")
                self.assertEqual(updated["ingest_pubstatus"], expected_status)
                self.assertEqual(updated["pubstatus"], expected_status)
                self.assertEqual(
                    [entry.operation for entry in await self.get_event_history(event_id)],
                    ["post", "ingested", "post"],
                )

                await self.handler.apply_rule(AUTOPOST_RULE, updated, {})
                self.assertEqual(
                    [entry.operation for entry in await self.get_event_history(event_id)],
                    ["post", "ingested", "post"],
                )
