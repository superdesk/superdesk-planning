from typing import Union, List, Dict, Any, TypedDict
from bson.objectid import ObjectId
from bson.errors import InvalidId
from datetime import datetime
from flask_babel import format_time, format_datetime, lazy_gettext
from eve.utils import str_to_date
import arrow
from flask import current_app as app


class FormattedContact(TypedDict):
    name: str
    organisation: str
    email: List[str]
    phone: List[str]
    mobile: List[str]
    website: str


ALL_DAY_SECONDS = 89999  # Number of seconds for an all-day event
MULTI_DAY_SECONDS = 90000  # Number of seconds for an multi-day event


def try_cast_object_id(value: str) -> Union[ObjectId, str]:
    try:
        return ObjectId(value)
    except InvalidId:
        return value


def get_formatted_contacts(event: Dict[str, Any]) -> List[FormattedContact]:
    contacts = event.get("event_contact_info", [])
    formatted_contacts: List[FormattedContact] = []

    for contact in contacts:
        if contact.get("public", False):
            formatted_contact: FormattedContact = {
                "name": " ".join(
                    [
                        c
                        for c in [
                            contact.get("first_name", ""),
                            contact.get("last_name", ""),
                        ]
                        if c
                    ]
                ),
                "organisation": contact.get("organisation", ""),
                "email": contact.get("contact_email", []),
                "phone": [c.get("number", "") for c in contact.get("contact_phone", []) if c.get("public")],
                "mobile": [c.get("number", "") for c in contact.get("mobile", []) if c.get("public")],
                "website": contact.get("website", ""),
            }
            formatted_contacts.append(formatted_contact)

    return formatted_contacts


def parse_date(datetime: Union[str, datetime]) -> datetime:
    """Return datetime instance for datetime."""
    if isinstance(datetime, str):
        try:
            return str_to_date(datetime)
        except ValueError:
            return arrow.get(datetime).datetime
    return datetime


def time_short(datetime: datetime):
    if datetime:
        return format_time(parse_date(datetime), app.config.get("TIME_FORMAT_SHORT", "HH:mm"))


def date_short(datetime: datetime):
    if datetime:
        return format_datetime(parse_date(datetime), app.config.get("DATE_FORMAT_SHORT", "dd/MM/yyyy"))


def get_event_formatted_dates(event: Dict[str, Any]) -> str:
    start = event.get("dates", {}).get("start")
    end = event.get("dates", {}).get("end")

    duration_seconds = int((end - start).total_seconds())

    if duration_seconds == ALL_DAY_SECONDS:
        # All day event
        return "{} {}".format(lazy_gettext("ALL DAY"), date_short(start))

    if duration_seconds >= MULTI_DAY_SECONDS:
        # Multi day event
        return "{} {} - {} {}".format(time_short(start), date_short(start), time_short(end), date_short(end))

    if start == end:
        # start and end are the same
        return "{} {}".format(time_short(start), date_short(start))

    return "{} - {}, {}".format(time_short(start), time_short(end), date_short(start))
