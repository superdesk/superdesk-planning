import datetime
import logging
import pytz
import bson
from typing import Dict
from superdesk import get_resource_service
from superdesk.io.feed_parsers import FeedParser
from superdesk.metadata.item import (
    ITEM_TYPE,
    CONTENT_TYPE,
    GUID_FIELD,
    CONTENT_STATE,
)
from superdesk.errors import ParserError
from superdesk.utc import utcnow
from planning.common import POST_STATE
from flask import current_app as app

logger = logging.getLogger(__name__)


class EmbargoedException(RuntimeError):
    pass


class OnclusiveFeedParser(FeedParser):
    """
    Superdesk event parser

    Feed Parser which can parse the Onclusive API Events
    """

    NAME = "onclusive_api"
    label = "Onclusive API"

    ONCLUSIVE_TIMEZONES = [tzname for tzname in pytz.common_timezones if "US" in tzname or "GMT" in tzname]

    default_locale = "en-CA"

    def can_parse(self, content):
        try:
            if not isinstance(content, list):
                return False

            for event in content:
                if not event.get("createdDate") or not event.get("itemId"):
                    return False

            return True
        except Exception:
            return False

    def parse(self, content, provider=None):
        all_events = []
        for event in content:
            guid = "urn:onclusive:{}".format(event["itemId"])

            item = {
                GUID_FIELD: guid,
                ITEM_TYPE: CONTENT_TYPE.EVENT,
                "state": CONTENT_STATE.INGESTED,
            }

            try:
                self.set_occur_status(item)
                self.parse_item_meta(event, item)
                self.parse_location(event, item)
                self.parse_event_details(event, item)
                self.parse_category(event, item)
                self.parse_contact_info(event, item)
                all_events.append(item)
            except EmbargoedException:
                logger.info("Ignoring embargoed event %s", event["itemId"])
            except Exception as error:
                logger.exception("error %s when parsing event %s", error, event["itemId"], extra=dict(event=event))
        return all_events

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
        item["pubstatus"] = POST_STATE.CANCELLED if event.get("deleted") else POST_STATE.USABLE
        item["versioncreated"] = self.datetime(event["lastEditDate"])
        item["firstcreated"] = self.datetime(event["createdDate"])
        item["name"] = (
            event["summary"] if (event["summary"] is not None and event["summary"] != "") else event["description"]
        )
        item["definition_short"] = (
            event["description"] if (event["summary"] != "" and event["summary"] is not None) else ""
        )

        item["links"] = [event[key] for key in ("website", "website2") if event.get(key)]
        item["language"] = event.get("locale") or self.default_locale
        if event.get("embargoTime") and event.get("timezone") and event["timezone"].get("timezoneOffset"):
            tz = datetime.timezone(datetime.timedelta(hours=event["timezone"]["timezoneOffset"]))
            embargoed = datetime.datetime.fromisoformat(event["embargoTime"]).replace(tzinfo=tz)
            if embargoed > utcnow():
                raise EmbargoedException()

    def parse_event_details(self, event, item):
        if event.get("time"):
            start_date = self.datetime(event["startDate"], event.get("time"), event["timezone"])
            end_date = self.datetime(event["endDate"], timezone=event["timezone"])
            tz = self.parse_timezone(start_date, event)
            item["dates"] = dict(
                start=start_date,
                end=max(start_date, end_date),
                no_end_time=True,
                tz=tz,
            )
        else:
            item["dates"] = dict(
                start=self.datetime(event["startDate"], "00:00:00"),
                end=self.datetime(event["endDate"], "00:00:00"),
                all_day=True,
            )

    def parse_timezone(self, start_date, event):
        if event.get("timezone"):
            timezones = (
                app.config.get("ONCLUSIVE_TIMEZONES", self.ONCLUSIVE_TIMEZONES)
                + pytz.common_timezones
                + pytz.all_timezones
            )
            for tzname in timezones:
                try:
                    tz = pytz.timezone(tzname)
                    date = start_date.astimezone(tz)
                except pytz.exceptions.UnknownTimeZoneError:
                    logger.error("Unknown Timezone %s", tzname)
                    continue
                abbr = date.strftime("%Z")
                offset = date.utcoffset().total_seconds() / 3600
                if abbr == event["timezone"]["timezoneAbbreviation"] and offset == event["timezone"]["timezoneOffset"]:
                    return tzname
            else:
                logger.warning("Could not find timezone for %s", event["timezone"]["timezoneAbbreviation"])

    def parse_location(self, event, item):
        if event.get("venue"):
            try:
                venue_data = event.get("venueData", [])[0]
            except (IndexError, KeyError):
                venue_data = {}
            item["location"] = [
                {
                    "name": event["venue"],
                    "qcode": "onclusive-venue:{}".format(venue_data.get("venueId")),
                    "address": self.parse_address(event),
                }
            ]
            if venue_data.get("locationLon") or venue_data.get("locationLat"):
                item["location"][0].setdefault(
                    "location", {"lat": venue_data.get("locationLat"), "lon": venue_data.get("locationLon")}
                )

        elif event.get("countryName"):
            item["location"] = [
                {
                    "name": event["countryName"],
                    "qcode": "onclusive-country:{}".format(event["countryId"]),
                    "address": self.parse_address(event),
                },
            ]

    def parse_address(self, event) -> Dict[str, str]:
        try:
            return {"country": event["countryName"]}
        except KeyError:
            return {}

    def parse_category(self, event, item):
        categories = []
        if event.get("categories"):
            for category in event["categories"]:
                categories.append(
                    {
                        "name": category["categoryName"],
                        "qcode": str(category["categoryId"]),
                        "scheme": "onclusive_categories",
                    }
                )
            # item["subjects"] = categories
        if event.get("eventTypes"):
            for category in event["eventTypes"]:
                categories.append(
                    {
                        "name": category["tagName"],
                        "qcode": str(category["tagId"]),
                        "scheme": "onclusive_event_types",
                    }
                )
        item["subject"] = categories

    def datetime(self, date, time=None, timezone=None, tzinfo=None):
        """Convert value to datetime, if timezone is provided converts it to UTC."""
        if timezone is not None:
            delta = datetime.timedelta(hours=timezone.get("timezoneOffset"))
            tzinfo = datetime.timezone(delta)
        elif tzinfo is None:
            tzinfo = datetime.timezone.utc
        parsed = datetime.datetime.fromisoformat(date.split(".")[0]).replace(tzinfo=tzinfo)
        if time is not None:
            parsed_time = datetime.time.fromisoformat(time)
            parsed = parsed.replace(hour=parsed_time.hour, minute=parsed_time.minute, second=parsed_time.second)
        return parsed.replace(microsecond=0).astimezone(datetime.timezone.utc)

    def parse_contact_info(self, event, item):
        for contact_info in event.get("pressContacts"):
            item.setdefault("event_contact_info", [])
            contact_uri = "onclusive:{}".format(contact_info["pressContactID"])
            data = {"uri": contact_uri}
            if contact_info.get("pressContactEmail"):
                data.setdefault("contact_email", []).append(contact_info["pressContactEmail"])

            if contact_info.get("pressContactTelephone"):
                data.setdefault("contact_phone", []).append(
                    {"number": contact_info["pressContactTelephone"], "public": True}
                )

            if contact_info.get("pressContactOffice"):
                data["organisation"] = contact_info["pressContactOffice"]

            if contact_info.get("pressContactName"):
                try:
                    first, last = contact_info["pressContactName"].rsplit(" ", 1)
                except ValueError:
                    first = ""
                    last = contact_info["pressContactName"]
                data["first_name"] = first
                data["last_name"] = last

            existing_contact = get_resource_service("contacts").find_one(req=None, uri=contact_uri)
            if existing_contact is None:
                logger.debug("New contact %s %s", contact_uri, data.get("organisation"))
                data.update(
                    {
                        "is_active": True,
                        "public": True,
                    }
                )
                get_resource_service("contacts").post([data])
                item["event_contact_info"].append(bson.ObjectId(data["_id"]))
            else:
                logger.debug("Existing contact %s %s", contact_uri, data.get("organisation"))
                get_resource_service("contacts").patch(existing_contact["_id"], data)
                item["event_contact_info"].append(bson.ObjectId(existing_contact["_id"]))
