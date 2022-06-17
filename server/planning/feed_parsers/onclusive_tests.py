import json
from .onclusive import Onclusive
import datetime
from dateutil.tz import tzutc
import os
from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)


class OnclusiveTestCase(TestCase):

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
        item = Onclusive().parse([self.data])[0]

        self.assertEqual(item[GUID_FIELD], "urn:newsml:2021-05-04T21:19:10.2:4112034")
        self.assertEqual(item[ITEM_TYPE], CONTENT_TYPE.EVENT)
        self.assertEqual(item["state"], CONTENT_STATE.INGESTED)
        self.assertEqual(item["firstcreated"], datetime.datetime(2021, 5, 4, 21, 19, 10, 200000, tzinfo=tzutc()))
        self.assertEqual(item["versioncreated"], datetime.datetime(2021, 5, 4, 21, 19, 10, 200000, tzinfo=tzutc()))

        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos5")

        self.assertIn("https://www.canadianinstitute.com/anti-money-laundering-financial-crime/", item["links"])

        self.assertEqual(item["dates"]["start"], "2022-06-15T00:00:00")
        self.assertEqual(item["dates"]["end"], "2022-06-16T00:00:00")
        self.assertEqual(item["dates"]["tz"], "EDT")

        self.assertEqual(item["slugline"], "Annual Forum on Anti-Money Laundering and Financial Crime")
        self.assertEqual(item["definition_short"], "Annual Forum on Anti-Money Laundering and Financial Crime")

        self.assertEqual(item["location"][0]["name"], "One King West Hotel & Residence, 1 King St W, Toronto")
