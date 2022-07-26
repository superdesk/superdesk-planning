import json
from .onclusive import OnclusiveFeedParser
import datetime
from dateutil.tz import tzutc
import os
from planning.tests import TestCase
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)


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

        self.assertEqual(item[GUID_FIELD], "urn:newsml:2021-05-04T21:19:10.2:4112034")
        self.assertEqual(item[ITEM_TYPE], CONTENT_TYPE.EVENT)
        self.assertEqual(item["state"], CONTENT_STATE.INGESTED)
        self.assertEqual(item["firstcreated"], datetime.datetime(2021, 5, 4, 21, 19, 10, 200000, tzinfo=tzutc()))
        self.assertEqual(item["versioncreated"], datetime.datetime(2022, 5, 10, 13, 14, 34, 873000, tzinfo=tzutc()))

        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos5")

        self.assertIn("https://www.canadianinstitute.com/anti-money-laundering-financial-crime/", item["links"])

        self.assertEqual(item["dates"]["start"], datetime.datetime(2022, 6, 15, 0, 0, tzinfo=tzutc()))
        self.assertEqual(item["dates"]["end"], datetime.datetime(2022, 6, 16, 0, 0, tzinfo=tzutc()))
        self.assertEqual(item["dates"]["tz"], "EDT")

        self.assertEqual(item["name"], "Annual Forum on Anti-Money Laundering and Financial Crime")
        self.assertEqual(item["definition_short"], "")

        self.assertEqual(item["location"][0]["name"], "One King West Hotel & Residence, 1 King St W, Toronto")
