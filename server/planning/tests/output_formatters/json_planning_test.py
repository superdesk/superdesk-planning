from planning.tests import TestCase
from unittest import mock
from planning.output_formatters.json_planning import JsonPlanningFormatter
import json
from copy import deepcopy
from bson.objectid import ObjectId


@mock.patch(
    "superdesk.publish.subscribers.SubscribersService.generate_sequence_number",
    lambda self, subscriber: 1,
)
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
        "subject": [{"name": "tourism", "qcode": "10006000", "parent": "10000000", "translations": {"name": {"en": "Tourism"}}}],
        "description_text": "The description of the event",
        "anpa_category": [{"name": "International News", "qcode": "i"}],
        "flags": {"marked_for_not_publication": False},
        "guid": "urn:newsml:localhost:2018-04-10T11:06:53.632085:e372d553-9ee1-4e62-8706-fd2eb678ce06",
        "planning_date": "2018-04-09T14:00:53.000Z",
        "headline": "Name of the event",
        "agendas": [1],
        "event_item": "urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946",
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

    def format(self):
        with self.app.app_context():
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            return output_item

    def test_formatting(self):
        output_item = self.format()
        self.assertEqual("en", output_item["language"])
        self.assertEqual("Tourism", output_item["subject"][0]["name"])

    def test_formatter_completed_coverage(self):
        with self.app.app_context():
            agenda = {
                "_id": 1,
                "is_enabled": True,
                "original_creator": "57bcfc5d1d41c82e8401dcc0",
                "name": "Culture",
                "_updated": "2017-09-06T06:22:53.000Z",
                "_created": "2017-09-06T06:22:53.000Z",
            }
            self.app.data.insert("agenda", [agenda])
            self.app.data.insert("assignments", self.assignment)
            self.app.data.insert("delivery", self.delivery)
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {"name": "Test Subscriber"})[0]
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

    def test_formatter_assigned_coverage(self):
        with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "assigned"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "assigned")

    def test_formatter_in_progress_coverage(self):
        with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "in_progress"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    def test_formatter_submitted_coverage(self):
        with self.app.app_context():
            assignment = deepcopy(self.assignment)
            assignment[0]["assigned_to"]["state"] = "submitted"
            self.app.data.insert("assignments", assignment)
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "active")

    def test_formatter_draft_coverage(self):
        with self.app.app_context():
            agenda = {
                "_id": 1,
                "is_enabled": True,
                "original_creator": "57bcfc5d1d41c82e8401dcc0",
                "name": "Culture",
                "_updated": "2017-09-06T06:22:53.000Z",
                "_created": "2017-09-06T06:22:53.000Z",
            }
            self.app.data.insert("agenda", [agenda])
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            item["coverages"][0].pop("assigned_to", None)
            item["coverages"][0]["workflow_status"] = "draft"
            output = formatter.format(item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "draft")

    def test_formatter_cancel_coverage(self):
        with self.app.app_context():
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            item["coverages"][0].pop("assigned_to", None)
            item["coverages"][0]["workflow_status"] = "cancelled"
            output = formatter.format(item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get("slugline"), "SLUGLINE")
            self.assertEqual(
                output_item.get("coverages")[0].get("planning").get("slugline"),
                "Raiders",
            )
            self.assertEqual(output_item.get("coverages")[0].get("deliveries"), [])
            self.assertEqual(output_item.get("coverages")[0].get("workflow_status"), "cancelled")

    def test_matching_product_ids(self):
        with self.app.app_context():
            self.app.data.insert(
                "filter_conditions",
                [
                    {
                        "_id": "fc-type-planning",
                        "name": "filter-planning",
                        "field": "type",
                        "operator": "eq",
                        "value": "planning",
                    },
                    {
                        "_id": "fc-type-event",
                        "name": "filter-events",
                        "field": "type",
                        "operator": "eq",
                        "value": "event",
                    },
                ],
            )
            self.app.data.insert(
                "content_filters",
                [
                    {
                        "_id": "cf-planning",
                        "name": "filter-planning",
                        "content_filter": [{"expression": {"fc": ["fc-type-planning"]}}],
                    },
                    {
                        "_id": "cf-events",
                        "name": "filter-events",
                        "content_filter": [{"expression": {"fc": ["fc-type-event"]}}],
                    },
                ],
            )
            self.app.data.insert(
                "products",
                [
                    {
                        "_id": "prod-type-planning",
                        "content_filter": {"filter_id": "cf-planning", "filter_type": "permitting"},
                        "name": "planning-only",
                        "product_type": "both",
                    },
                    {
                        "_id": "prod-type-events",
                        "content_filter": {"filter_id": "cf-events", "filter_type": "permitting"},
                        "name": "events-only",
                        "product_type": "both",
                    },
                ],
            )
            formatter = JsonPlanningFormatter()
            item = deepcopy(self.item)
            output = formatter.format(item, {"name": "Test Subscriber"})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item["products"], [{"code": "prod-type-planning", "name": "planning-only"}])
