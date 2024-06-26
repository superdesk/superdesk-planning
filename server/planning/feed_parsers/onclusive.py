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
from superdesk.utc import utcnow, local_to_utc
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
            logger.info(
                "Parsing event id=%s updated=%s deleted=%s",
                event["itemId"],
                event["lastEditDateUtc"].split(".")[0],
                event["deleted"],
            )

            guid = "urn:onclusive:{}".format(event["itemId"])

            item = {
                GUID_FIELD: guid,
                ITEM_TYPE: CONTENT_TYPE.EVENT,
                "state": CONTENT_STATE.INGESTED,
            }

            try:
                self.set_occur_status(item, event)
                self.parse_item_meta(event, item)
                self.parse_location(event, item)
                self.parse_event_details(event, item)
                self.parse_category(event, item)
                self.parse_contact_info(event, item)
                self.set_expiry(item, provider)
                all_events.append(item)
            except EmbargoedException:
                logger.info("Ignoring embargoed event %s", event["itemId"])
            except Exception as error:
                logger.exception("Error when parsing Onclusive event", extra=dict(event=event, error=str(error)))
        return all_events

    def set_occur_status(self, item, event):
        eocstat_map = get_resource_service("vocabularies").find_one(req=None, _id="eventoccurstatus")
        is_provisional = event.get("isProvisional")

        default_status = {
            "qcode": "eocstat:eos3" if is_provisional else "eocstat:eos5",
            "name": "Planned, May occur" if is_provisional else "Planned, occurs certainly",
            "label": "Planned, May occur" if is_provisional else "Planned, occurs certainly",
        }

        if not eocstat_map:
            logger.warning("CV 'eventoccurstatus' not found, inserting default from standard")
            item["occur_status"] = default_status
        else:
            qcode = "eocstat:eos3" if is_provisional else "eocstat:eos5"
            statuses = [x for x in eocstat_map.get("items", []) if x["qcode"] == qcode and x.get("is_active", True)]

            if statuses:
                item["occur_status"] = statuses[0]
                item["occur_status"].pop("is_active", None)
            else:
                logger.warning(f"No matching status found for qcode {qcode}, using default")
                item["occur_status"] = default_status

    def parse_item_meta(self, event, item):
        item["pubstatus"] = POST_STATE.CANCELLED if event.get("deleted") else POST_STATE.USABLE
        item["versioncreated"] = self.server_datetime(event["lastEditDate"], event.get("lastEditDateUtc"))
        item["firstcreated"] = self.server_datetime(event["createdDate"], event.get("createdDateUtc"))
        item["name"] = (
            event["summary"] if (event["summary"] is not None and event["summary"] != "") else event["description"]
        )
        item["definition_short"] = (
            event["description"] if (event["summary"] != "" and event["summary"] is not None) else ""
        )

        if not item["name"]:
            raise ValueError("Event name is empty")

        item["links"] = [event[key] for key in ("website", "website2") if event.get(key)]
        if event.get("locale"):
            item["language"] = event["locale"].split("-")[0]
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
                all_day=False,
            )
        else:
            item["dates"] = dict(
                start=self.datetime(event["startDate"], "00:00:00"),
                end=self.datetime(event["endDate"], "00:00:00"),
                all_day=True,
                no_end_time=False,
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
                logger.warning(
                    "Could not find timezone for %s event %s",
                    event["timezone"]["timezoneAbbreviation"],
                    event["itemId"],
                )

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

    def server_datetime(self, date, date_utc=None):
        """Convert datetime from server timezone to utc.

        Eventually this will be in utc, so make it configurable.
        """
        if date_utc:
            return (
                datetime.datetime.fromisoformat(date_utc.split(".")[0]).replace(microsecond=0).replace(tzinfo=pytz.utc)
            )
        parsed = datetime.datetime.fromisoformat(date.split(".")[0]).replace(microsecond=0)
        timezone = app.config.get("ONCLUSIVE_SERVER_TIMEZONE", "Europe/London")
        if timezone:
            return local_to_utc(timezone, parsed)
        return parsed.replace(tzinfo=pytz.utc)

    def parse_contact_info(self, event, item):
        for contact_info in event.get("pressContacts"):
            item.setdefault("event_contact_info", [])
            contact_uri = "onclusive:{}".format(contact_info["pressContactID"])
            data = {
                "uri": contact_uri,
                "contact_email": [],
                "contact_phone": [],
                "organisation": "",
                "first_name": "",
                "last_name": "",
            }

            if contact_info.get("pressContactEmail"):
                data["contact_email"].append(contact_info["pressContactEmail"])

            if contact_info.get("pressContactTelephone"):
                data["contact_phone"].append({"number": contact_info["pressContactTelephone"], "public": True})

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
                data.update(
                    {
                        "is_active": True,
                        "public": True,
                    }
                )
                get_resource_service("contacts").post([data])
                item["event_contact_info"].append(bson.ObjectId(data["_id"]))
            else:
                existing_contact_id = bson.ObjectId(existing_contact["_id"])
                get_resource_service("contacts").patch(existing_contact_id, data)
                item["event_contact_info"].append(existing_contact_id)

    def set_expiry(self, event, provider) -> None:
        expiry_minutes = (
            int(provider.get("content_expiry") if provider else 0)
            or int(app.config.get("INGEST_EXPIRY_MINUTES", 0))
            or (60 * 24)
        )
        event["expiry"] = event["dates"]["end"] + datetime.timedelta(minutes=(expiry_minutes))
