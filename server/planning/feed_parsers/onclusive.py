import datetime
import logging
import arrow
from superdesk import get_resource_service
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.errors import ParserError

logger = logging.getLogger(__name__)


class Onclusive:
    """
    Superdesk event parser

    Feed Parser which can parse the Onclusive API Events
    """

    NAME = "onclusiveapi"
    label = "Onclusive API"
    all_events = []

    def parse_http(self, content, provider):
        return self.parse(content, provider)

    def parse(self, content, provider=None):
        try:
            for event in content:
                guid = "urn:newsml:{}:{}".format(event["createdDate"], event["itemId"])

                if get_resource_service("events").find_one(req=None, guid=guid):
                    logger.warning("An event already exists with exact same ID. Updating events is not supported yet")
                else:
                    item = {
                        GUID_FIELD: guid,
                        ITEM_TYPE: CONTENT_TYPE.EVENT,
                        "state": CONTENT_STATE.INGESTED,
                    }

                    self.set_occur_status(item)
                    self.parse_item_meta(event, item)
                    self.parse_location(event, item)
                    self.parse_event_details(event, item)
                    self.parse_category(event, item)

                    self.all_events.append(item)
            return self.all_events

        except Exception as ex:
            raise ParserError.parseMessageError(ex, provider)

    def set_occur_status(self, item):
        eocstat_map = get_resource_service("vocabularies").find_one(req=None, _id="eventoccurstatus")
        if not eocstat_map:
            logger.warning("CV 'eventoccurstatus' not found, inserting default from standard")
            item["occur_status"] = {
                "qcode": "eocstat:eos5",
                "name": "Planned, occurs certainly",
                "label": "Planned, occurs certainly",
            }
        else:
            item["occur_status"] = [
                x for x in eocstat_map.get("items", []) if x["qcode"] == "eocstat:eos5" and x.get("is_active", True)
            ][0]
            item["occur_status"].pop("is_active", None)

    def parse_item_meta(self, event, item):
        item["versioncreated"] = self.datetime(event["createdDate"])
        item["firstcreated"] = self.datetime(event["createdDate"])
        item["_updated"] = self.datetime(event["lastEditDate"])
        item["slugline"] = (
            event["summary"] if (event["summary"] is not None and event["summary"] != "") else event["description"]
        )
        item["definition_short"] = event["description"]
        item["links"] = event["website1"]

    def parse_event_details(self, event, item):
        start_date = event["startDate"]
        end_date = event["endDate"]
        timezone = None
        if event.get("timezone"):
            timezone = event["timezone"]["timezoneAbbreviation"]

        item["dates"] = dict(
            start=start_date,
            end=end_date,
            tz=timezone,
        )

    def parse_location(self, event, item):
        item["location"] = [
            {"name": event["venue"], "qcode": "", "address": {"country": event["country"]["countryName"]}}
        ]

    def parse_category(self, event, item):
        item["anpa_category"] = []
        if item.get("categories"):
            for category in event["categories"]:
                item["anpa_category"] = {
                    "name": category["categoryName"],
                    "qcode": category["categoryId"],
                    "subject": "",
                }

    def datetime(self, string):
        try:
            return datetime.datetime.strptime(string, "%Y-%m-%dT%H:%M:%S.000Z")
        except (ValueError, TypeError):
            try:
                return arrow.get(string).datetime
            except arrow.parser.ParserError:
                raise ValueError(string)
