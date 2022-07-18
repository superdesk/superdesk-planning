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
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from .ingest_rule_handler import PlanningRoutingRuleHandler
from planning.tests import TestCase


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
                "start": "2022-07-02T14:00:00+0000",
                "end": "2022-07-03T14:00:00+0000",
            },
            "type": "event",
        },
        {
            "_id": "event2",
            "dates": {
                "start": "2022-07-03T14:00:00+0000",
                "end": "2022-04-03T14:00:00+0000",
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

    def setUp(self):
        super(IngestRuleHandlerTestCase, self).setUp()
        self.handler = PlanningRoutingRuleHandler()

    def test_can_handle_content(self):
        self.assertTrue(self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.EVENT}, {}))
        self.assertTrue(self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.PLANNING}, {}))
        self.assertFalse(self.handler.can_handle({}, {ITEM_TYPE: CONTENT_TYPE.TEXT}, {}))

    def test_adds_event_calendars(self):
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
        self.app.data.insert("events", [event])
        original = self.app.data.find_one("events", req=None, _id=event["_id"])

        self.handler.apply_rule({"actions": {"extra": {"calendars": [self.calendars[0]["qcode"]]}}}, event, {})

        updated = self.app.data.find_one("events", req=None, _id=event["_id"])
        self.assertNotEqual(original["_etag"], updated["_etag"])

        calendars = [calendar["qcode"] for calendar in updated["calendars"]]
        self.assertEqual(len(calendars), 1)
        self.assertEqual(calendars[0], "sports")

    def test_skips_disabled_and_existing_calendars(self):
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
        self.app.data.insert("events", [event])
        original = self.app.data.find_one("events", req=None, _id=event["_id"])

        self.handler.apply_rule(
            {"actions": {"extra": {"calendars": [self.calendars[0]["qcode"], self.calendars[1]["qcode"]]}}}, event, {}
        )

        updated = self.app.data.find_one("events", req=None, _id=event["_id"])
        self.assertEqual(original["_etag"], updated["_etag"])

        calendars = [calendar["qcode"] for calendar in updated["calendars"]]
        self.assertEqual(len(calendars), 1)
        self.assertEqual(calendars[0], "sports")

    def test_adds_planning_agendas(self):
        self.app.data.insert("agenda", self.agendas)
        plan = self.planning_items[0]
        self.app.data.insert("planning", [plan])
        original = self.app.data.find_one("planning", req=None, _id=plan["_id"])

        self.handler.apply_rule({"actions": {"extra": {"agendas": [self.agendas[0]["_id"]]}}}, plan, {})

        updated = self.app.data.find_one("planning", req=None, _id=plan["_id"])
        self.assertNotEqual(original["_etag"], updated["_etag"])

        self.assertEqual(len(updated["agendas"]), 1)
        self.assertEqual(updated["agendas"][0], self.agendas[0]["_id"])

    def test_skips_disabled_and_existing_agendas(self):
        self.app.data.insert("agenda", self.agendas)
        plan = self.planning_items[1]
        self.app.data.insert("planning", [plan])
        original = self.app.data.find_one("planning", req=None, _id=plan["_id"])

        self.handler.apply_rule(
            {"actions": {"extra": {"agendas": [self.agendas[0]["_id"], self.agendas[1]["_id"]]}}}, plan, {}
        )

        updated = self.app.data.find_one("planning", req=None, _id=plan["_id"])
        self.assertEqual(original["_etag"], updated["_etag"])

        self.assertEqual(len(updated["agendas"]), 1)
        self.assertEqual(updated["agendas"][0], self.agendas[0]["_id"])
