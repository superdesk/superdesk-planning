from typing import Optional
from os import path
from datetime import datetime, timedelta
from dateutil.tz import tzoffset
from pytz import utc
from copy import deepcopy
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.etree import etree
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.io.commands.update_ingest import ingest_item
from superdesk.tests import utils as test_utils, fixtures

from planning.feed_parsers.events_ml import EventsMLParser
from planning.common import POST_STATE
from planning.tests import TestCase, fixtures as planning_fixtures


class EventsMLFeedParserTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await planning_fixtures.publish_config.configure_planning_publishing()
        self.provider = {
            "_id": ObjectId(),
            "source": "sf",
            "name": "EventsML Ingest",
        }
        await test_utils.post_items("ingest_providers", [self.provider])

    def _load_fixture(self, filename: str):
        dirname = path.dirname(path.realpath(__file__))
        fixture = path.normpath(path.join(dirname, "fixtures", filename))
        with open(fixture, "rb") as f:
            self.xml = etree.parse(f)

    async def _add_cvs(self):
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

    async def test_can_parse(self):
        self._load_fixture("events_ml_259625.xml")
        self.assertTrue(EventsMLParser().can_parse(self.xml.getroot()))

        self._load_fixture("planning.xml")
        self.assertFalse(EventsMLParser().can_parse(self.xml.getroot()))

    async def test_content(self):
        self._load_fixture("events_ml_259625.xml")
        await self._add_cvs()
        item = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]

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

    async def test_parse_event_schedule(self):
        self._load_fixture("events_ml_259625.xml")
        parser = EventsMLParser()
        item = {}

        async def get_item_dates(start: str, end: Optional[str] = None):
            root = self.xml.getroot()
            parser.root = root

            dates = root.find(parser.qname("concept")).find(parser.qname("eventDetails")).find(parser.qname("dates"))
            for child in list(dates):
                dates.remove(child)

            etree.SubElement(dates, parser.qname("start")).text = start
            if end is not None:
                etree.SubElement(dates, parser.qname("end")).text = end

            item.clear()
            await parser.parse_event_schedule(dates, item)
            return item["dates"]

        # Full start/end date supplied, including UTC offset
        self.assertEqual(
            await get_item_dates("2022-07-05T18:00:00+03:00", "2022-07-05T20:00:00+03:00"),
            dict(
                start=datetime(2022, 7, 5, 15, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 17, 0, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
                all_day=False,
                no_end_time=False,
            ),
        )

        # Only start date & time supplied, with time NOT midnight in local time
        self.assertEqual(
            await get_item_dates("2022-07-05T18:00:00+03:00"),
            dict(
                start=datetime(2022, 7, 5, 15, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 16, 0, tzinfo=utc),
                tz=self.app.config["DEFAULT_TIMEZONE"],
                all_day=False,
                no_end_time=False,
            ),
        )

        # Only start date supplied, with time defaulting to midnight local time
        self.assertEqual(
            await get_item_dates("2022-07-05"),
            dict(
                start=datetime(2022, 7, 5, 0, 0, tzinfo=utc),
                end=datetime(2022, 7, 5, 23, 59, 59, tzinfo=utc),
                all_day=True,
                no_end_time=True,
                tz=None,
            ),
        )

        # Only start & end dates supplied, with start time defaulting to midnight local time
        # and end time defaulting to end of the day, local time
        self.assertEqual(
            await get_item_dates("2022-07-05", "2022-07-07"),
            dict(
                start=datetime(2022, 7, 5, 0, 0, tzinfo=utc),
                end=datetime(2022, 7, 7, 23, 59, 59, tzinfo=utc),
                all_day=True,
                no_end_time=True,
                tz=None,
            ),
        )

    async def test_editor_3_fields(self):
        self._load_fixture("events_ml_259625.xml")
        await self._add_cvs()
        url = "https://www.eurooppamarkkinat.fi/"
        link = f'<a href="{url}" target="_blank">{url}</a>'

        # Test with default fields configured as multi-line text
        item = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]
        self.assertFalse(item["definition_short"].startswith("<p>"))
        self.assertIn(url, item["definition_short"])
        self.assertNotIn(link, item["definition_short"])
        self.assertNotIn("registration_details", item)

        # Re-test the same fields configured with Editor3
        await test_utils.post_items(
            "planning_types",
            [
                {
                    "name": "event",
                    "type": "event",
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
        item = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]

        self.assertTrue(item["definition_short"].startswith("<p>"))
        self.assertIn(url, item["definition_short"])
        self.assertIn(link, item["definition_short"])

        self.assertTrue(item["registration_details"].startswith("<p>"))
        self.assertIn('<a href="mailto:baz@foobar.com">baz@foobar.com</a>', item["registration_details"])

    async def test_update_event(self):
        service = get_resource_service("events")
        self._load_fixture("events_ml_259625.xml")
        await self._add_cvs()
        source = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]

        # Ingest first version
        ingested, ids = await ingest_item(source, provider=self.provider, feeding_service={})
        self.assertTrue(ingested)
        self.assertIn(source["guid"], ids)
        dest = list(service.get_from_mongo(req=None, lookup={"guid": source["guid"]}))[0]
        self.assertEqual(dest["name"], "Pesäpallo: Miesten Superpesis, klo 18 Hyvinkää-Kankaanpää")

        # Attempt to update with same version
        source["ingest_versioncreated"] += timedelta(hours=1)
        source["versioncreated"] = source["ingest_versioncreated"]
        source["name"] = "Test name"
        await test_utils.patch_item("ingest_providers", self.provider["_id"], {"disable_item_updates": True})
        self.provider["disable_item_updates"] = True
        ingested, ids = await ingest_item(source, provider=self.provider, feeding_service={})
        self.assertFalse(ingested)

        # Attempt to update with a new version
        source["ingest_versioncreated"] += timedelta(hours=1)
        source["versioncreated"] = source["ingest_versioncreated"]
        source["name"] = "Test name"
        self.provider.pop("disable_item_updates")
        await test_utils.patch_item("ingest_providers", self.provider["_id"], {"disable_item_updates": False})
        ingested, ids = await ingest_item(source, provider=self.provider, feeding_service={})
        self.assertTrue(ingested)
        self.assertIn(source["guid"], ids)
        dest = list(service.get_from_mongo(req=None, lookup={"guid": source["guid"]}))[0]
        self.assertEqual(dest["name"], "Test name")

    async def test_update_published_event(self):
        service = get_resource_service("events")
        published_service = get_resource_service("published_planning")

        self._load_fixture("events_ml_259625.xml")
        await self._add_cvs()
        original_source = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]
        source = deepcopy(original_source)

        # Ingest first version
        await ingest_item(source, provider=self.provider, feeding_service={})

        # Publish the Event
        await service.patch_async(
            source["guid"],
            {
                "pubstatus": POST_STATE.USABLE,
                "state": CONTENT_STATE.SCHEDULED,
            },
        )

        # Make sure the Event has been added to the ``published_planning`` collection
        self.assertEqual(await published_service.count_async({"item_id": source["guid"]}), 1)
        dest = list(service.get_from_mongo(req=None, lookup={"guid": source["guid"]}))[0]
        self.assertEqual(dest["state"], CONTENT_STATE.SCHEDULED)
        self.assertEqual(dest["pubstatus"], POST_STATE.USABLE)

        # Ingest a new version of the item, and make sure the item is re-published
        source = deepcopy(original_source)
        source["versioncreated"] += timedelta(hours=1)
        await ingest_item(source, provider=self.provider, feeding_service={})
        self.assertEqual(published_service.get(req=None, lookup={"item_id": source["guid"]}).count(), 2)
        dest = list(service.get_from_mongo(req=None, lookup={"guid": source["guid"]}))[0]

        # Make sure the item state has not changed after ingest
        self.assertEqual(dest["state"], CONTENT_STATE.SCHEDULED)
        self.assertEqual(dest["pubstatus"], POST_STATE.USABLE)

        # Ingest another version, this time cancel the item
        source = deepcopy(original_source)
        source["versioncreated"] += timedelta(hours=2)
        source["pubstatus"] = POST_STATE.CANCELLED
        await ingest_item(source, provider=self.provider, feeding_service={})
        self.assertEqual(published_service.get(req=None, lookup={"item_id": source["guid"]}).count(), 3)
        dest = list(service.get_from_mongo(req=None, lookup={"guid": source["guid"]}))[0]

        # Make sure the item state was changed after ingest
        self.assertEqual(dest["state"], CONTENT_STATE.KILLED)
        self.assertEqual(dest["pubstatus"], POST_STATE.CANCELLED)

    async def test_parse_dates(self):
        self._load_fixture("events_ml_259270.xml")
        await self._add_cvs()
        source = (await EventsMLParser().parse(self.xml.getroot(), {"name": "Test"}))[0]
        dates = source["dates"]
        self.assertTrue(dates["all_day"])
        self.assertEqual(datetime(2022, 11, 10, tzinfo=utc), dates["start"])
        self.assertEqual(datetime(2022, 11, 11, 23, 59, 59, tzinfo=utc), dates["end"])
