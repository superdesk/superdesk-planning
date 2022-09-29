from typing import Optional
from os import path
from datetime import datetime
from dateutil.tz import tzoffset
from pytz import utc
from superdesk.etree import etree

from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)

from planning.feed_parsers.events_ml import EventsMLParser
from planning.tests import TestCase


class EventsMLFeedParserTestCase(TestCase):
    def _load_fixture(self, filename: str):
        dirname = path.dirname(path.realpath(__file__))
        fixture = path.normpath(path.join(dirname, "fixtures", filename))
        with open(fixture, "rb") as f:
            self.xml = etree.parse(f)

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
        self._load_fixture("events_ml_259625.xml")
        self.assertTrue(EventsMLParser().can_parse(self.xml.getroot()))

        self._load_fixture("planning.xml")
        self.assertFalse(EventsMLParser().can_parse(self.xml.getroot()))

    def test_content(self):
        self._load_fixture("events_ml_259625.xml")
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
        self.assertEqual(item["dates"]["start"], datetime(2022, 7, 5, 15, 0, tzinfo=utc))
        self.assertEqual(item["dates"]["end"], datetime(2022, 7, 5, 16, tzinfo=utc))

    def test_get_datetime_str_parts(self):
        parser = EventsMLParser()
        get_dt_str = parser.get_datetime_str
        tz = "Europe/Prague"

        self.assertEqual("2022-07-05T18:00:00+03:00", get_dt_str("2022-07-05T18:00:00+03:00", "00:00:00", tz))
        self.assertEqual("2022-07-05T18:00:00Z", get_dt_str("2022-07-05T18:00:00Z", "00:00:00", tz))
        self.assertEqual("2022-07-05T18:00:00+02:00", get_dt_str("2022-07-05T18:00:00", "00:00:00", tz))
        self.assertEqual("2022-07-05T00:00:00+02:00", get_dt_str("2022-07-05", "00:00:00", tz))

    def test_parse_event_schedule(self):
        self._load_fixture("events_ml_259625.xml")
        parser = EventsMLParser()
        item = {}

        def get_item_dates(start: str, end: Optional[str] = None):
            root = self.xml.getroot()
            parser.root = root

            dates = root.find(parser.qname("concept")).find(parser.qname("eventDetails")).find(parser.qname("dates"))
            for child in list(dates):
                dates.remove(child)

            etree.SubElement(dates, parser.qname("start")).text = start
            if end is not None:
                etree.SubElement(dates, parser.qname("end")).text = end

            item.clear()
            parser.parse_event_schedule(dates, item)
            return item["dates"]

        # Full start/end date supplied, including UTC offset
        self.assertEqual(
            get_item_dates("2022-07-05T18:00:00+03:00", "2022-07-05T20:00:00+03:00"),
            dict(
                start=datetime(2022, 7, 5, 15, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 17, 0, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
            ),
        )

        # Only start date & time supplied, with time NOT midnight in local time
        self.assertEqual(
            get_item_dates("2022-07-05T18:00:00+03:00"),
            dict(
                start=datetime(2022, 7, 5, 15, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 16, 0, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
            ),
        )

        # Only start date supplied, with time defaulting to midnight local time
        self.assertEqual(
            get_item_dates("2022-07-05"),
            dict(
                start=datetime(2022, 7, 4, 22, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 21, 59, 59, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
            ),
        )

        # Only start & end dates supplied, with start time defaulting to midnight local time
        # and end time defaulting to end of the day, local time
        self.assertEqual(
            get_item_dates("2022-07-05", "2022-07-07"),
            dict(
                start=datetime(2022, 7, 4, 22, 0, tzinfo=utc),
                end=datetime(2022, 7, 7, 21, 59, 59, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
            ),
        )

    def test_editor_3_fields(self):
        self._load_fixture("events_ml_259625.xml")
        self._add_cvs()
        url = "https://www.eurooppamarkkinat.fi/"
        link = f'<a href="{url}" target="_blank">{url}</a>'

        # Test with default fields configured as multi-line text
        item = EventsMLParser().parse(self.xml.getroot(), {"name": "Test"})[0]
        self.assertFalse(item["definition_short"].startswith("<p>"))
        self.assertIn(url, item["definition_short"])
        self.assertNotIn(link, item["definition_short"])
        self.assertNotIn("registration_details", item)

        # Re-test the same fields configured with Editor3
        with self.app.app_context():
            self.app.data.insert(
                "planning_types",
                [
                    {
                        "name": "event",
                        "editor": {
                            "registration_details": {
                                "enabled": True,
                                "group": "description",
                                "index": 9,
                            },
                        },
                        "schema": {
                            "registration_details": {
                                "field_type": "editor_3",
                                "format_options": ["link"],
                                "type": "string",
                                "required": False,
                            },
                            "definition_short": {
                                "field_type": "editor_3",
                                "format_options": ["link"],
                                "type": "string",
                                "required": False,
                            },
                        },
                    }
                ],
            )
        item = EventsMLParser().parse(self.xml.getroot(), {"name": "Test"})[0]

        self.assertTrue(item["definition_short"].startswith("<p>"))
        self.assertIn(url, item["definition_short"])
        self.assertIn(link, item["definition_short"])

        self.assertTrue(item["registration_details"].startswith("<p>"))
        self.assertIn('<a href="mailto:baz@foobar.com">baz@foobar.com</a>', item["registration_details"])
