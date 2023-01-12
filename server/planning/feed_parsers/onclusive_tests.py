import os
import bson
import json
import logging
import datetime
import superdesk

from planning.tests import TestCase
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)

from copy import deepcopy
from unittest.mock import patch

from .onclusive import OnclusiveFeedParser


class OnclusiveFeedParserTestCase(TestCase):

    data = {}

    def setUp(self):
        super().setUp()
        dir_path = os.path.dirname(os.path.realpath(__file__))
        sample_json = os.path.join(dir_path, "onclusive_sample.json")
        try:
            with open(sample_json, "r") as f:
                superdesk_event = json.load(f)
                if superdesk_event:
                    self.data = superdesk_event
        except Exception:
            self.data = []

    def test_content(self):
        item = OnclusiveFeedParser().parse([self.data])[0]
        item["subject"].sort(key=lambda i: i["name"])
        expected_subjects = [
            {"name": "Law & Order", "qcode": "88", "scheme": "onclusive_categories"},
            {"name": "Conflict / Terrorism / Security", "qcode": "133", "scheme": "onclusive_categories"},
            {"name": "Trade Conferences", "qcode": "97", "scheme": "onclusive_categories"},
            {"name": "Banking", "qcode": "159", "scheme": "onclusive_categories"},
            {"name": "Finance General", "qcode": "35", "scheme": "onclusive_categories"},
            {"name": "Tech - Internet, software & new media", "qcode": "50", "scheme": "onclusive_categories"},
            {"name": "Trade Conferences", "qcode": "148", "scheme": "onclusive_event_types"},
            {"name": "Cyber Security and Fraud", "qcode": "228", "scheme": "onclusive_event_types"},
        ]
        expected_subjects.sort(key=lambda i: i["name"])
        self.assertEqual(item["subject"], expected_subjects)

        self.assertEqual(item[GUID_FIELD], "urn:onclusive:4112034")
        self.assertEqual(item[ITEM_TYPE], CONTENT_TYPE.EVENT)
        self.assertEqual(item["state"], CONTENT_STATE.INGESTED)
        self.assertEqual(item["firstcreated"], datetime.datetime(2021, 5, 4, 21, 19, 10, tzinfo=datetime.timezone.utc))
        self.assertEqual(
            item["versioncreated"], datetime.datetime(2022, 5, 10, 13, 14, 34, tzinfo=datetime.timezone.utc)
        )

        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos5")
        self.assertEqual(item["language"], "en-CA")

        self.assertIn("https://www.canadianinstitute.com/anti-money-laundering-financial-crime/", item["links"])

        self.assertEqual(item["dates"]["start"], datetime.datetime(2022, 6, 15, 10, 30, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["end"], datetime.datetime(2022, 6, 16, 3, 59, 59, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["tz"], "US/Eastern")
        self.assertEqual(item["dates"]["no_end_time"], True)

        self.assertEqual(item["name"], "Annual Forum on Anti-Money Laundering and Financial Crime")
        self.assertEqual(item["definition_short"], "")

        self.assertEqual(item["location"][0]["name"], "One King West Hotel & Residence, 1 King St W, Toronto")
        self.assertEqual(item["location"][0]["address"]["country"], "Canada")

        self.assertEqual(1, len(item["event_contact_info"]))
        self.assertIsInstance(item["event_contact_info"][0], bson.ObjectId)
        contact = superdesk.get_resource_service("contacts").find_one(req=None, _id=item["event_contact_info"][0])
        self.assertIsNotNone(contact)
        self.assertTrue(contact["public"])
        self.assertTrue(contact["is_active"])
        self.assertEqual(["customerservice@americanconference.com"], contact["contact_email"])
        self.assertEqual([{"number": "1 212 352 3220", "public": True}], contact["contact_phone"])
        self.assertEqual("American Conference Institute", contact["organisation"])
        self.assertEqual("Benjamin Andrew", contact["first_name"])
        self.assertEqual("Stokes", contact["last_name"])

        data = deepcopy(self.data)
        data["pressContacts"][0]["pressContactEmail"] = "foo@example.com"
        item = OnclusiveFeedParser().parse([data])[0]
        self.assertIsInstance(item["event_contact_info"][0], bson.ObjectId)
        contact = superdesk.get_resource_service("contacts").find_one(req=None, _id=item["event_contact_info"][0])
        self.assertEqual(["foo@example.com"], contact["contact_email"])
        self.assertEqual(1, superdesk.get_resource_service("contacts").find({}).count())

    def test_content_no_time(self):
        data = self.data.copy()
        data["time"] = ""
        item = OnclusiveFeedParser().parse([data])[0]
        self.assertEqual(item["dates"]["start"], datetime.datetime(2022, 6, 15, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["end"], datetime.datetime(2022, 6, 15, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["all_day"], True)

    def test_unknown_timezone(self):
        with self.app.app_context():
            with patch.dict(self.app.config, {"ONCLUSIVE_TIMEZONES": ["FOO"]}):
                with self.assertLogs("planning", level=logging.ERROR) as logger:
                    OnclusiveFeedParser().parse([self.data])
                    self.assertIn("ERROR:planning.feed_parsers.onclusive:Unknown Timezone FOO", logger.output)
