# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy
from unittest import mock

import json
from bson.objectid import ObjectId

from superdesk.tests import utils as test_utils, fixtures

from planning.tests import TestCase
from planning.output_formatters.json_planning import JsonPlanningFormatter
from planning.types import PlanningRelatedEventLink


class JsonPlanningTestCase(TestCase):
    maxDiff = None
    item = {
        "_id": "urn:newsml:localhost:2018-04-10T11:06:53.632085:e372d553-9ee1-4e62-8706-fd2eb678ce06",
        "_planning_schedule": [
            {
                "scheduled": "2018-04-09T14:00:53.000Z",
                "coverage_id": "urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713",
            }
        ],
        "ednote": "An editorial Note",
        "_created": "2018-04-10T01:06:53.000Z",
        "_updated": "2018-04-10T04:37:36.000Z",
        "coverages": [
            {
                "firstcreated": "2018-04-10T04:37:31.000Z",
                "planning": {
                    "g2_content_type": "text",
                    "genre": [{"name": "Article", "qcode": "Article"}],
                    "ednote": "An editorial Note",
                    "keyword": ["Motoring"],
                    "scheduled": "2018-04-09T14:00:53.000Z",
                    "slugline": "Raiders",
                    "internal_note": "An internal Note",
                },
                "assigned_to": {
                    "assignment_id": ObjectId("5b206de61d41c89c6659d5ec"),
                    "priority": 2,
                },
                "original_creator": "57bcfc5d1d41c82e8401dcc0",
                "workflow_status": "active",
                "coverage_id": "urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713",
                "news_coverage_status": {
                    "label": "Planned",
                    "name": "coverage intended",
                    "qcode": "ncostat:int",
                },
            }
        ],
        "internal_note": "An internal Note",
        "_etag": "639e18fc36d9ef6da577702de307aa9506b440e2",
        "subject": [
            {"name": "tourism", "qcode": "10006000", "parent": "10000000", "translations": {"name": {"en": "Tourism"}}}
        ],
        "description_text": "The description of the event",
        "anpa_category": [{"name": "International News", "qcode": "i"}],
        "flags": {"marked_for_not_publication": False},
        "guid": "urn:newsml:localhost:2018-04-10T11:06:53.632085:e372d553-9ee1-4e62-8706-fd2eb678ce06",
        "planning_date": "2018-04-09T14:00:53.000Z",
        "headline": "Name of the event",
        "agendas": [ObjectId("5a9c5f4d1d41c81b8f6a4c11")],
        "related_events": [
            PlanningRelatedEventLink(
                _id="event_prim_1",
                link_type="primary",
            ),
        ],
        "place": [
            {
                "group": "Rest Of World",
                "world_region": "Europe",
                "name": "EUR",
                "qcode": "EUR",
                "country": "",
                "state": "",
            }
        ],
        "item_class": "plinat:newscoverage",
        "original_creator": "57bcfc5d1d41c82e8401dcc0",
        "state": "posted",
        "slugline": "SLUGLINE",
        "type": "planning",
        "lock_session": None,
        "lock_action": None,
        "lock_user": None,
        "lock_time": None,
        "urgency": 1,
        "version_creator": "57bcfc5d1d41c82e8401dcc0",
        "language": "en",
    }
    assignment = [
        {
            "_id": ObjectId("5b206de61d41c89c6659d5ec"),
            "original_creator": "57bcfc5d1d41c82e8401dcc0",
            "priority": 2,
            "coverage_item": "urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713",
            "_updated": "2018-06-08T01:53:06.000Z",
            "type": "assignment",
            "planning_item": "urn:newsml:localhost:2018-06-08T11:51:24.704360:447788f4-641f-4248-8837-cf3dc8a6ac9a",
            "planning": {
                "genre": [{"qcode": "Article", "name": "Article"}],
                "scheduled": "2018-06-08T08:00:00.000Z",
                "g2_content_type": "text",
                "slugline": "Raiders",
            },
            "description_text": "Rugby League/Premiership/Round 14 Canberra V Penrith",
            "assigned_to": {
                "assignment_id": ObjectId("5b206de61d41c89c6659d5ec"),
                "coverage_provider": None,
                "desk": "54fe457210245489e2d3b564",
                "assignor_desk": "57bcfc5d1d41c82e8401dcc0",
                "assigned_date_desk": "2018-06-08T01:52:44+0000",
                "user": "57bcfc5d1d41c82e8401dcc0",
                "assignor_user": "57bcfc5d1d41c82e8401dcc0",
                "assigned_date_user": "2018-06-08T01:52:44+0000",
                "state": "completed",
            },
            "_etag": "d06f331cb3cc133fdb83c990005f8f493cf3f56a",
            "_created": "2018-06-08T01:52:44.000Z",
        }
    ]
    delivery = [
        {
            "_id": ObjectId("5b2079711d41c89c6659d6a0"),
            "assignment_id": ObjectId("5b206de61d41c89c6659d5ec"),
            "_created": "2018-06-13T01:54:57.000Z",
            "coverage_id": "urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713",
            "_updated": "2018-06-13T01:54:57.000Z",
            "item_id": "urn:newsml:localhost:2018-06-13T11:54:57.477423:c944042d-f93b-4304-9732-e7b5798ee8f9",
            "planning_id": "urn:newsml:localhost:2018-06-13T11:05:42.040242:8d810c01-2c0e-403a-bd0d-b4e2d001b163",
            "item_state": "published",
        }
    ]

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.subscriber = fixtures.subscribers.sub1_subscriber().to_dict()

    async def format(self, item=None):
        async with self.app.app_context():
            formatter = JsonPlanningFormatter()
            output = (await formatter.format(item or self.item, self.subscriber))[0]
            output_item = json.loads(output[1])
            return output_item

    async def test_formatting(self):
        output_item = await self.format()
        self.assertEqual("en", output_item["language"])
        self.assertEqual("Tourism", output_item["subject"][0]["name"])

    async def test_formatter_completed_coverage(self):
        async with self.app.app_context():
            agenda = {
                "_id": ObjectId("5a9c5f4d1d41c81b8f6a4c11"),
                "is_enabled": True,
                "original_creator": "57bcfc5d1d41c82e8401dcc0",
                "name": "Culture",
                "_updated": "2017-09-06T06:22:53.000Z",
                "_created": "2017-09-06T06:22:53.000Z",
            }
            await test_utils.post_items("agenda", [agenda])
            self.app.data.insert("assignments", self.assignment)
            self.app.data.insert("delivery", self.delivery)
            formatter = JsonPlanningFormatter()
            output = (await formatter.format(self.item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(output_item.get("agendas")[0].get("name"), "Culture")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(
                output_item.get("coverages")[0].get("deliveries")[0]["item_id"],
                "urn:newsml:localhost:2018-06-13T11:54:57.477423:c944042d-f93b-4304-9732-e7b5798ee8f9",
            )
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "completed")
            self.assertEqual(output_item.get("internal_note"), "An internal Note")
            self.assertEqual(output_item.get("ednote"), "An editorial Note")

    async def test_formatter_assigned_coverage(self):
        async with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "assigned"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = (await formatter.format(self.item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "assigned")

    async def test_formatter_in_progress_coverage(self):
        async with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "in_progress"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = (await formatter.format(self.item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    async def test_formatter_submitted_coverage(self):
        async with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "submitted"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = (await formatter.format(self.item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    async def test_formatter_draft_coverage(self):
        async with self.app.app_context():
            agenda = {
                "_id": ObjectId("5a9c5f4d1d41c81b8f6a4c11"),
                "is_enabled": True,
                "original_creator": "57bcfc5d1d41c82e8401dcc0",
                "name": "Culture",
                "_updated": "2017-09-06T06:22:53.000Z",
                "_created": "2017-09-06T06:22:53.000Z",
            }
            await test_utils.post_items("agenda", [agenda])
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            item["coverages"][0].pop("assigned_to", None)
            item["coverages"][0]["workflow_status"] = "draft"
            output = (await formatter.format(item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "draft")

    async def test_formatter_cancel_coverage(self):
        async with self.app.app_context():
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            item["coverages"][0].pop("assigned_to", None)
            item["coverages"][0]["workflow_status"] = "cancelled"
            output = (await formatter.format(item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "cancelled")

    async def test_matching_product_ids(self):
        async with self.app.app_context():
            filter_condition_planning_id = ObjectId()
            content_filter_planning_id = ObjectId()
            product_planning_id = ObjectId()

            filter_condition_events_id = ObjectId()
            content_filter_events_id = ObjectId()

            await test_utils.post_items(
                "filter_conditions",
                [
                    {
                        "_id": filter_condition_planning_id,
                        "name": "filter-planning",
                        "field": "type",
                        "operator": "eq",
                        "value": "planning",
                    },
                    {
                        "_id": filter_condition_events_id,
                        "name": "filter-events",
                        "field": "type",
                        "operator": "eq",
                        "value": "event",
                    },
                ],
            )
            await test_utils.post_items(
                "content_filters",
                [
                    {
                        "_id": content_filter_planning_id,
                        "name": "filter-planning",
                        "content_filter": [{"expression": {"fc": [filter_condition_planning_id]}}],
                    },
                    {
                        "_id": content_filter_events_id,
                        "name": "filter-events",
                        "content_filter": [{"expression": {"fc": [filter_condition_events_id]}}],
                    },
                ],
            )
            await test_utils.post_items(
                "products",
                [
                    {
                        "_id": product_planning_id,
                        "content_filter": {"filter_id": content_filter_planning_id, "filter_type": "permitting"},
                        "name": "planning-only",
                        "product_type": "both",
                    },
                    {
                        "content_filter": {"filter_id": content_filter_events_id, "filter_type": "permitting"},
                        "name": "events-only",
                        "product_type": "both",
                    },
                ],
            )
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            output = (await formatter.format(item, self.subscriber))[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item["products"], [{"code": str(product_planning_id), "name": "planning-only"}])

    async def test_expand_delivery_uses_ingest_id(self):
        async with self.app.app_context():
            self.app.data.insert("assignments", self.assignment)
            self.app.data.insert("delivery", self.delivery)
            formatter = JsonPlanningFormatter()
            item_id = self.delivery[0]["item_id"]
            ingest_id = "urn:newsml:localhost:2024-01-24-ingest-1"
            article = {
                "_id": item_id,
                "type": "text",
                "headline": "test headline",
                "slugline": "test slugline",
                "ingest_id": ingest_id,
            }

            self.app.data.insert("archive", [article])
            deliveries, _ = await formatter._expand_delivery(deepcopy(self.item["coverages"][0]))
            self.assertNotEqual(deliveries[0]["item_id"], ingest_id)

            article = self.app.data.find_one("archive", req=None, _id=item_id)
            self.app.data.update("archive", item_id, {"auto_publish": True}, article)
            deliveries, _ = await formatter._expand_delivery(deepcopy(self.item["coverages"][0]))
            self.assertEqual(deliveries[0]["item_id"], ingest_id)

            article = self.app.data.find_one("archive", req=None, _id=item_id)
            updates = {
                "auto_publish": None,
                "extra": {"publish_ingest_id_as_guid": True},
            }
            self.app.data.update("archive", item_id, updates, article)
            deliveries, _ = await formatter._expand_delivery(deepcopy(self.item["coverages"][0]))
            self.assertEqual(deliveries[0]["item_id"], ingest_id)

    async def test_assigned_desk_user(self):
        item = deepcopy(self.item)
        desk_id = ObjectId()
        user_id = ObjectId()

        item["coverages"][0]["assigned_to"].update(
            desk=desk_id,
            user=user_id,
        )

        async with self.app.app_context():
            self.app.data.insert(
                "desks",
                [{"_id": desk_id, "name": "sports", "email": "sports@example.com"}],
            )
            self.app.data.insert("users", [{"_id": user_id, "display_name": "John Doe", "email": "john@example.com"}])

        with mock.patch.dict(self.app.config, {"PLANNING_JSON_ASSIGNED_INFO_EXTENDED": True}):
            output_item = await self.format(item)
        coverage = output_item["coverages"][0]
        assert coverage["assigned_user"] == {
            "first_name": "",
            "last_name": "",
            "display_name": "John Doe",
            "email": "john@example.com",
        }
        assert coverage["assigned_desk"] == {
            "name": "sports",
            "email": "sports@example.com",
        }

        # without config
        output_item = await self.format(item)
        coverage = output_item["coverages"][0]
        assert "email" not in coverage["assigned_user"]
        assert "email" not in coverage["assigned_desk"]

    async def test_related_primary_event_copies_to_event_item(self):
        item = deepcopy(self.item)
        self.assertEqual((await self.format(item))["event_item"], "event_prim_1")

        await self.app.data.insert_async("events", [{"_id": "event_prim_1", "name": "Event 1"}])

        item["related_events"] = [
            PlanningRelatedEventLink(
                _id="event_sec_1",
                link_type="secondary",
            ),
            PlanningRelatedEventLink(
                _id="event_prim_1",
                link_type="primary",
            ),
        ]
        self.assertEqual((await self.format(item))["event_item"], "event_prim_1")
        events = (await self.format(item))["events"]
        self.assertEqual(2, len(events))
        self.assertIn(
            {"literal": "event_prim_1", "rel": "primary", "uri": "urn:event:event_prim_1", "name": "Event 1"},
            events,
        )
        self.assertIn(
            {"literal": "event_sec_1", "rel": "secondary", "uri": "urn:event:event_sec_1", "name": ""},
            events,
        )

        item["related_events"] = [
            PlanningRelatedEventLink(
                _id="event_sec_1",
                link_type="secondary",
            )
        ]
        self.assertIsNone((await self.format(item)).get("event_item"))
        item.pop("related_events")
        self.assertIsNone((await self.format(item)).get("event_item"))

    async def test_exclude_asignee_fields(self):
        item = deepcopy(self.item)
        desk_id = ObjectId()
        user_id = ObjectId()

        item["coverages"][0]["assigned_to"].update(
            desk=desk_id,
            user=user_id,
        )

        async with self.app.app_context():
            self.app.data.insert(
                "desks",
                [{"_id": desk_id, "name": "sports", "email": "sports@example.com"}],
            )
            self.app.data.insert("users", [{"_id": user_id, "display_name": "John Doe", "email": "john@example.com"}])

        output_item = await self.format(item)
        coverage = output_item["coverages"][0]
        assert "assigned_user" in coverage
        assert "assigned_desk" in coverage

        with mock.patch.dict(self.app.config, {"PLANNING_JSON_EXCLUDE_ASSIGNEE_FIELDS": ["desk"]}):
            output_item = await self.format(item)

        coverage = output_item["coverages"][0]
        assert "assigned_user" in coverage
        assert "assigned_desk" not in coverage
