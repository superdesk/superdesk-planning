# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any, List, NamedTuple, Dict, Optional, Set
import pytz

from datetime import timedelta, datetime
from eve.utils import str_to_date

from superdesk.core import get_app_config
from planning.common import get_start_of_next_week, sanitize_query_text


class ElasticQuery:
    """Utility class to build elastic queries"""

    def __init__(self) -> None:
        """Default all filters to empty arrays"""

        self.must: List[Dict[str, Any]] = []
        self.must_not: List[Dict[str, Any]] = []
        self.filter: List[Dict[str, Any]] = []

        self.should: List[Dict[str, Any]] = []
        self.sort: List[Any] = []

        self.extra: Dict[str, Any] = {}
        self.multilingual_fields: Set[str] = set()
        self.size: int | None = None

    def build(self) -> Dict[str, Any]:
        query: Dict[str, Any] = {"query": {"bool": {}}}

        if len(self.must):
            query["query"]["bool"]["must"] = self.must

        if len(self.must_not):
            query["query"]["bool"]["must_not"] = self.must_not

        if len(self.filter):
            query["query"]["bool"]["filter"] = self.filter

        if len(self.should):
            query["query"]["bool"]["should"] = self.should

        if len(self.sort):
            query["sort"] = self.sort

        if self.size is not None:
            query["size"] = self.size

        return query

    def extend_query(self, query: Dict[str, Any]):
        def _extend(key: str):
            try:
                conditions = query["query"]["bool"][key]
            except KeyError:
                try:
                    conditions = query["bool"][key]
                except KeyError:
                    conditions = query.get(key, None)

            if conditions:
                self.__dict__[key].extend(conditions)

        _extend("must")
        _extend("must_not")
        _extend("filter")
        _extend("should")


class DateRanges(NamedTuple):
    TODAY: str
    TOMORROW: str
    THIS_WEEK: str
    NEXT_WEEK: str
    LAST_24: str
    FOR_DATE: str


DATE_RANGE: DateRanges = DateRanges("today", "tomorrow", "this_week", "next_week", "last24", "for_date")


class ElasticRangeParams:
    """Class to house elastic range parameters"""

    field: str
    gt: Optional[str] = None
    gte: Optional[str] = None
    lt: Optional[str] = None
    lte: Optional[str] = None
    value_format: Optional[str] = None
    time_zone: Optional[str] = None
    start_of_week: int = 0
    date_range: Optional[DateRanges] = None
    date: Optional[str] = None

    def __init__(
        self,
        field: str,
        gt: Optional[str] = None,
        gte: Optional[str] = None,
        lt: Optional[str] = None,
        lte: Optional[str] = None,
        value_format: Optional[str] = None,
        time_zone: Optional[str] = None,
        start_of_week: Optional[int] = None,
        date_range: Optional[DateRanges] = None,
        date: Optional[str] = None,
    ):
        """Allows to easily set fields by name using kwargs"""

        self.field = field
        self.gt = gt
        self.gte = gte
        self.lt = lt
        self.lte = lte
        self.value_format = value_format
        self.time_zone = time_zone or get_app_config("DEFAULT_TIMEZONE")
        self.start_of_week = int(start_of_week or 0)
        self.date_range = date_range
        self.date = str_to_date(date) if date else None


def start_of_this_week(start_of_week=0, date=None):
    start = get_start_of_next_week(date, start_of_week) - timedelta(days=7)
    return start.strftime("%Y-%m-%d")


def start_of_next_week(start_of_week=0, date=None):
    return get_start_of_next_week(date, start_of_week).strftime("%Y-%m-%d")


def end_of_next_week(start_of_week=0, date=None):
    start = get_start_of_next_week(date, start_of_week)
    end = start + timedelta(days=7)

    return end.strftime("%Y-%m-%d")


def bool_or(conditions: List[Dict[str, Any]]):
    return {"bool": {"minimum_should_match": 1, "should": conditions}}


def bool_and(conditions: List[Dict[str, Any]], nested_path: Optional[str] = None):
    return (
        {"bool": {"must": conditions}}
        if nested_path is None
        else {"nested": {"path": nested_path, "query": bool_and(conditions)}}
    )


def term(field: str, value: Any):
    return {"term": {field: value}}


def terms(field: str, values: List[Any]):
    return {"terms": {field: values}}


def query_string(text: str, lenient: bool = False, default_operator: str = "OR", field: Optional[str] = None):
    sanitized_text = sanitize_query_text(text)
    query = f"{field}:({sanitized_text})" if field is not None else sanitized_text

    return {
        "query_string": {
            "query": query,
            "lenient": lenient,
            "default_operator": default_operator,
        }
    }


def match_phrase(field: str, value: Any):
    return {"match_phrase": {field: value}}


def field_exists(field: str, query_context: bool = True) -> Dict[str, Any]:
    query: Dict[str, Any] = {"exists": {"field": field}}

    return query if not query_context else {"constant_score": {"filter": query}}


def local_day_start(time_zone: Optional[str], offset_days: int = 0) -> str:
    """Return the ISO datetime for the start of "today + offset_days" in the given timezone

    We compute this ourselves (instead of relying on elastic date-math such as "now/d")
    so the resulting value is a concrete datetime that ``field_range`` can convert to a
    plain local date for all day items, the same way it does for other absolute datetimes.
    """

    tz = pytz.timezone(time_zone) if time_zone else pytz.utc
    day = datetime.now(tz).date() + timedelta(days=offset_days)
    return tz.localize(datetime(day.year, day.month, day.day)).isoformat()


def field_range(query: ElasticRangeParams):
    params = {}

    if query.gt:
        params["gt"] = query.gt

    if query.gte:
        params["gte"] = query.gte

    if query.lt:
        params["lt"] = query.lt

    if query.lte:
        params["lte"] = query.lte

    if query.value_format:
        params["format"] = query.value_format

    if query.time_zone:
        params["time_zone"] = query.time_zone

    if query.field in ("dates.start", "dates.end", "_planning_schedule.scheduled", "_updates_schedule.scheduled"):
        # All day items are stored as a plain local calendar date (no real time/zone info), so
        # convert any absolute datetime bounds to that local date too, instead of comparing them
        # as UTC instants against a timezone-aware boundary.
        local_params = params.copy()
        tz = pytz.timezone(params["time_zone"]) if params.get("time_zone") else None
        if tz is not None:
            for key in ("gt", "gte", "lt", "lte"):
                value = local_params.get(key)
                if value and "T" in value:
                    utc_value = datetime.fromisoformat(value.replace("+0000", "+00:00"))
                    local_params[key] = utc_value.astimezone(tz).strftime("%Y-%m-%d")
        # values are now plain dates, so the time_zone param is no longer needed
        local_params.pop("time_zone", None)
        if query.field == "dates.start":
            return {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must_not": [
                                    {"term": {"dates.all_day": True}},
                                ],
                                "must": [
                                    {"range": {query.field: params}},
                                ],
                            },
                        },
                        {
                            "bool": {
                                "must": [
                                    {"term": {"dates.all_day": True}},
                                    {"range": {query.field: local_params}},
                                ],
                            },
                        },
                    ],
                },
            }
        elif query.field == "dates.end":
            return {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must_not": [
                                    {"term": {"dates.all_day": True}},
                                    {"term": {"dates.no_end_time": True}},
                                ],
                                "must": [
                                    {"range": {query.field: params}},
                                ],
                            },
                        },
                        {
                            "bool": {
                                "should": [
                                    {"term": {"dates.all_day": True}},
                                    {"term": {"dates.no_end_time": True}},
                                ],
                                "must": [
                                    {"range": {query.field: local_params}},
                                ],
                                "minimum_should_match": 1,
                            },
                        },
                    ],
                },
            }
        elif query.field == "_planning_schedule.scheduled":
            return {
                "bool": {
                    "should": [
                        {
                            "bool": {
                                "must_not": [{"term": {"all_day": True}}],
                                "must": [
                                    {
                                        "nested": {
                                            "path": "_planning_schedule",
                                            "query": {"bool": {"must": {"range": {query.field: params}}}},
                                        }
                                    }
                                ],
                            }
                        },
                        {
                            "bool": {
                                "must": [
                                    {"term": {"all_day": True}},
                                    {
                                        "nested": {
                                            "path": "_planning_schedule",
                                            "query": {
                                                "bool": {
                                                    # The default Planning date (no coverage) is stored as a
                                                    # plain local date, but a coverage's `scheduled` date is
                                                    # always a real datetime with a timezone, stored in UTC
                                                    "should": [
                                                        {
                                                            "bool": {
                                                                "must_not": {
                                                                    "exists": {
                                                                        "field": "_planning_schedule.coverage_id"
                                                                    }
                                                                },
                                                                "must": {
                                                                    "range": {
                                                                        "_planning_schedule.scheduled": local_params
                                                                    }
                                                                },
                                                            }
                                                        },
                                                        {
                                                            "bool": {
                                                                "must": [
                                                                    {
                                                                        "exists": {
                                                                            "field": "_planning_schedule.coverage_id"
                                                                        }
                                                                    },
                                                                    {"range": {"_planning_schedule.scheduled": params}},
                                                                ]
                                                            }
                                                        },
                                                    ],
                                                    "minimum_should_match": 1,
                                                }
                                            },
                                        }
                                    },
                                ]
                            }
                        },
                    ],
                    "minimum_should_match": 1,
                }
            }
        elif query.field == "_updates_schedule.scheduled":
            return {
                "nested": {"path": "_updates_schedule", "query": {"bool": {"must": {"range": {query.field: params}}}}}
            }

    return {"range": {query.field: params}}


def range_today(query: ElasticRangeParams):
    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=local_day_start(query.time_zone),
            lt=local_day_start(query.time_zone, offset_days=1),
        )
    )


def range_tomorrow(query: ElasticRangeParams):
    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=local_day_start(query.time_zone, offset_days=1),
            lt=local_day_start(query.time_zone, offset_days=2),
        )
    )


def range_last_24_hours(query: ElasticRangeParams):
    now_utc = datetime.now(pytz.utc)
    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=(now_utc - timedelta(hours=24)).isoformat(),
            lt=now_utc.isoformat(),
        )
    )


def range_this_week(query: ElasticRangeParams):
    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=start_of_this_week(query.start_of_week),
            lt=start_of_next_week(query.start_of_week),
        )
    )


def range_next_week(query: ElasticRangeParams):
    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=start_of_next_week(query.start_of_week),
            lt=end_of_next_week(query.start_of_week),
        )
    )


def range_date(query: ElasticRangeParams):
    date = str_to_date(query.date)

    return field_range(
        ElasticRangeParams(
            field=query.field,
            time_zone=query.time_zone,
            value_format=query.value_format,
            gte=date.strftime("%Y-%m-%d") + "||/d",
            lt=(date + timedelta(days=1)).strftime("%Y-%m-%d") + "||/d",
        )
    )


def date_range(query: ElasticRangeParams):
    if query.date_range == DATE_RANGE.TODAY:
        return range_today(query)
    elif query.date_range == DATE_RANGE.TOMORROW:
        return range_tomorrow(query)
    elif query.date_range == DATE_RANGE.THIS_WEEK:
        return range_this_week(query)
    elif query.date_range == DATE_RANGE.NEXT_WEEK:
        return range_next_week(query)
    elif query.date_range == DATE_RANGE.LAST_24:
        return range_last_24_hours(query)
    elif query.date_range == DATE_RANGE.FOR_DATE:
        return range_date(query)
    else:
        return field_range(query)


def nested(path: str, query: Dict[str, Any], score_mode: Optional[str] = None) -> Dict[str, Any]:
    nested_query = {"path": path, "query": query}
    if score_mode is not None:
        nested_query["score_mode"] = score_mode
    return {"nested": nested_query}


def bool_query(
    must: List[Dict[str, Any]] = [],
    must_not: List[Dict[str, Any]] = [],
    should: List[Dict[str, Any]] = [],
    filter: List[Dict[str, Any]] = [],
) -> Dict[str, Any]:
    bool_query_dict: Dict[str, Any] = {}
    if must:
        bool_query_dict["must"] = must
    if must_not:
        bool_query_dict["must_not"] = must_not
    if should:
        bool_query_dict["should"] = should
    if filter:
        bool_query_dict["filter"] = filter
    return {"bool": bool_query_dict}


def exists(field: str) -> Dict[str, Any]:
    return {"exists": {"field": field}}
