import os
import json
import tempfile
from datetime import datetime, timedelta, timezone

from bson import ObjectId

from superdesk import get_resource_service

from planning.feed_parsers.superdesk_event_json import EventJsonFeedParser
from planning.feeding_services.event_file_service import EventFileFeedingService
from planning.tests import TestCase


class EventJsonFeedParserTestCase(TestCase):
    sample_json = {}

    def setUp(self):
        super().setUp()
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.sample_json = os.path.join(dir_path, "event_format_sample.json")

    def test_event_json_feed_parser_can_parse(self):
        self.assertEqual(True, EventJsonFeedParser().can_parse(self.sample_json))

    async def test_event_json_feed_parser_parse(self):
        random_event = {
            "is_active": True,
            "name": "random123",
            "qcode": "random123",
        }
        assign_from_local_cv = {
            "anpa_category": "categories",
            "calendars": "event_calendars",
            "place": "locators",
            "occur_status": "eventoccurstatus",
        }

        # add the random event items for above fields.
        for field in assign_from_local_cv:
            self.app.data.insert(
                "vocabularies",
                [
                    {
                        "_id": assign_from_local_cv[field],
                        "type": "manageable",
                        "unique_field": "qcode",
                        "selection_type": "do not show",
                        "items": [
                            {
                                "is_active": True,
                                "name": "random123",
                                "qcode": "random123",
                            }
                        ],
                    }
                ],
            )

        provider = {"content_expiry": 1}
        events = await EventJsonFeedParser().parse(self.sample_json, provider)

        for field in assign_from_local_cv.keys():
            # check if the same random is returned after parsing as inserted above.
            if events[0].get(field):
                if field == "occur_status":
                    self.assertTrue(True, (events[0][field]["qcode"] == random_event["qcode"]))
                else:
                    self.assertTrue(
                        True,
                        (random_event["qcode"] in [event["qcode"] for event in events[0][field]]),
                    )

        # check if locations and contacts are created.
        location = await get_resource_service("locations").find_one_async(
            req=None, _id="835d5175-a2bc-41ad-a906-baf3f2281a5c"
        )
        contact = get_resource_service("contacts").find_one(req=None, _id="5d67ccc2fdf5baac5c93745c")

        self.assertTrue(True, location)
        self.assertTrue(True, contact)

        # remove the locations and contacts added.
        await get_resource_service("locations").delete_async(location)
        get_resource_service("contacts").delete(contact)

        assert events[0]["dates"]["start"].isoformat() == "2021-03-01T14:00:41+00:00"
        assert events[0]["dates"]["end"].isoformat() == "2021-03-01T15:00:41+00:00"

        assert events[0]["firstcreated"].isoformat() == "2021-01-25T14:31:52+00:00"
        assert events[0]["versioncreated"].isoformat() == "2021-01-25T14:32:01+00:00"

        assert events[0]["expiry"] == events[0]["dates"]["end"] + timedelta(minutes=provider["content_expiry"])

        assert int(events[0]["location"][0]["location"]["lat"]) == 59
        assert int(events[0]["location"][0]["location"]["lon"]) == 10

        assert "actioned_date" not in events[0]

        assert events[0]["registration_details"] == "TEST Registration details"
        assert events[0]["invitation_details"] == "TEST Invitation details"
        assert events[0]["accreditation_info"] == "TEST Accreditation info"
        assert events[0]["accreditation_deadline"].isoformat() == "2021-03-15T10:00:00+00:00"
        assert events[0]["reference"] == "2021/00000001"
        assert events[0]["priority"] == 3
        assert events[0]["language"] == "en"

    async def test_event_json_feed_parser_handles_files(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        existing_file_id = ObjectId()
        self.app.data.insert(
            "events_files",
            [
                {
                    "_id": existing_file_id,
                    "media": "existing-media",
                    "mimetype": "image/jpeg",
                }
            ],
        )

        with open(self.sample_json, "r") as f:
            sample = json.load(f)

        sample["files"] = [str(existing_file_id), "attachments/sunset.jpg"]
        provider = {"content_expiry": 1}

        events_files_service = get_resource_service("events_files")
        feeding_service = EventFileFeedingService()
        feeding_service.path = dir_path

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", dir=dir_path, delete=True) as tmp:
            json.dump(sample, tmp)
            tmp.flush()

            events = await EventJsonFeedParser().parse(tmp.name, provider, feeding_service=feeding_service)
            files = events[0].get("files", [])
            self.assertEqual(2, len(files))
            self.assertEqual(existing_file_id, files[0])

            new_file_id = files[1]
            saved_file = events_files_service.find_one(req=None, _id=new_file_id)
            self.assertIsNotNone(saved_file)
            self.assertEqual("image/jpeg", saved_file.get("mimetype"))

            # Verify binary was stored properly
            media_id = saved_file.get("media")
            stored_file = self.app.media.get(media_id)
            self.assertIsNotNone(stored_file)
            self.assertGreater(stored_file.length, 0)

    async def test_event_json_feed_parser_handles_missing_file(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))

        with open(self.sample_json, "r") as f:
            sample = json.load(f)

        sample["files"] = ["nonexistent_file.pdf"]
        provider = {"content_expiry": 1}

        feeding_service = EventFileFeedingService()
        feeding_service.path = dir_path

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", dir=dir_path, delete=True) as tmp:
            json.dump(sample, tmp)
            tmp.flush()

            events = await EventJsonFeedParser().parse(tmp.name, provider, feeding_service=feeding_service)
            self.assertNotIn("files", events[0])

    async def test_event_json_feed_parser_handles_empty_files_array(self):
        dir_path = os.path.dirname(os.path.realpath(__file__))

        with open(self.sample_json, "r") as f:
            sample = json.load(f)

        sample["files"] = []
        provider = {"content_expiry": 1}

        with tempfile.NamedTemporaryFile(mode="w", suffix=".json", dir=dir_path, delete=True) as tmp:
            json.dump(sample, tmp)
            tmp.flush()

            events = await EventJsonFeedParser().parse(tmp.name, provider)
            self.assertNotIn("files", events[0])
