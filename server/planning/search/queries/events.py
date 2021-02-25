# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any, Dict

from planning.search.queries import elastic
from .common import get_time_zone, get_date_params, COMMON_SEARCH_FILTERS, COMMON_PARAMS, strtobool, str_to_array


def get_advanced_search(params: Dict[str, Any]):
    return params.get('advancedSearch') or {}


def get_dates(params: Dict[str, Any]):
    return get_advanced_search(params).get('dates') or {}


def search_events(_: Dict[str, Any], query: elastic.ElasticQuery):
    query.must.append(
        elastic.term(
            field='type',
            value='event'
        )
    )


def search_slugline(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('slugline') or ''):
        query.must.append(
            elastic.query_string(
                text=params['slugline'],
                field='slugline',
                default_operator='AND'
            )
        )


def search_reference(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('reference') or ''):
        query.must.append(
            elastic.query_string(
                text=params['reference'],
                field='reference',
                default_operator='AND'
            )
        )


def search_source(params: Dict[str, Any], query: elastic.ElasticQuery):
    sources = [
        str(source_id)
        for source_id in str_to_array(params.get('source'))
    ]

    if len(sources):
        query.must.append(
            elastic.terms(
                field='ingest_provider',
                values=sources
            )
        )


def search_location(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('location') or ''):
        query.must.append(
            elastic.term(
                field='location.qcode',
                value=params['location']
            )
        )


def search_calendars(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('no_calendar_assigned', False)):
        # The `no_calendar_assigned` param should override the `calendars` param
        return

    calendars = str_to_array(params.get('calendars'))
    num_calendars = len(calendars)

    if num_calendars == 1:
        query.must.append(
            elastic.term(
                field='calendars.qcode',
                value=calendars[0]
            )
        )
    elif num_calendars > 1:
        query.must.append(
            elastic.terms(
                field='calendars.qcode',
                values=calendars
            )
        )


def search_no_calendar_assigned(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('no_calendar_assigned', False)):
        query.must_not.append(
            elastic.field_exists('calendars')
        )


def search_date_today(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('date_filter') == elastic.DATE_RANGE.TODAY:
        time_zone = get_time_zone(params)

        query.filter.append(elastic.bool_or([
            elastic.range_today(elastic.ElasticRangeParams(
                field='dates.start',
                time_zone=time_zone
            )),
            elastic.range_today(elastic.ElasticRangeParams(
                field='dates.end',
                time_zone=time_zone
            )),
            elastic.bool_and([
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt='now/d',
                    time_zone=time_zone,
                )),
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gt='now+24h/d',
                    time_zone=time_zone
                ))
            ])
        ]))


def search_date_tomorrow(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('date_filter') == elastic.DATE_RANGE.TOMORROW:
        time_zone = get_time_zone(params)

        query.filter.append(elastic.bool_or([
            elastic.range_tomorrow(elastic.ElasticRangeParams(
                field='dates.start',
                time_zone=time_zone
            )),
            elastic.range_tomorrow(elastic.ElasticRangeParams(
                field='dates.end',
                time_zone=time_zone
            )),
            elastic.bool_and([
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt='now+24h/d',
                    time_zone=time_zone
                )),
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gt='now+48h/d',
                    time_zone=time_zone
                ))
            ])
        ]))


def search_date_last_24_hours(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('date_filter') == elastic.DATE_RANGE.LAST_24:
        time_zone = get_time_zone(params)

        query.filter.append(elastic.bool_or([
            elastic.range_last_24_hours(elastic.ElasticRangeParams(
                field='dates.start',
                time_zone=time_zone
            )),
            elastic.range_last_24_hours(elastic.ElasticRangeParams(
                field='dates.end',
                time_zone=time_zone
            )),
            elastic.bool_and([
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt='now-24h',
                    time_zone=time_zone
                )),
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gt='now',
                    time_zone=time_zone
                ))
            ])
        ]))


def search_date_this_week(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('date_filter') == elastic.DATE_RANGE.THIS_WEEK:
        time_zone = get_time_zone(params)
        start_of_week = int(params.get('start_of_week') or 0)

        query.filter.append(elastic.bool_or([
            elastic.range_this_week(elastic.ElasticRangeParams(
                field='dates.start',
                time_zone=time_zone,
                start_of_week=start_of_week
            )),
            elastic.range_this_week(elastic.ElasticRangeParams(
                field='dates.end',
                time_zone=time_zone,
                start_of_week=start_of_week
            )),
            elastic.bool_and([
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt=elastic.start_of_this_week(start_of_week),
                    time_zone=time_zone
                )),
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gte=elastic.start_of_next_week(start_of_week),
                    time_zone=time_zone
                ))
            ])
        ]))


def search_date_next_week(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('date_filter') == elastic.DATE_RANGE.NEXT_WEEK:
        time_zone = get_time_zone(params)
        start_of_week = int(params.get('start_of_week') or 0)

        query.filter.append(elastic.bool_or([
            elastic.range_next_week(elastic.ElasticRangeParams(
                field='dates.start',
                time_zone=time_zone,
                start_of_week=start_of_week
            )),
            elastic.range_next_week(elastic.ElasticRangeParams(
                field='dates.end',
                time_zone=time_zone,
                start_of_week=start_of_week
            )),
            elastic.bool_and([
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt=elastic.start_of_next_week(start_of_week),
                    time_zone=time_zone
                )),
                elastic.field_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gte=elastic.end_of_next_week(start_of_week),
                    time_zone=time_zone
                ))
            ])
        ]))


def search_date_start(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if not date_filter and start_date and not end_date:
        query.filter.append(elastic.bool_or([
            elastic.date_range(elastic.ElasticRangeParams(
                field='dates.start',
                gte=start_date,
                time_zone=tz_offset
            )),
            elastic.date_range(elastic.ElasticRangeParams(
                field='dates.end',
                gte=start_date,
                time_zone=tz_offset
            ))
        ]))


def search_date_end(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if not date_filter and not start_date and end_date:
        query.filter.append(elastic.bool_or([
            elastic.date_range(elastic.ElasticRangeParams(
                field='dates.start',
                lte=end_date,
                time_zone=tz_offset
            )),
            elastic.date_range(elastic.ElasticRangeParams(
                field='dates.end',
                lte=end_date,
                time_zone=tz_offset
            ))
        ]))


def search_date_range(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if not date_filter and start_date and end_date:
        query.filter.append(elastic.bool_or([
            elastic.bool_and([
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    gte=start_date,
                    time_zone=tz_offset
                )),
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    lte=end_date,
                    time_zone=tz_offset
                )),
            ]),
            elastic.bool_and([
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    lt=start_date,
                    time_zone=tz_offset
                )),
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gt=end_date,
                    time_zone=tz_offset
                ))
            ]),
            elastic.bool_or([
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.start',
                    gte=start_date,
                    lte=end_date,
                    time_zone=tz_offset
                )),
                elastic.date_range(elastic.ElasticRangeParams(
                    field='dates.end',
                    gte=start_date,
                    lte=end_date,
                    time_zone=tz_offset
                ))
            ])
        ]))


def search_date_default(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)
    only_future = strtobool(params.get('only_future', True))

    if not date_filter and not start_date and not end_date and only_future:
        query.filter.append(
            elastic.date_range(elastic.ElasticRangeParams(
                field='dates.end',
                gte='now/d',
                time_zone=get_time_zone(params)
            ))
        )


def search_dates(params: Dict[str, Any], query: elastic.ElasticQuery):
    if params.get('exclude_dates'):
        return

    search_date_today(params, query)
    search_date_tomorrow(params, query)
    search_date_last_24_hours(params, query)
    search_date_this_week(params, query)
    search_date_next_week(params, query)
    search_date_start(params, query)
    search_date_end(params, query)
    search_date_range(params, query)
    search_date_default(params, query)


EVENT_SEARCH_FILTERS = [
    search_events,
    search_slugline,
    search_reference,
    search_source,
    search_location,
    search_calendars,
    search_no_calendar_assigned,
    search_dates,
]

EVENT_SEARCH_FILTERS.extend(COMMON_SEARCH_FILTERS)

EVENT_PARAMS = [
    'reference',
    'source',
    'location',
    'calendars',
    'no_calendar_assigned',
]

EVENT_PARAMS.extend(COMMON_PARAMS)
