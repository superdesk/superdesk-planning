from copy import deepcopy
from unittest import mock

import json
from bson.objectid import ObjectId

from superdesk.tests import utils as test_utils

from planning.tests import TestCase, fixtures as planning_fixtures
from planning.output_formatters.json_event import JsonEventFormatter


class JsonEventWithCoveragesTestCase(TestCase):
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
        self.subscriber = planning_fixtures.publish_config.subscribers()["events"]
        self.item = {
            **planning_fixtures.events.event1(),
            "internal_note": "An internal Note",
            "ednote": "An editorial Note",
            "coverages": [
                {
                    "firstcreated": "2018-04-10T04:37:31.000Z",
                    "planning": {
                        "g2_content_type": "text",
                        "genre": [{"name": "Article", "qcode": "Article"}],
                        "ednote": "An editorial Note",
                        "keyword": ["Motoring"],
                        "scheduled": "2049-06-30T21:00:00+0000",
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
        }

    async def format(self, item=None):
        formatter = JsonEventFormatter()
        item = deepcopy(item or self.item)
        output = (await formatter.format(item, self.subscriber))[0]
        output_item = json.loads(output[1])
        return output_item

    async def test_formatter_completed_coverage(self):
        self.app.data.insert("assignments", self.assignment)
        self.app.data.insert("delivery", self.delivery)
        output_item = await self.format()
        self.assertEqual(output_item.get("name"), "Grand prix")
        self.assertEqual(output_item.get("calendars")[0].get("name"), "Entertainment")
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
        assignment = deepcopy(self.assignment)
        assignment[0]["assigned_to"]["state"] = "assigned"
        self.app.data.insert("assignments", assignment)
        output_item = await self.format()
        self.assertEqual(output_item.get("name"), self.item["name"])
        self.assertEqual(
            output_item.get("coverages")[0].get("planning").get("slugline"),
            "Raiders",
        )
        self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
        self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "assigned")

    async def test_formatter_in_progress_coverage(self):
        assignment = deepcopy(self.assignment)
        assignment[0]["assigned_to"]["state"] = "in_progress"
        self.app.data.insert("assignments", assignment)
        output_item = await self.format()
        self.assertEqual(output_item.get("name"), self.item["name"])
        self.assertEqual(
            output_item.get("coverages")[0].get("planning").get("slugline"),
            "Raiders",
        )
        self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
        self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    async def test_formatter_submitted_coverage(self):
        assignment = deepcopy(self.assignment)
        assignment[0]["assigned_to"]["state"] = "submitted"
        self.app.data.insert("assignments", assignment)
        output_item = await self.format()
        self.assertEqual(output_item.get("name"), self.item["name"])
        self.assertEqual(
            output_item.get("coverages")[0].get("planning").get("slugline"),
            "Raiders",
        )
        self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
        self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    async def test_formatter_draft_coverage(self):
        agenda = {
            "_id": ObjectId("5a9c5f4d1d41c81b8f6a4c11"),
            "is_enabled": True,
            "original_creator": "57bcfc5d1d41c82e8401dcc0",
            "name": "Culture",
            "_updated": "2017-09-06T06:22:53.000Z",
            "_created": "2017-09-06T06:22:53.000Z",
        }
        await test_utils.post_items("agenda", [agenda])
        item = deepcopy(self.item)
        item["coverages"][0].pop("assigned_to", None)
        item["coverages"][0]["workflow_status"] = "draft"
        output_item = await self.format(item)
        self.assertEqual(output_item.get("name"), self.item["name"])
        self.assertEqual(
            output_item.get("coverages")[0].get("planning").get("slugline"),
            "Raiders",
        )
        self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
        self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "draft")

    async def test_formatter_cancel_coverage(self):
        item = deepcopy(self.item)
        item["coverages"][0].pop("assigned_to", None)
        item["coverages"][0]["workflow_status"] = "cancelled"
        output_item = await self.format(item)
        self.assertEqual(output_item.get("name"), self.item["name"])
        self.assertEqual(
            output_item.get("coverages")[0].get("planning").get("slugline"),
            "Raiders",
        )
        self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
        self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "cancelled")

    async def test_expand_delivery_uses_ingest_id(self):
        self.app.data.insert("assignments", self.assignment)
        self.app.data.insert("delivery", self.delivery)
        formatter = JsonEventFormatter()
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
