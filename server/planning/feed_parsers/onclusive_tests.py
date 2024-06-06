import os
import bson
import json
import logging
import datetime
import superdesk
import pytest

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

    def parse(self, file):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        sample_json = os.path.join(dir_path, file)
        try:
            with open(sample_json, "r") as f:
                superdesk_event = json.load(f)
                if superdesk_event:
                    self.data = superdesk_event
        except Exception:
            self.data = {}

    def setUp(self):
        super().setUp()
        self.parse("onclusive_sample.json")

    def test_content(self):
        with self.assertLogs("planning", level=logging.INFO) as logger:
            item = OnclusiveFeedParser().parse([self.data])[0]
            self.assertIn(
                "INFO:planning.feed_parsers.onclusive:Parsing event id=4112034 updated=2022-05-10T12:14:34 deleted=False",
                logger.output,
            )
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
        self.assertEqual(item["firstcreated"], datetime.datetime(2021, 5, 4, 20, 19, 10, tzinfo=datetime.timezone.utc))
        self.assertEqual(
            item["versioncreated"], datetime.datetime(2022, 5, 10, 12, 14, 34, tzinfo=datetime.timezone.utc)
        )

        self.assertEqual(item["language"], "en")

        self.assertIn("https://www.canadianinstitute.com/anti-money-laundering-financial-crime/", item["links"])

        self.assertEqual(item["dates"]["start"], datetime.datetime(2022, 6, 15, 10, 30, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["end"], datetime.datetime(2022, 6, 15, 10, 30, tzinfo=datetime.timezone.utc))
        self.assertEqual(item["dates"]["tz"], "US/Eastern")
        self.assertEqual(item["dates"]["no_end_time"], True)

        self.assertEqual(item["name"], "Annual Forum on Anti-Money Laundering and Financial Crime")
        self.assertEqual(item["definition_short"], "")

        self.assertEqual(item["location"][0]["name"], "Karuizawa")
        self.assertEqual(item["location"][0]["address"]["country"], "Japan")
        self.assertEqual(item["location"][0]["location"], {"lat": 43.64894, "lon": -79.378086})

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
        self.assertEqual(1, superdesk.get_resource_service("contacts").find({}).count())
        self.assertEqual(["foo@example.com"], contact["contact_email"])

        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos5")
        [data][0]["isProvisional"] = True
        item = OnclusiveFeedParser().parse([data])[0]
        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos3")

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

    def test_cst_timezone(self):
        data = self.data.copy()
        data.update(
            {
                "startDate": "2023-04-18T00:00:00.0000000",
                "endDate": "2023-04-18T00:00:00.0000000",
                "time": "10:00",
                "timezone": {
                    "timezoneID": 24,
                    "timezoneAbbreviation": "CST",
                    "timezoneName": "(CST) China Standard Time : Beijing, Taipei",
                    "timezoneOffset": 8.00,
                },
            }
        )
        item = OnclusiveFeedParser().parse([data])[0]
        self.assertEqual(
            {
                "start": datetime.datetime(2023, 4, 18, 2, tzinfo=datetime.timezone.utc),
                "end": datetime.datetime(2023, 4, 18, 2, tzinfo=datetime.timezone.utc),
                "all_day": False,
                "no_end_time": True,
                "tz": "Asia/Macau",
            },
            item["dates"],
        )

    def test_embargoed(self):
        data = self.data.copy()
        data["embargoTime"] = "2022-12-07T09:00:00"
        data["timezone"] = {
            "timezoneID": 3,
            "timezoneAbbreviation": "MST",
            "timezoneName": "(MST) Mountain Standard Time",
            "timezoneOffset": -7.0,
        }

        with self.app.app_context():
            with self.assertLogs("planning", level=logging.INFO) as logger:
                with patch("planning.feed_parsers.onclusive.utcnow") as utcnow_mock:
                    utcnow_mock.return_value = datetime.datetime.fromisoformat("2022-12-07T10:00:00+00:00")

                    parsed = OnclusiveFeedParser().parse([data])
                    self.assertEqual(0, len(parsed))
                    self.assertIn(
                        "INFO:planning.feed_parsers.onclusive:Ignoring embargoed event 4112034", logger.output
                    )

                    utcnow_mock.return_value = datetime.datetime.fromisoformat("2022-12-07T18:00:00+00:00")
                    parsed = OnclusiveFeedParser().parse([data])
                    self.assertEqual(1, len(parsed))

    def test_timezone_ambigous_time_error(self):
        data = self.data.copy()
        data.update(
            {
                "startDate": "2023-10-27T00:00:00.0000000",
                "time": "08:30",
                "timezone": {
                    "timezoneID": 27,
                    "timezoneAbbreviation": "JST",
                    "timezoneName": "(JST) Japan Standard Time : Tokyo",
                    "timezoneOffset": 9.00,
                    "timezoneIdentity": None,
                },
            }
        )

        item = OnclusiveFeedParser().parse([data])[0]
        assert item["dates"]["tz"] == "Asia/Tokyo"

    def test_error_on_empty_name(self):
        data = self.data.copy()
        data["summary"] = ""
        data["description"] = ""

        with self.assertLogs("planning", level=logging.ERROR) as logger:
            OnclusiveFeedParser().parse([data])
            assert "Error when parsing Onclusive event" in logger.output[0]
