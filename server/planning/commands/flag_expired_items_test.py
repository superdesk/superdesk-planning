# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta

from bson.objectid import ObjectId

from superdesk import get_resource_service
from superdesk.utc import utcnow

from planning.tests import TestCase
from planning.types import PlanningRelatedEventLink
from .flag_expired_items import FlagExpiredItems

now = utcnow()
yesterday = now - timedelta(hours=48)

active = {
    "event": {"dates": {"start": now - timedelta(hours=1), "end": now}},
    "overnightEvent": {"dates": {"start": yesterday, "end": now}},
    "plan": {"planning_date": now},
    "coverage": {"planning": {"scheduled": now}},
}

expired = {
    "event": {"dates": {"start": yesterday, "end": yesterday + timedelta(hours=1)}},
    "plan": {"planning_date": yesterday},
    "coverage": {"planning": {"scheduled": yesterday}},
}


class FlagExpiredItemsTest(TestCase):
    def setUp(self):
        super().setUp()

        # Expire items that are scheduled more than 24 hours from now
        self.app.config.update({"PLANNING_EXPIRY_MINUTES": 1440})

        self.event_service = get_resource_service("events")
        self.planning_service = get_resource_service("planning")

    def assertExpired(self, item_type, results):
        service = self.event_service if item_type == "events" else self.planning_service

        for item_id, result in results.items():
            item = service.find_one(_id=item_id, req=None)
            self.assertIsNotNone(item)
            self.assertEqual(item.get("expired", False), result)

    def insert(self, item_type, items):
        service = self.event_service if item_type == "events" else self.planning_service
        service.post(items)

    def test_expire_disabled(self):
        self.app.config.update({"PLANNING_EXPIRY_MINUTES": 0})

        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e1", **active["event"]},
                    {"guid": "e2", **active["overnightEvent"]},
                    {"guid": "e3", **expired["event"]},
                ],
            )
            self.insert(
                "planning",
                [
                    {"guid": "p1", **active["plan"], "coverages": []},
                    {"guid": "p2", **active["plan"], "coverages": [active["coverage"]]},
                    {
                        "guid": "p3",
                        **active["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p4",
                        **active["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],
                    },
                    {"guid": "p5", **expired["plan"], "coverages": []},
                    {
                        "guid": "p6",
                        **expired["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p7",
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p8",
                        **expired["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired("events", {"e1": False, "e2": False, "e3": False})

            self.assertExpired(
                "planning",
                {
                    "p1": False,
                    "p2": False,
                    "p3": False,
                    "p4": False,
                    "p5": False,
                    "p6": False,
                    "p7": False,
                    "p8": False,
                },
            )

    def test_event(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e1", **active["event"]},
                    {"guid": "e2", **active["overnightEvent"]},
                    {"guid": "e3", **expired["event"]},
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired("events", {"e1": False, "e2": False, "e3": True})

    def test_planning(self):
        with self.app.app_context():
            self.insert(
                "planning",
                [
                    {"guid": "p1", **active["plan"], "coverages": []},
                    {"guid": "p2", **active["plan"], "coverages": [active["coverage"]]},
                    {
                        "guid": "p3",
                        **active["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p4",
                        **active["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],
                    },
                    {"guid": "p5", **expired["plan"], "coverages": []},
                    {
                        "guid": "p6",
                        **expired["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p7",
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p8",
                        **expired["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired(
                "planning",
                {
                    "p1": False,
                    "p2": False,
                    "p3": False,
                    "p4": False,
                    "p5": True,
                    "p6": False,
                    "p7": True,
                    "p8": False,
                },
            )

    def test_event_with_single_planning_no_coverages(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e1", **active["event"]},
                    {"guid": "e2", **expired["event"]},
                    {"guid": "e3", **active["event"]},
                    {"guid": "e4", **expired["event"]},
                ],
            )

            self.insert(
                "planning",
                [
                    {
                        "guid": "p1",
                        "related_events": [PlanningRelatedEventLink(_id="e1", link_type="primary")],
                        **active["plan"],
                    },
                    {
                        "guid": "p2",
                        "related_events": [PlanningRelatedEventLink(_id="e2", link_type="primary")],
                        **active["plan"],
                    },
                    {
                        "guid": "p3",
                        "related_events": [PlanningRelatedEventLink(_id="e3", link_type="primary")],
                        **expired["plan"],
                    },
                    {
                        "guid": "p4",
                        "related_events": [PlanningRelatedEventLink(_id="e4", link_type="primary")],
                        **expired["plan"],
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired("events", {"e1": False, "e2": False, "e3": False, "e4": True})

            self.assertExpired("planning", {"p1": False, "p2": False, "p3": False, "p4": True})

    def test_event_with_single_planning_single_coverage(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e1", **active["event"]},
                    {"guid": "e2", **active["event"]},
                    {"guid": "e3", **active["event"]},
                    {"guid": "e4", **active["event"]},
                    {"guid": "e5", **expired["event"]},
                    {"guid": "e6", **expired["event"]},
                    {"guid": "e7", **expired["event"]},
                    {"guid": "e8", **expired["event"]},
                ],
            )

            self.insert(
                "planning",
                [
                    {
                        "guid": "p1",
                        "related_events": [PlanningRelatedEventLink(_id="e1", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p2",
                        "related_events": [PlanningRelatedEventLink(_id="e2", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p3",
                        "related_events": [PlanningRelatedEventLink(_id="e3", link_type="primary")],
                        **active["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p4",
                        "related_events": [PlanningRelatedEventLink(_id="e4", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p5",
                        "related_events": [PlanningRelatedEventLink(_id="e5", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p6",
                        "related_events": [PlanningRelatedEventLink(_id="e6", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p7",
                        "related_events": [PlanningRelatedEventLink(_id="e7", link_type="primary")],
                        **active["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p8",
                        "related_events": [PlanningRelatedEventLink(_id="e8", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired(
                "events",
                {
                    "e1": False,
                    "e2": False,
                    "e3": False,
                    "e4": False,
                    "e5": False,
                    "e6": False,
                    "e7": False,
                    "e8": True,
                },
            )

            self.assertExpired(
                "planning",
                {
                    "p1": False,
                    "p2": False,
                    "p3": False,
                    "p4": False,
                    "p5": False,
                    "p6": False,
                    "p7": False,
                    "p8": True,
                },
            )

    def test_event_with_single_planning_multiple_coverages(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e01", **active["event"]},
                    {"guid": "e02", **active["event"]},
                    {"guid": "e03", **active["event"]},
                    {"guid": "e04", **active["event"]},
                    {"guid": "e05", **active["event"]},
                    {"guid": "e06", **active["event"]},
                    {"guid": "e07", **active["event"]},
                    {"guid": "e08", **expired["event"]},
                    {"guid": "e09", **expired["event"]},
                    {"guid": "e10", **expired["event"]},
                    {"guid": "e11", **expired["event"]},
                    {"guid": "e12", **expired["event"]},
                    {"guid": "e13", **expired["event"]},
                    {"guid": "e14", **expired["event"]},
                ],
            )

            self.insert(
                "planning",
                [
                    {
                        "guid": "p01",
                        "related_events": [PlanningRelatedEventLink(_id="e01", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"], active["coverage"]],  # AAA
                    },
                    {
                        "guid": "p02",
                        "related_events": [PlanningRelatedEventLink(_id="e02", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"], active["coverage"]],  # EAA
                    },
                    {
                        "guid": "p03",
                        "related_events": [PlanningRelatedEventLink(_id="e03", link_type="primary")],
                        **active["plan"],
                        "coverages": [expired["coverage"], active["coverage"]],  # AEA
                    },
                    {
                        "guid": "p04",
                        "related_events": [PlanningRelatedEventLink(_id="e04", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],  # AAE
                    },
                    {
                        "guid": "p05",
                        "related_events": [PlanningRelatedEventLink(_id="e05", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"], active["coverage"]],  # EEA
                    },
                    {
                        "guid": "p06",
                        "related_events": [PlanningRelatedEventLink(_id="e06", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],  # EAE
                    },
                    {
                        "guid": "p07",
                        "related_events": [PlanningRelatedEventLink(_id="e07", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"], expired["coverage"]],  # EEE
                    },
                    {
                        "guid": "p08",
                        "related_events": [PlanningRelatedEventLink(_id="e08", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"], active["coverage"]],  # AAA
                    },
                    {
                        "guid": "p09",
                        "related_events": [PlanningRelatedEventLink(_id="e09", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"], active["coverage"]],  # EAA
                    },
                    {
                        "guid": "p10",
                        "related_events": [PlanningRelatedEventLink(_id="e10", link_type="primary")],
                        **active["plan"],
                        "coverages": [expired["coverage"], active["coverage"]],  # AEA
                    },
                    {
                        "guid": "p11",
                        "related_events": [PlanningRelatedEventLink(_id="e11", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],  # AAE
                    },
                    {
                        "guid": "p12",
                        "related_events": [PlanningRelatedEventLink(_id="e12", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"], active["coverage"]],  # EEA
                    },
                    {
                        "guid": "p13",
                        "related_events": [PlanningRelatedEventLink(_id="e13", link_type="primary")],
                        **expired["plan"],
                        "coverages": [active["coverage"], expired["coverage"]],  # EAE
                    },
                    {
                        "guid": "p14",
                        "related_events": [PlanningRelatedEventLink(_id="e14", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"], expired["coverage"]],  # EEE
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired(
                "events",
                {
                    "e01": False,
                    "e02": False,
                    "e03": False,
                    "e04": False,
                    "e05": False,
                    "e06": False,
                    "e07": False,
                    "e08": False,
                    "e09": False,
                    "e10": False,
                    "e11": False,
                    "e12": False,
                    "e13": False,
                    "e14": True,
                },
            )

            self.assertExpired(
                "planning",
                {
                    "p01": False,
                    "p02": False,
                    "p03": False,
                    "p04": False,
                    "p05": False,
                    "p06": False,
                    "p07": False,
                    "p08": False,
                    "p09": False,
                    "p10": False,
                    "p11": False,
                    "p12": False,
                    "p13": False,
                    "p14": True,
                },
            )

    def test_event_with_multiple_planning(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {"guid": "e1", **active["event"]},
                    {"guid": "e2", **active["event"]},
                    {"guid": "e3", **active["event"]},
                    {"guid": "e4", **active["event"]},
                    {"guid": "e5", **expired["event"]},
                    {"guid": "e6", **expired["event"]},
                    {"guid": "e7", **expired["event"]},
                    {"guid": "e8", **expired["event"]},
                ],
            )

            self.insert(
                "planning",
                [
                    {
                        "guid": "p01",
                        "related_events": [PlanningRelatedEventLink(_id="e1", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p02",
                        "related_events": [PlanningRelatedEventLink(_id="e1", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p03",
                        "related_events": [PlanningRelatedEventLink(_id="e2", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p04",
                        "related_events": [PlanningRelatedEventLink(_id="e2", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p05",
                        "related_events": [PlanningRelatedEventLink(_id="e3", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p06",
                        "related_events": [PlanningRelatedEventLink(_id="e3", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p07",
                        "related_events": [PlanningRelatedEventLink(_id="e4", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p08",
                        "related_events": [PlanningRelatedEventLink(_id="e4", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p09",
                        "related_events": [PlanningRelatedEventLink(_id="e5", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p10",
                        "related_events": [PlanningRelatedEventLink(_id="e5", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p11",
                        "related_events": [PlanningRelatedEventLink(_id="e6", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p12",
                        "related_events": [PlanningRelatedEventLink(_id="e6", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p13",
                        "related_events": [PlanningRelatedEventLink(_id="e7", link_type="primary")],
                        **active["plan"],
                        "coverages": [active["coverage"]],
                    },
                    {
                        "guid": "p14",
                        "related_events": [PlanningRelatedEventLink(_id="e7", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p15",
                        "related_events": [PlanningRelatedEventLink(_id="e8", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                    {
                        "guid": "p16",
                        "related_events": [PlanningRelatedEventLink(_id="e8", link_type="primary")],
                        **expired["plan"],
                        "coverages": [expired["coverage"]],
                    },
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired(
                "events",
                {
                    "e1": False,
                    "e2": False,
                    "e3": False,
                    "e4": False,
                    "e5": False,
                    "e6": False,
                    "e7": False,
                    "e8": True,
                },
            )

            self.assertExpired(
                "planning",
                {
                    "p01": False,
                    "p02": False,
                    "p03": False,
                    "p04": False,
                    "p05": False,
                    "p06": False,
                    "p07": False,
                    "p08": False,
                    "p09": False,
                    "p10": False,
                    "p11": False,
                    "p12": False,
                    "p13": False,
                    "p14": False,
                    "p15": True,
                    "p16": True,
                },
            )

    def test_bad_event_schedule(self):
        with self.app.app_context():
            self.insert(
                "events",
                [
                    {
                        "guid": "e1",
                        **expired["event"],
                        "_plans": [{"_planning_schedule": [{"scheduled": None}]}],
                    }
                ],
            )
            FlagExpiredItems().run()

            self.assertExpired(
                "events",
                {
                    "e1": True,
                },
            )

    def test_published_planning_expiry(self):
        with self.app.app_context():
            self.app.config.update({"PUBLISH_QUEUE_EXPIRY_MINUTES": 1440})
            event_id = "urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c"
            plan_id = "urn:newsml:localhost:2018-06-28T11:50:31.055283:21cb4c6d-42c9-4183-bb02-212cda2fb5a2"
            self.app.data.insert(
                "published_planning",
                [
                    {
                        "_id": ObjectId("5b30565a1d41c89f550c435f"),
                        "published_item": {},
                        "item_id": event_id,
                        "version": 6366549127730893,
                        "type": "event",
                    },
                    {
                        "published_item": {},
                        "type": "planning",
                        "version": 6366575615196523,
                        "item_id": plan_id,
                    },
                ],
            )
            FlagExpiredItems().run()
            version_entries = get_resource_service("published_planning").get(req=None, lookup={})
            self.assertEqual(1, version_entries.count())
