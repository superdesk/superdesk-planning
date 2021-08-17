# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any, Optional, List, Callable, Union

import logging
from datetime import datetime
from flask import current_app as app
from eve.utils import str_to_date as _str_to_date, date_to_str

from superdesk import get_resource_service
from superdesk.utc import get_timezone_offset, utcnow
from superdesk.errors import SuperdeskApiError
from superdesk.default_settings import strtobool as _strtobool
from superdesk.users.services import current_user_has_privilege

from apps.auth import get_user_id

from planning.search.queries import elastic
from planning.common import POST_STATE, WORKFLOW_STATE

logger = logging.getLogger(__name__)


def get_time_zone(params: Dict[str, Any]):
    return params.get("tz_offset") or get_timezone_offset(app.config["DEFAULT_TIMEZONE"], utcnow())


def get_date_params(params: Dict[str, Any]):
    date_filter = (params.get("date_filter") or "").strip().lower()
    tz_offset = get_time_zone(params)

    try:
        start_date = params.get("start_date")
        if start_date:
            if isinstance(start_date, str):
                if not start_date.endswith("+0000"):
                    params["start_date"] += "+0000"
                    start_date = params["start_date"]

                str_to_date(params["start_date"])  # validating if date can be parsed
            elif isinstance(start_date, datetime):
                start_date = date_to_str(start_date)
    except Exception as e:
        logger.exception(e)
        raise SuperdeskApiError.badRequestError("Invalid value for start date")

    try:
        end_date = params.get("end_date")
        if end_date:
            if isinstance(end_date, str):
                if not end_date.endswith("+0000"):
                    params["end_date"] += "+0000"
                    end_date = params["end_date"]
                str_to_date(params["end_date"])  # validating if date can be parsed
            elif isinstance(end_date, datetime):
                end_date = date_to_str(end_date)
    except Exception as e:
        logger.exception(e)
        raise SuperdeskApiError.badRequestError("Invalid value for end date")

    return date_filter, start_date, end_date, tz_offset


def str_to_array(arg: Optional[Union[List[str], str]] = None) -> List[str]:
    if arg is None:
        return []
    elif len(arg):
        if isinstance(arg, list):
            return arg
        if isinstance(arg, str):
            return arg.split(",")

    return []


def str_to_number(arg: Optional[Union[str, int]] = None) -> Optional[int]:
    if isinstance(arg, int):
        return arg
    elif isinstance(arg, str) and len(arg):
        return int(arg)

    return None


def strtobool(value: Union[bool, str]):
    if isinstance(value, bool):
        return value

    return _strtobool(value)


def str_to_date(value: Union[datetime, str]):
    if isinstance(value, datetime):
        return value

    return _str_to_date(value)


def search_item_ids(params: Dict[str, Any], query: elastic.ElasticQuery):
    ids = [str(item_id) for item_id in str_to_array(params.get("item_ids"))]
    if len(ids):
        query.must.append(elastic.terms(field="_id", values=ids))


def search_name(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get("name") or ""):
        query.must.append(elastic.query_string(text=params["name"], field="name", default_operator="AND"))


def search_full_text(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get("full_text") or ""):
        query.must.append(elastic.query_string(text=params["full_text"], lenient=True, default_operator="AND"))


def search_anpa_category(params: Dict[str, Any], query: elastic.ElasticQuery):
    categories = str_to_array(params.get("anpa_category"))

    if len(categories):
        query.must.append(elastic.terms(field="anpa_category.qcode", values=categories))


def search_subject(params: Dict[str, Any], query: elastic.ElasticQuery):
    subjects = str_to_array(params.get("subject"))

    if len(subjects):
        query.must.append(elastic.terms(field="subject.qcode", values=subjects))


def search_posted(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get("posted", False)):
        query.must.append(elastic.term(field="pubstatus", value=POST_STATE.USABLE))


def search_place(params: Dict[str, Any], query: elastic.ElasticQuery):
    places = str_to_array(params.get("place"))

    if len(places):
        query.must.append(elastic.terms(field="place.qcode", values=places))


def search_language(params: Dict[str, Any], query: elastic.ElasticQuery):
    languages = str_to_array(params.get("language"))

    if len(languages):
        query.must.append(elastic.terms(field="language", values=languages))


def search_locked(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get("lock_state") or ""):

        def add_field_exist_query():
            if params["lock_state"] == "locked":
                query.must.append(elastic.field_exists("lock_session"))
            elif params["lock_state"] == "unlocked":
                query.must_not.append(elastic.field_exists("lock_session"))

        if strtobool(params.get("directly_locked", False)):
            # This request wants only the items that have a lock directly on them
            # Therefore we do not include any associated Items
            add_field_exist_query()
            return

        search_service = get_resource_service("events_planning_search")
        ids = set()
        event_items = set()
        recurrence_ids = set()
        locked_items = search_service.get_locked_items(projections=["_id", "type", "recurrence_id", "event_item"])

        if not locked_items.count():
            # If there are no locked items there is no need to perform logic
            # for the relationships between locked items
            # Simply apply generic `field_exists` query to the original query
            add_field_exist_query()
            return

        for item in locked_items:
            if item.get("recurrence_id"):
                # This item is associated with a recurring series of events
                # Add `recurrence_id` to the query (common field to both events & planning)
                recurrence_ids.add(item["recurrence_id"])
            elif item.get("event_item"):
                # This is a Planning item associated with an event
                # Add queries for `event_item` and `_id` with the ID of the Event
                event_items.add(item["event_item"])
                ids.add(item["event_item"])
            else:
                # This item is locked, add query for it's ID
                ids.add(item["_id"])

                if item.get("type") == "event":
                    # This is an Event, add another query for any associated Planning items
                    event_items.add(item["_id"])

        terms = list()
        if len(ids):
            # Add query for the IDs of Event/Planning items directly locked
            terms.append(elastic.terms(field="_id", values=list(ids)))

        if len(event_items):
            # Add query for associated Planning items of a locked Event
            terms.append(elastic.terms(field="event_item", values=list(event_items)))

        if len(recurrence_ids):
            # Add query for any Event or Planning in a locked recurring series of events
            terms.append(elastic.terms(field="recurrence_id", values=list(recurrence_ids)))

        # Generate the query for the main query of this request
        # Using `elastic.bool_or` enforces that at least one of the above queries
        # must match the documents for it to be included in the results
        if params["lock_state"] == "locked":
            query.must.append(elastic.bool_or(terms))
        elif params["lock_state"] == "unlocked":
            query.must_not.append(elastic.bool_or(terms))


def search_recurrence_id(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get("recurrence_id") or ""):
        query.must.append(elastic.term(field="recurrence_id", value=params["recurrence_id"]))


def append_states_query_for_advanced_search(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get("exclude_states"):
        return

    spike_state = params.get("spike_state")
    states = str_to_array(params.get("state"))

    if len(states):
        # If any states are selected, then filter for these ONLY
        query.must.append(elastic.terms(field="state", values=states))
    else:
        # Otherwise include/exclude Spiked/Killed based on the params provided
        if spike_state == WORKFLOW_STATE.DRAFT:
            query.must_not.append(elastic.term(field="state", value=WORKFLOW_STATE.SPIKED))

        if not strtobool(params.get("include_killed", False)):
            query.must_not.append(elastic.term(field="state", value=WORKFLOW_STATE.KILLED))


def get_sort_field(params: Dict[str, Any], default: str) -> Optional[str]:
    field = params.get("sort_field") or default

    if field == "schedule":
        return "schedule"
    elif field == "created":
        return "firstcreated"
    elif field == "updated":
        return "versioncreated"

    # This means the provided sort filter has invalid an invalid value
    return None


def get_sort_order(params: Dict[str, Any], default: str) -> str:
    return "asc" if (params.get("sort_order") or default) == "ascending" else "desc"


def search_date_non_schedule(params: Dict[str, Any], query: elastic.ElasticQuery):
    field_name = get_sort_field(params, "created")
    if not field_name or field_name == "schedule":
        return

    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if not date_filter and not start_date and not end_date:
        query.filter.append(
            elastic.date_range(elastic.ElasticRangeParams(field=field_name, lte="now/d", time_zone=tz_offset))
        )
    else:
        base_query = elastic.ElasticRangeParams(
            field=field_name,
            time_zone=tz_offset,
            start_of_week=int(params.get("start_of_week") or 0),
        )

        if date_filter:
            base_query.date_range = date_filter
            base_query.date = start_date
        elif start_date and end_date:
            base_query.gte = start_date
            base_query.lte = end_date
        elif start_date:
            base_query.gte = start_date
        elif end_date:
            base_query.lte = end_date

        query_range = elastic.date_range(base_query)
        query.filter.append(query_range)


def construct_query(
    params: Dict[str, Any],
    filters: List[Callable[[Dict[str, Any], elastic.ElasticQuery], None]],
) -> Dict[str, Any]:
    query = elastic.ElasticQuery()

    for search_filter in filters:
        search_filter(params, query)

    return query.build()


def exclude_default_param_dates(filter_params: Dict[str, Any], params: Dict[str, Any]):
    return (filter_params.get("start_date") or filter_params.get("end_date") or filter_params.get("date_filter")) and (
        not params.get("start_date") and not params.get("end_date") and not params.get("date_filter")
    )


def remove_filter_params_from_query(filter_params: Dict[str, Any], params: Dict[str, Any]):
    if exclude_default_param_dates(filter_params, params):
        params["exclude_dates"] = True

    if filter_params.get("spike_state") == params.get("spike_state"):
        params["exclude_states"] = True


def construct_search_query(
    filters: List[Callable[[Dict[str, Any], elastic.ElasticQuery], None]],
    params: Dict[str, Any],
    search_params: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    filter_params = get_params_from_search_filter(search_params)

    if len(filter_params):
        query = elastic.ElasticQuery()

        # Set `only_future` to False as `construct_query` with request params will add this if neccessary
        filter_params["only_future"] = False
        filter_query = construct_query(filter_params, filters)

        remove_filter_params_from_query(filter_params, params)

        param_query = construct_query(params, filters)
        query.sort = param_query.pop("sort", [])

        if len(param_query["query"]["bool"]):
            query.extend_query(filter_query)
            query.extend_query(param_query)

            return query.build()
        else:
            filter_query["sort"] = query.sort
            return filter_query
    else:
        return construct_query(params, filters)


def get_params_from_search_filter(search_filter: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not search_filter:
        return {}

    filter_params = {}

    # Now that we have the search filter, construct params with the ones from the DB
    for key, value in search_filter["params"].items():
        if not value:
            continue
        elif key in ["anpa_category", "subject", "state", "place", "calendars"]:
            value = [item["qcode"] for item in value if item.get("qcode")]
        elif key == "source":
            value = [item["id"] for item in value if item.get("id")]
        elif key in ["location", "urgency", "g2_content_type"]:
            value = value.get("qcode")

        if value:
            filter_params[key] = value

    return filter_params


def search_original_creator(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get("original_creator") or ""):
        query.must.append(elastic.term(field="original_creator", value=params["original_creator"]))


def restrict_items_to_user_only(_params: Dict[str, Any], query: elastic.ElasticQuery):
    user_id = get_user_id(required=False)
    if user_id and not current_user_has_privilege("planning_global_filters"):
        search_original_creator({"original_creator": str(user_id)}, query)


COMMON_SEARCH_FILTERS: List[Callable[[Dict[str, Any], elastic.ElasticQuery], None]] = [
    search_item_ids,
    search_name,
    search_full_text,
    search_anpa_category,
    search_subject,
    search_posted,
    search_place,
    search_language,
    search_locked,
    search_recurrence_id,
    append_states_query_for_advanced_search,
    restrict_items_to_user_only,
    search_original_creator,
]


COMMON_PARAMS: List[str] = [
    "item_ids",
    "name",
    "tz_offset",
    "full_text",
    "anpa_category",
    "subject",
    "posted",
    "place",
    "language",
    "state",
    "spike_state",
    "include_killed",
    "date_filter",
    "start_date",
    "end_date",
    "only_future",
    "start_of_week",
    "slugline",
    "lock_state",
    "directly_locked",
    "recurrence_id",
    "repo",
    "max_results",
    "page",
    "filter_id",
    "projections",
    "sort_order",
    "sort_field",
    "original_creator",
]
