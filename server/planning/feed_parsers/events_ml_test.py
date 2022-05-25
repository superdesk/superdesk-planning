from os import path
from xml.etree import ElementTree
from datetime import datetime
from dateutil.tz import tzoffset

from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)

from planning.feed_parsers.events_ml import EventsMLParser
from planning.tests import TestCase


class EventsMLFeedParserTestCase(TestCase):
    def setUp(self):
        super(EventsMLFeedParserTestCase, self).setUp()
        dirname = path.dirname(path.realpath(__file__))
        fixture = path.normpath(path.join(dirname, "fixtures", "events_ml_259625.xml"))
        with open(fixture, "rb") as f:
            self.xml = ElementTree.parse(f)

    def _add_cvs(self):
        with self.app.app_context():
            self.app.data.insert(
                "vocabularies",
                [
                    {
                        "_id": "eventoccurstatus",
                        "display_name": "Event Occurence Status",
                        "type": "manageable",
                        "unique_field": "qcode",
                        "selection_type": "do not show",
                        "items": [
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos0",
                                "name": "Unplanned event",
                                "label": "Unplanned event",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos1",
                                "name": "Planned, occurence planned only",
                                "label": "Planned, occurence planned only",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos2",
                                "name": "Planned, occurence highly uncertain",
                                "label": "Planned, occurence highly uncertain",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos3",
                                "name": "Planned, May occur",
                                "label": "Planned, May occur",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos4",
                                "name": "Planned, occurence highly likely",
                                "label": "Planned, occurence highly likely",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos5",
                                "name": "Planned, occurs certainly",
                                "label": "Planned, occurs certainly",
                            },
                            {
                                "is_active": True,
                                "qcode": "eocstat:eos6",
                                "name": "Planned, then cancelled",
                                "label": "Planned, then cancelled",
                            },
                        ],
                    }
                ],
            )

    def test_can_parse(self):
        self.assertTrue(EventsMLParser().can_parse(self.xml.getroot()))

    def test_content(self):
        self._add_cvs()
        item = EventsMLParser().parse(self.xml.getroot(), {"name": "Test"})[0]

        self.assertEqual(item[GUID_FIELD], "urn:newsml:stt.fi:20220705:259625")
        self.assertEqual(item[ITEM_TYPE], CONTENT_TYPE.EVENT)
        self.assertEqual(item["state"], CONTENT_STATE.INGESTED)
        self.assertEqual(item["firstcreated"], datetime(2022, 3, 30, 8, 48, 49, tzinfo=tzoffset(None, 10800)))
        self.assertEqual(item["versioncreated"], datetime(2022, 3, 30, 9, 31, 13, tzinfo=tzoffset(None, 10800)))

        self.assertEqual(item["occur_status"]["qcode"], "eocstat:eos5")
        self.assertEqual(item["language"], "fi-FI")
        self.assertEqual(item["name"], "Pesäpallo: Miesten Superpesis, klo 18 Hyvinkää-Kankaanpää")

        self.assertIn("www.pesis.fi", item["links"])
        self.assertIn("www.hyvinkaantahko.fi", item["links"])

        self.assertEqual(item["subject"], [])

        self.assertEqual(item["dates"]["tz"], self.app.config["DEFAULT_TIMEZONE"])
        self.assertEqual(item["dates"]["start"], datetime(2022, 7, 5, 18, 0, tzinfo=tzoffset(None, 10800)))
        self.assertEqual(item["dates"]["end"], datetime(2022, 7, 5, 19, 0, tzinfo=tzoffset(None, 10800)))
