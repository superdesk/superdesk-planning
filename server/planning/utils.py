from typing import Union, List, Dict, Any
from bson.objectid import ObjectId
from bson.errors import InvalidId
from datetime import timedelta, datetime
from flask_babel import format_time, format_datetime, lazy_gettext
from eve.utils import str_to_date
import arrow


def try_cast_object_id(value: str) -> Union[ObjectId, str]:
    try:
        return ObjectId(value)
    except InvalidId:
        return value

def get_formatted_contacts(event: Dict[str, Any]) -> List[Dict[str, Union[str, List[str]]]]:
    contacts = event.get("event_contact_info", [])
    formatted_contacts = []
    for contact in contacts:
        if contact.get("public", False):
            formatted_contacts.append(
                {
                    "name": " ".join(
                        [
                            c
                            for c in [
                                contact.get("first_name"),
                                contact.get("last_name"),
                            ]
                            if c
                        ]
                    ),
                    "organisation": contact.get("organisation", ""),
                    "email": ", ".join(contact.get("contact_email", [])),
                    "phone": ", ".join([c.get("number") for c in contact.get("contact_phone", []) if c.get("public")]),
                    "mobile": ", ".join([c.get("number") for c in contact.get("mobile", []) if c.get("public")]),
                    "website": contact.get("website", "")
                }
            )
    return formatted_contacts

def parse_date(datetime: Union[str, datetime]) -> datetime:
    """Return datetime instance for datetime."""
    if isinstance(datetime, str):
        try:
            return str_to_date(datetime)
        except ValueError:
            return arrow.get(datetime).datetime
    return datetime

def time_short(datetime: datetime) -> str:
    if datetime:
        return format_time(parse_date(datetime),"HH:mm")

def date_short(datetime: datetime) -> str:
    if datetime:
        return format_datetime(parse_date(datetime), "dd/MM/yyyy")

def get_event_formatted_dates(event: Dict[str, Any]) -> str:
    DAY_IN_MINUTES = 24 * 60 - 1
    start = event.get("dates", {}).get("start")
    end = event.get("dates", {}).get("end")

    if start + timedelta(minutes=DAY_IN_MINUTES) < end:
        # Multi day event
        return "{} {} - {} {}".format(time_short(start), date_short(start), time_short(end), date_short(end))

    if start + timedelta(minutes=DAY_IN_MINUTES) == end:
        # All day event
        return "{} {}".format(lazy_gettext("ALL DAY"), date_short(start))

    if start == end:
        # start and end dates are the same
        return "{} {}".format(time_short(start), date_short(start))

    return "{} - {}, {}".format(time_short(start), time_short(end), date_short(start))
