# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Union, List, Dict, Any, TypedDict, Optional
import logging
from datetime import datetime

from bson.objectid import ObjectId
from bson.errors import InvalidId
from flask import current_app as app, json
from flask_babel import format_time, format_datetime, lazy_gettext
from eve.utils import str_to_date, ParsedRequest, config
import arrow

from superdesk import get_resource_service
from superdesk.json_utils import cast_item

from planning.types import Event, Planning, PLANNING_RELATED_EVENT_LINK_TYPE, PlanningRelatedEventLink


logger = logging.getLogger(__name__)


class FormattedContact(TypedDict):
    name: str
    organisation: str
    email: List[str]
    phone: List[str]
    mobile: List[str]
    website: str


MULTI_DAY_SECONDS = 24 * 60 * 60  # Number of seconds for an multi-day event
ALL_DAY_SECONDS = MULTI_DAY_SECONDS - 1  # Number of seconds for an all-day event


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


def get_related_planning_for_events(
    event_ids: List[str],
    link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None,
    exclude_planning_ids: Optional[List[str]] = None,
) -> List[Planning]:
    related_events_filters: List[Dict[str, Any]] = [{"terms": {"related_events._id": event_ids}}]
    if link_type is not None:
        related_events_filters.append({"term": {"related_events.link_type": link_type}})

    bool_query: Dict[str, Any] = {
        "filter": {
            "nested": {
                "path": "related_events",
                "query": {"bool": {"filter": related_events_filters}},
            },
        }
    }

    if len(exclude_planning_ids or []) > 0:
        bool_query["must_not"] = {"terms": {"_id": exclude_planning_ids}}

    req = ParsedRequest()
    req.args = {"source": json.dumps({"query": {"bool": bool_query}})}

    return [cast_item(item) for item in get_resource_service("planning").get(req=req, lookup=None)]


def event_has_planning_items(event_id: str, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None) -> bool:
    return len(get_related_planning_for_events([event_id], link_type)) > 0


def get_related_event_links_for_planning(
    plan: Planning, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None
) -> List[PlanningRelatedEventLink]:
    related_events: List[PlanningRelatedEventLink] = plan.get("related_events") or []
    return (
        related_events
        if link_type is None
        else [related_event for related_event in related_events if related_event["link_type"] == link_type]
    )


def get_related_event_ids_for_planning(
    plan: Planning, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None
) -> List[str]:
    return [related_event["_id"] for related_event in get_related_event_links_for_planning(plan, link_type)]


def get_first_related_event_id_for_planning(
    plan: Planning, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None
) -> Optional[str]:
    try:
        return get_related_event_links_for_planning(plan, link_type)[0]["_id"]
    except (KeyError, IndexError, TypeError):
        return None


def get_related_event_items_for_planning(
    plan: Planning, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None
) -> List[Event]:
    event_ids = get_related_event_ids_for_planning(plan, link_type)
    if not len(event_ids):
        return []

    events = list(get_resource_service("events").find(where={"_id": {"$in": event_ids}}))

    if len(event_ids) != len(events):
        logger.warning(
            "Not all Events were found for the Planning item",
            extra=dict(
                plan_id=plan[config.ID_FIELD],
                event_ids_requested=event_ids,
                events_ids_found=[event[config.ID_FIELD] for event in events],
            ),
        )

    return events


def get_first_event_item_for_planning_id(
    planning_id: str, link_type: Optional[PLANNING_RELATED_EVENT_LINK_TYPE] = None
) -> Optional[Event]:
    planning_item = get_resource_service("planning").find_one(req=None, _id=planning_id)
    if not planning_item:
        return None

    first_event_id = get_first_related_event_id_for_planning(planning_item, link_type)
    if not first_event_id:
        return None

    return get_resource_service("events").find_one(req=None, _id=first_event_id)
