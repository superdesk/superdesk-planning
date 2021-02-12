# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any, List, NamedTuple, Dict

from datetime import timedelta
from flask import current_app as app
from eve.utils import str_to_date

from superdesk.utc import get_timezone_offset, utcnow
from planning.common import get_start_of_next_week, sanitize_query_text


class ElasticQuery:
    """Utility class to build elastic queries"""

    def __init__(self):
        """Default all filters to empty arrays"""

        self.must: List[Dict[str, Any]] = []
        self.must_not: List[Dict[str, Any]] = []
        self.filter: List[Dict[str, Any]] = []

        self.should: List[Dict[str, Any]] = []
        self.sort: List[Any] = []

    def build(self) -> Dict[str, Any]:
        query = {'query': {'bool': {}}}

        if len(self.must):
            query['query']['bool']['must'] = self.must

        if len(self.must_not):
            query['query']['bool']['must_not'] = self.must_not

        if len(self.filter):
            query['query']['bool']['filter'] = self.filter

        if len(self.should):
            query['query']['bool']['should'] = self.should

        if len(self.sort):
            query['sort'] = self.sort

        return query

    def extend_query(self, query: Dict[str, Any]):
        def _extend(key: str):
            conditions = ((query.get('query') or {}).get('bool') or {}).get(key) or []
            if len(conditions):
                self.__dict__[key].extend(conditions)

        _extend('must')
        _extend('must_not')
        _extend('filter')
        _extend('should')


class DateRanges(NamedTuple):
    TODAY: str
    TOMORROW: str
    THIS_WEEK: str
    NEXT_WEEK: str
    LAST_24: str
    FOR_DATE: str


DATE_RANGE: DateRanges = DateRanges(
    'today',
    'tomorrow',
    'this_week',
    'next_week',
    'last24',
    'for_date'
)


class ElasticRangeParams:
    """Class to house elastic range parameters"""

    field: str
    gt: str = None
    gte: str = None
    lt: str = None
    lte: str = None
    value_format: str = None
    time_zone: str = None
    start_of_week: int = 0
    date_range: DATE_RANGE = None
    date: str = None

    def __init__(
            self,
            field: str,
            gt: str = None,
            gte: str = None,
            lt: str = None,
            lte: str = None,
            value_format: str = None,
            time_zone: str = None,
            start_of_week: int = None,
            date_range: DATE_RANGE = None,
            date: str = None
    ):
        """Allows to easily set fields by name using kwargs"""

        self.field = field
        self.gt = gt
        self.gte = gte
        self.lt = lt
        self.lte = lte
        self.value_format = value_format
        self.time_zone = time_zone if time_zone else get_timezone_offset(app.config['DEFAULT_TIMEZONE'], utcnow())
        self.start_of_week = int(start_of_week or 0)
        self.date_range = date_range
        self.date = str_to_date(date) if date else None


def start_of_this_week(start_of_week=0, date=None):
    end = get_start_of_next_week(date, start_of_week) - timedelta(days=7)
    start = end - timedelta(days=7)

    return start.strftime('%Y-%m-%d') + '||/d'


def start_of_next_week(start_of_week=0, date=None):
    return get_start_of_next_week(date, start_of_week).strftime('%Y-%m-%d') + '||/d'


def end_of_next_week(start_of_week=0, date=None):
    start = get_start_of_next_week(date, start_of_week)
    end = start + timedelta(days=7)

    return end.strftime('%Y-%m-%d') + '||/d'


def bool_or(conditions: List[Dict[str, Any]]):
    return {
        'bool': {
            'minimum_should_match': 1,
            'should': conditions
        }
    }


def bool_and(conditions: List[Dict[str, Any]], nested_path: str = None):
    return {
        'bool': {
            'must': conditions
        }
    } if nested_path is None else {
        'nested': {
            'path': nested_path,
            'query': bool_and(conditions)
        }
    }


def term(field: str, value: Any):
    return {
        'term': {
            field: value
        }
    }


def terms(field: str, values: List[Any]):
    return {
        'terms': {
            field: values
        }
    }


def query_string(text: str, lenient: bool = False, default_operator: str = 'OR', field: str = None):
    sanitized_text = sanitize_query_text(text)
    query = f'{field}:({sanitized_text})' if field is not None else sanitized_text

    return {
        'query_string': {
            'query': query,
            'lenient': lenient,
            'default_operator': default_operator
        }
    }


def match_phrase(field: str, value: Any):
    return {
        'match_phrase': {
            field: value
        }
    }


def field_exists(field: str, query_context: bool = True):
    query = {
        'exists': {
            'field': field
        }
    }

    return query if not query_context else {'constant_score': {'filter': query}}


def field_range(query: ElasticRangeParams):
    params = {}

    if query.gt:
        params['gt'] = query.gt

    if query.gte:
        params['gte'] = query.gte

    if query.lt:
        params['lt'] = query.lt

    if query.lte:
        params['lte'] = query.lte

    if query.value_format:
        params['format'] = query.value_format

    if query.time_zone:
        params['time_zone'] = query.time_zone

    return {
        'range': {
            query.field: params
        }
    }


def range_today(query: ElasticRangeParams):
    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone,
        value_format=query.value_format,
        gte='now/d',
        lt='now+24h/d'
    ))


def range_tomorrow(query: ElasticRangeParams):
    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone,
        value_format=query.value_format,
        gte='now+24h/d',
        lt='now+48h/d',
    ))


def range_last_24_hours(query: ElasticRangeParams):
    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone,
        value_format=query.value_format,
        gte='now-24h',
        lt='now'
    ))


def range_this_week(query: ElasticRangeParams):
    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone or app.config['DEFAULT_TIMEZONE'],
        value_format=query.value_format,
        gte=start_of_this_week(query.start_of_week),
        lt=start_of_next_week(query.start_of_week)
    ))


def range_next_week(query: ElasticRangeParams):
    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone or app.config['DEFAULT_TIMEZONE'],
        value_format=query.value_format,
        gte=start_of_next_week(query.start_of_week),
        lt=end_of_next_week(query.start_of_week)
    ))


def range_date(query: ElasticRangeParams):
    date = str_to_date(query.date)

    return field_range(ElasticRangeParams(
        field=query.field,
        time_zone=query.time_zone,
        value_format=query.value_format,
        gte=date.strftime('%Y-%m-%d') + '||/d',
        lt=(date + timedelta(days=1)).strftime('%Y-%m-%d') + '||/d'
    ))


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
