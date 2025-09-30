import logging

from superdesk.io.feed_parsers import FileFeedParser
from superdesk import get_resource_service
from superdesk.io.subjectcodes import get_subjectcodeitems
from superdesk.utc import utcnow
from superdesk.io.commands.update_ingest import set_expiry
from planning.common import WORKFLOW_STATE
import pytz
import json
import datetime

utc = pytz.UTC
logger = logging.getLogger(__name__)


class EventJsonFeedParser(FileFeedParser):
    """Superdesk event specific parser.

    Feed Parser which can parse the Superdesk Event feed and convert to internal event format,
    but the firstcreated and versioncreated times are localised.
    """

    NAME = "json_event"

    label = "Json Event"

    def can_parse(self, file_path):
        try:
            with open(file_path, "r") as f:
                superdesk_event = json.load(f)
                if superdesk_event.get("type") == "event" and superdesk_event.get("guid"):
                    return True
        except Exception:
            pass
        return False

    async def parse(self, file_path, provider=None):
        self.items = []
        with open(file_path, "r") as f:
            superdesk_event = json.load(f)
        event = await self._transform_from_superdesk_event(superdesk_event)
        set_expiry(event, provider)
        self.items.append(event)
        return self.items

    async def _transform_from_superdesk_event(self, superdesk_event):
        superdesk_event = self.ignore_fields(superdesk_event)
        superdesk_event["_created"] = utcnow()
        superdesk_event["_updated"] = utcnow()
        superdesk_event["state"] = WORKFLOW_STATE.INGESTED

        superdesk_event = self.assign_from_local_cv(superdesk_event)
        superdesk_event = await self.add_to_local_db(superdesk_event)

        if superdesk_event["dates"].get("recurring_rule"):
            superdesk_event["dates"]["recurring_rule"]["_created_externally"] = True

        if superdesk_event["dates"].get("start"):
            superdesk_event["dates"]["start"] = self.datetime(superdesk_event["dates"]["start"])

        if superdesk_event["dates"].get("end"):
            superdesk_event["dates"]["end"] = self.datetime(superdesk_event["dates"]["end"])

        if superdesk_event.get("versioncreated"):
            superdesk_event["versioncreated"] = self.datetime(superdesk_event["versioncreated"])

        if superdesk_event.get("firstcreated"):
            superdesk_event["firstcreated"] = self.datetime(superdesk_event["firstcreated"])

        if superdesk_event.get("accreditation_deadline"):
            superdesk_event["accreditation_deadline"] = self.datetime(superdesk_event["accreditation_deadline"])

        if superdesk_event.get("subject"):
            subject_code_items = get_subjectcodeitems()

            json_qcodes = [item["qcode"] for item in superdesk_event["subject"]]
            superdesk_event["subject"] = [item for item in subject_code_items if item["qcode"] in json_qcodes]

        if superdesk_event.get("location"):
            for location in superdesk_event["location"]:
                if location.get("location") and (
                    location["location"].get("lat") is None or location["location"].get("lon") is None
                ):
                    location.pop("location")

        # Ignore None fields
        superdesk_event = {field: value for field, value in superdesk_event.items() if value is not None}

        return superdesk_event

    def ignore_fields(self, superdesk_event):
        ignore_fields = [
            "files",
            "state_reason",
            "schedule_settings",
            "_current_version",
            "_id",
            "item_id",
            "actioned_date",
        ]

        for field in ignore_fields:
            superdesk_event.pop(field, "")
        return superdesk_event

    def assign_from_local_cv(self, superdesk_event):
        assign_from_local_cv = {
            "anpa_category": "categories",
            "calendars": "event_calendars",
            "place": "locators",
            "occur_status": "eventoccurstatus",
        }

        for field in assign_from_local_cv.keys():
            if superdesk_event.get(field):
                items = (
                    get_resource_service("vocabularies").find_one(req=None, _id=assign_from_local_cv[field]) or {}
                ).get("items", [])

                if field == "occur_status":
                    # In this case, simply assign the occur status from database if it exists.
                    # Else, keep the value in json as it is.
                    for item in items:
                        superdesk_event[field] = next(
                            (item for item in items if superdesk_event[field]["qcode"] == item["qcode"]),
                            superdesk_event[field],
                        )

                else:
                    # In this case, if the qcode exists in the database, assign the item from database.
                    # Else, do not assing any value.
                    json_qcodes = [item["qcode"] for item in superdesk_event[field]]
                    superdesk_event[field] = [item for item in items if item["qcode"] in json_qcodes]

        return superdesk_event

    async def add_to_local_db(self, superdesk_event):
        """Locations and Contacts are first searched into database.

        If any existing item is found having same id, assing that item,
        else, create new item.
        """

        add_to_local_db = {"event_contact_info": "contacts", "location": "locations"}

        for field in add_to_local_db.keys():
            items = superdesk_event.get(field, [])

            for item in items:
                if field == "location":
                    item["_id"] = item.get("qcode")
                if item.get("_id"):
                    service = get_resource_service(add_to_local_db[field])
                    if hasattr(service, "find_one_async"):
                        field_in_database = await service.find_one_async(req=None, _id=item.get("_id"))
                        if not field_in_database:
                            await service.post_async([item])
                    else:
                        field_in_database = service.find_one(req=None, _id=item.get("_id"))
                        if not field_in_database:
                            service.post([item])

            if field == "event_contact_info":
                superdesk_event[field] = [item["_id"] for item in superdesk_event[field]]

        return superdesk_event

    def datetime(self, string):
        try:
            return datetime.datetime.strptime(string, "%Y-%m-%dT%H:%M:%S+0000").replace(tzinfo=utc)
        except ValueError:
            return datetime.datetime.strptime(string, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=utc)
