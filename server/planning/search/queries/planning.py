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

from copy import deepcopy

from planning.search.queries import elastic
from planning.common import WORKFLOW_STATE
from .common import get_date_params, COMMON_SEARCH_FILTERS, strtobool, str_to_array


def search_planning(_: Dict[str, Any], query: elastic.ElasticQuery):
    query.must.append(
        elastic.term(
            field='type',
            value='planning'
        )
    )


def search_agendas(params: Dict[str, Any], query: elastic.ElasticQuery):
    agendas = str_to_array(params.get('agendas'))

    if len(agendas):
        query.must.append(
            elastic.terms(
                field='agendas',
                values=agendas
            )
        )


def search_no_agenda_assigned(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('no_agenda_assigned') or ''):
        query.must.append(
            elastic.field_exists('agendas')
        )


def search_ad_hoc_planning(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('ad_hoc_planning') or ''):
        query.must_not.append(
            elastic.field_exists('event_item')
        )


def search_exclude_rescheduled_and_cancelled(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('exclude_rescheduled_and_cancelled') or ''):
        query.must_not.append(
            elastic.terms(
                field='state',
                values=[WORKFLOW_STATE.RESCHEDULED, WORKFLOW_STATE.CANCELLED]
            )
        )


def search_slugline(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('slugline') or ''):
        conditions = [
            elastic.query_string(
                text=params['slugline'],
                field='slugline',
                default_operator='AND'
            )
        ]

        if not strtobool(params.get('no_coverage') or ''):
            conditions.append(
                elastic.bool_and([
                    elastic.query_string(
                        text=params['slugline'],
                        field='coverages.planning.slugline',
                        default_operator='AND'
                    )
                ], 'coverages')
            )

        query.must.append(elastic.bool_or(conditions))


def search_urgency(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('urqency') or ''):
        query.must.append(
            elastic.term(
                field='urgency',
                value=params['urgency']
            )
        )


def search_g2_content_type(params: Dict[str, Any], query: elastic.ElasticQuery):
    if len(params.get('g2_content_type') or ''):
        query.must.append(
            elastic.bool_and([
                elastic.term(
                    field='coverages.planning.g2_content_type',
                    value=params['g2_content_type']
                )
            ], 'coverages')
        )


def search_no_coverage(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('no_coverage') or ''):
        query.must_not.append(
            elastic.bool_and([
                elastic.field_exists('coverages.coverage_id')
            ], 'coverages')
        )


def search_featured(params: Dict[str, Any], query: elastic.ElasticQuery):
    if strtobool(params.get('featured') or ''):
        query.must.append(
            elastic.term(
                field='featured',
                value=True
            )
        )


def search_by_events(params: Dict[str, Any], query: elastic.ElasticQuery):
    event_ids = str_to_array(params.get('event_item'))
    num_ids = len(event_ids)

    if num_ids == 1:
        query.must.append(
            elastic.term(
                field='event_item',
                value=event_ids[0]
            )
        )
    elif num_ids > 1:
        query.must.append(
            elastic.terms(
                field='event_item',
                values=event_ids
            )
        )


def search_date(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if date_filter or start_date or end_date:
        field_name = '_planning_schedule.scheduled'
        base_query = elastic.ElasticRangeParams(
            field=field_name,
            time_zone=tz_offset,
            start_of_week=int(params.get('start_of_week') or 0)
        )

        if date_filter:
            base_query.range = date_filter
            base_query.date = start_date

            query_range = elastic.date_range(base_query)
        else:
            base_query.gte = start_date
            base_query.lte = end_date

            query_range = elastic.date_range(base_query)

            if not query_range['range'][field_name].get('gte') and not not query_range['range'][field_name].get('lte'):
                query_range['range'][field_name]['gte'] = 'now/d'

        planning_schedule = {
            'nested': {
                'path': '_planning_schedule',
                'query': {
                    'bool': {
                        'filter': query_range
                    }
                }
            }
        }

        if strtobool(params.get('include_scheduled_updates') or ''):
            updates_range = {
                'range': {
                    '_updates_schedule.scheduled': deepcopy(query_range['range'][field_name])
                }
            }

            query.filter.append(
                elastic.bool_or([
                    planning_schedule,
                    {
                        'nested': {
                            'path': '_updates_schedule',
                            'query': {
                                'bool': {
                                    'filter': updates_range
                                }
                            }
                        }
                    }
                ])
            )

            query.sort.append({
                field_name: {
                    'order': 'asc',
                    'nested': {
                        'path': '_planning_schedule',
                        'filter': elastic.date_range(elastic.ElasticRangeParams(
                            field=field_name,
                            gte='now/d',
                            time_zone=tz_offset
                        ))
                    }
                }
            })
        else:
            query.filter.append(planning_schedule)
            query.sort.append({
                field_name: {
                    'order': 'asc',
                    'nested': {
                        'path': '_planning_schedule',
                        'filter': query_range
                    }
                }
            })


def search_date_default(params: Dict[str, Any], query: elastic.ElasticQuery):
    date_filter, start_date, end_date, tz_offset = get_date_params(params)

    if not date_filter and not start_date and not end_date:
        field_name = '_planning_schedule.scheduled'
        query_range = elastic.date_range(elastic.ElasticRangeParams(
            field=field_name,
            gte='now/d',
            time_zone=tz_offset,
        ))

        query.filter.append({
            'nested': {
                'path': '_planning_schedule',
                'query': {
                    'bool': {
                        'filter': query_range
                    }
                }
            }
        })

        query.sort.append({
            field_name: {
                'order': 'asc',
                'nested': {
                    'path': '_planning_schedule',
                    'filter': query_range
                }
            }
        })


def search_dates(params: Dict[str, Any], query: elastic.ElasticQuery):
    search_date(params, query)
    search_date_default(params, query)


PLANNING_SEARCH_FILTERS = [
    search_planning,
    search_agendas,
    search_no_agenda_assigned,
    search_ad_hoc_planning,
    search_exclude_rescheduled_and_cancelled,
    search_slugline,
    search_urgency,
    search_g2_content_type,
    search_no_coverage,
    search_featured,
    search_by_events,
    search_dates,
    # search_date,
    # search_date_default,
]

PLANNING_SEARCH_FILTERS.extend(COMMON_SEARCH_FILTERS)

PLANNING_PARAMS = [
    'agendas',
    'no_agenda_assigned',
    'ad_hoc_planning',
    'exclude_rescheduled_and_cancelled',
    'no_coverage',
    'urqency',
    'g2_content_type',
    'featured',
    'include_scheduled_updates',
    'event_item',
]


def construct_planning_search_query(params: Dict[str, Any]) -> Dict[str, Any]:
    query = elastic.ElasticQuery()

    for search_filter in PLANNING_SEARCH_FILTERS:
        search_filter(params, query)

    return query.build()
