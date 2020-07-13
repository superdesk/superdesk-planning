# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Events and Planning Search. Used by the Events and Planning view on the client"""

import logging
import json
import superdesk
import math
from datetime import timedelta
from werkzeug.datastructures import MultiDict
from eve.utils import ParsedRequest, config, str_to_date
from superdesk.errors import SuperdeskApiError
from superdesk.utc import get_timezone_offset, utcnow
from planning.common import SPIKED_STATE, WORKFLOW_STATE, sanitize_query_text, get_start_of_next_week
from superdesk import get_resource_service

from planning.planning.planning import planning_schema
from planning.events.events_schema import events_schema

from copy import deepcopy


logger = logging.getLogger(__name__)


class EventsPlanningService(superdesk.Service):

    allowed_params = {
        'start_date', 'end_date',
        'full_text', 'slugline',
        'anpa_category', 'subject',
        'posted', 'state',
        'date_filter', 'spike_state',
        'start_of_week', 'page',
        'max_results', 'place',
        'calendars', 'agendas',
        'tz_offset', 'reference'
    }

    default_page_size = 100
    date_filters = {'today', 'tomorrow', 'next_week', 'this_week'},

    def get(self, req, lookup):
        """Retrieve a list of events and planning that match the filter criteria (if any) passed along the HTTP request.

        :param req: object representing the HTTP request
        :type req: `eve.utils.ParsedRequest`
        :param dict lookup: sub-resource lookup from the endpoint URL

        :return: database results cursor object
        :rtype: `pymongo.cursor.Cursor`
        """
        self._check_for_unknown_params(req, whitelist=self.allowed_params)
        items = self._get_events_and_planning(req)
        return self._get_combined_view_data(items, req)

    def _get_combined_view_data(self, items, request):
        """Get list of event and planning for the combined view

        :param items:
        :param request: object representing the HTTP request
        """
        ids = set()
        for item in items:
            # don't want related planing items
            _id = item.get('event_item') or item.get('_id')
            ids.add(_id)

        filters = self._get_date_filters(request)
        page = request.page or 1
        page_size = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': {
                'bool': {
                    'must': [{'terms': {'_id': list(ids)}}],
                }
            },
            'filter': filters,
            'sort': self._get_sort(),
            'size': self._get_page_size(request),
            'from': (page - 1) * page_size
        })
        req.page = request.page or 1
        req.max_results = self._get_page_size(request)
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _get_events_and_planning(self, request):
        """Get list of event and planning based on the search criteria

        :param request: object representing the HTTP request
        """
        filters, must, must_not = self._get_query(request)
        page = request.page or 1
        max_results = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': {'bool': {'must': must, 'must_not': must_not}},
            'filter': filters,
            'size': int((5 * max_results) * math.ceil(page / 3)),
            'sort': self._get_sort()
        })
        req.args['projections'] = json.dumps(['_id', 'type', 'event_item'])
        req.exec_on_fetched_resource = False  # don't call on_fetched_resource
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _check_for_unknown_params(self, request, whitelist):
        """Check if the request contains only allowed parameters.

        :param request: object representing the HTTP request
        :param whitelist: iterable containing the names of allowed parameters.
        """
        if not request or not getattr(request, 'args'):
            return

        request_params = request.args or MultiDict()

        for param_name in request_params.keys():
            if param_name not in whitelist:
                raise SuperdeskApiError.badRequestError(message="Unexpected parameter ({})".format(param_name))

            if len(request_params.getlist(param_name)) > 1:
                desc = "Multiple values received for parameter ({})"
                raise SuperdeskApiError.badRequestError(message=desc.format(param_name))

    def _get_query(self, request):
        """Returns elasticsearch query based on the parameters.

        :param request: object representing the HTTP request
        """
        must_not, must = [], []
        filters = self._get_date_filters(request)
        must.extend(self._map_args_to_term_filter(request))
        must.extend(self._map_args_to_query_string(request))
        must.extend(self._get_query_string_for_slugline(request))
        filter_query = self._get_query_for_not_common_fields(request)
        if filter_query:
            must.append(filter_query)
        self._set_states_query(request, must, must_not)
        return filters, must, must_not

    def _get_query_for_not_common_fields(self, request):
        """Returns forms a OR query to retrieve documents from events and planning using the calendars and agendas.

        :param request: object representing the HTTP request
        """
        or_filters = []
        fields = {
            'calendars': 'calendars.qcode',
            'agendas': 'agendas'
        }
        for key, value in fields.items():
            terms_filter = self._get_terms_filter_for_arguments(request, key, value)
            if terms_filter:
                or_filters.append(terms_filter)
        if or_filters:
            return {
                'bool': {
                    'should': or_filters,
                },
            }

        return None

    def _get_sort(self):
        """Get the sort"""
        return {
            '_planning_schedule.scheduled': {
                'order': 'asc',
                'nested_path': '_planning_schedule'
            }
        }

    def _get_page_size(self, request):
        """Get the page size"""
        return request.max_results if request.max_results else self.default_page_size

    def _set_states_query(self, request, must, must_not):
        """Get the elastic query for workflow state

        :param request: object representing the HTTP request
        :param list must: list of must query filters
        :param list must_not: list of must not query filters for
        """
        params = request.args if request and request.args else MultiDict()
        states = params.get('state')
        try:
            states = json.loads(states)
        except Exception:
            states = []

        spike_state = params.get('spike_state') or SPIKED_STATE.NOT_SPIKED

        if spike_state == SPIKED_STATE.NOT_SPIKED:
            must_not.append({'term': {'state': WORKFLOW_STATE.SPIKED}})
        elif spike_state == SPIKED_STATE.SPIKED:
            must.append({'term': {'state': WORKFLOW_STATE.SPIKED}})
        elif spike_state == SPIKED_STATE.BOTH:
            if len(states):
                states.append(WORKFLOW_STATE.SPIKED)

        if spike_state != SPIKED_STATE.SPIKED and len(states):
            must.append({'terms': {'state': states}})

        try:
            posted = json.loads(params.get('posted'))
        except:  # noqa
            posted = False

        if posted:
            must.append({'term': {'pubstatus': 'usable'}})

        if WORKFLOW_STATE.KILLED not in states:
            must_not.append({'term': {'state': WORKFLOW_STATE.KILLED}})

    def _get_start_of_week(self, params):
        """Get the start of week from request args

        :param MultiDict params: HTTP request arguments
        """
        start_of_week = int(params.get('start_of_week') or 0)
        if start_of_week not in set(range(0, 7)):
            raise SuperdeskApiError.badRequestError('Invalid value for start day of week')
        return start_of_week

    def _get_date_filters(self, request):
        """Get the elastic query for date

        :param request: object representing the HTTP request
        """
        return {
            'bool': {
                'should': [
                    {
                        'bool': {
                            'filter': [
                                {'term': {'type': 'event'}},
                                self._get_events_date_filters(request)
                            ]
                        }
                    },
                    {
                        'bool': {
                            'filter': [
                                {'term': {'type': 'planning'}},
                                self._get_planning_date_filters(request)
                            ]
                        }
                    }
                ]
            }
        }

    def _get_timezone_offset(self, params):
        if params.get('tz_offset') is not None:
            return params.get('tz_offset')
        return get_timezone_offset(config.DEFAULT_TIMEZONE, utcnow())

    def _parse_date_params(self, params):
        """Parse the date params from the request

        :param MultiDict params: HTTP request arguments
        """
        date_filter_param = (params.get('date_filter') or '').strip().lower()

        try:
            start_date = params.get('start_date')
            if start_date:
                str_to_date(params.get('start_date'))  # validating if date can be parsed
        except:  # noqa
            raise SuperdeskApiError.badRequestError('Invalid value for start date')

        try:
            end_date = params.get('end_date')
            if end_date:
                str_to_date(params.get('end_date'))  # validating if date can be parsed
        except:  # noqa
            raise SuperdeskApiError.badRequestError('Invalid value for end date')

        return date_filter_param, start_date, end_date

    def _get_events_date_filters(self, request):
        """Get date filters for events resource

        :param request: object representing the HTTP request
        """
        params = request.args or MultiDict()
        date_filter_param, start_date, end_date = self._parse_date_params(params)
        if not (date_filter_param or start_date or end_date):
            return {
                'range': {
                    'dates.end': {
                        'gte': 'now/d',
                        'time_zone': self._get_timezone_offset(params)
                    }
                }
            }

        start_of_week = self._get_start_of_week(params)
        date_filters = []

        def get_pre_defined_date_filter(start, end):
            filterList = list()
            filterList.append({
                'range': {
                    'dates.start': {
                        'gte': start,
                        'lt': end,
                        'time_zone': self._get_timezone_offset(params)

                    }
                }
            })
            filterList.append({
                'range': {
                    'dates.end': {
                        'gte': start,
                        'lt': end,
                        'time_zone': self._get_timezone_offset(params)
                    }
                }
            })

            filterList.append({
                'bool': {
                    'filter': [
                        {
                            'range': {
                                'dates.start': {
                                    'lt': start,
                                    'time_zone': self._get_timezone_offset(params)
                                },
                            },
                        },
                        {
                            'range': {
                                'dates.end': {
                                    'gt': end,
                                    'time_zone': self._get_timezone_offset(params)
                                },
                            },
                        },
                    ],
                },
            })
            return filterList

        if date_filter_param.lower() == 'today':
            date_filters = get_pre_defined_date_filter('now/d', 'now+24h/d')
        elif date_filter_param.lower() == 'tomorrow':
            date_filters = get_pre_defined_date_filter('now+24h/d', 'now+48h/d')
        elif date_filter_param.lower() == 'this_week':
            end_of_this_week = get_start_of_next_week(None, start_of_week)
            start_of_this_week = end_of_this_week - timedelta(days=7)

            date_filters = get_pre_defined_date_filter(
                '{}||/d'.format(start_of_this_week.strftime(config.ELASTIC_DATE_FORMAT)),
                '{}||/d'.format(end_of_this_week.strftime(config.ELASTIC_DATE_FORMAT))
            )
        elif date_filter_param.lower() == 'next_week':
            start_of_next_week = get_start_of_next_week(None, start_of_week)
            end_of_next_week = start_of_next_week + timedelta(days=7)

            date_filters = get_pre_defined_date_filter(
                '{}||/d'.format(start_of_next_week.strftime(config.ELASTIC_DATE_FORMAT)),
                '{}||/d'.format(end_of_next_week.strftime(config.ELASTIC_DATE_FORMAT))
            )
        else:
            if start_date and not end_date:
                date_filters.extend([
                    {
                        'range': {
                            'dates.start': {
                                'gte': start_date,
                                'time_zone': self._get_timezone_offset(params)
                            },
                        },
                    },
                    {
                        'range': {
                            'dates.end': {
                                'gte': start_date,
                                'time_zone': self._get_timezone_offset(params)
                            },
                        },
                    }
                ])
            elif not start_date and end_date:
                date_filters.extend([
                    {
                        'range': {
                            'dates.end': {
                                'lte': end_date,
                                'time_zone': self._get_timezone_offset(params)
                            },
                        },
                    },
                    {
                        'range': {
                            'dates.start': {
                                'lte': end_date,
                                'time_zone': self._get_timezone_offset(params)
                            },
                        },
                    }
                ])
            else:
                date_filters.extend([
                    {
                        'bool': {
                            'filter': [
                                {
                                    'range': {
                                        'dates.start': {
                                            'gte': start_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        }
                                    }
                                },
                                {
                                    'range': {
                                        'dates.end': {
                                            'lte': end_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        }
                                    }
                                }
                            ]
                        },
                    },
                    {
                        'bool': {
                            'filter': [
                                {
                                    'range': {
                                        'dates.start': {
                                            'lt': start_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        },
                                    },
                                },
                                {
                                    'range': {
                                        'dates.end': {
                                            'gt': end_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        },
                                    },
                                },
                            ],
                        },
                    },
                    {
                        'bool': {
                            'should': [
                                {
                                    'range': {
                                        'dates.start': {
                                            'gte': start_date,
                                            'lte': end_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        },
                                    },
                                },
                                {
                                    'range': {
                                        'dates.end': {
                                            'gte': start_date,
                                            'lte': end_date,
                                            'time_zone': self._get_timezone_offset(params)
                                        },
                                    },
                                },
                            ],
                        },
                    }
                ])

        return {
            'bool': {
                'should': date_filters
            }
        }

    def _get_planning_date_filters(self, request):
        """Get date filters for planning resource

        :param request: object representing the HTTP request
        """
        params = request.args or MultiDict()
        date_filter_param, start_date, end_date = self._parse_date_params(params)
        if not (date_filter_param or start_date or end_date):
            return {
                'nested': {
                    'path': '_planning_schedule',
                    'filter': {
                        'range': {
                            '_planning_schedule.scheduled': {
                                'gte': 'now/d',
                                'time_zone': self._get_timezone_offset(params)
                            }
                        }
                    }
                }
            }

        start_of_week = self._get_start_of_week(params)
        date_filters = {
            'range': {
                '_planning_schedule.scheduled': {
                    'time_zone': self._get_timezone_offset(params)
                }
            }
        }

        if date_filter_param.lower() == 'today':
            date_filters['range']['_planning_schedule.scheduled']['gte'] = 'now/d'
            date_filters['range']['_planning_schedule.scheduled']['lt'] = 'now+24h/d'
        elif date_filter_param.lower() == 'tomorrow':
            date_filters['range']['_planning_schedule.scheduled']['gte'] = 'now+24h/d'
            date_filters['range']['_planning_schedule.scheduled']['lt'] = 'now+48h/d'
        elif date_filter_param.lower() == 'this_week':
            end_of_this_week = get_start_of_next_week(None, start_of_week)
            start_of_this_week = end_of_this_week - timedelta(days=7)

            date_filters['range']['_planning_schedule.scheduled']['gte'] = \
                '{}||/d'.format(start_of_this_week.strftime(config.ELASTIC_DATE_FORMAT))
            date_filters['range']['_planning_schedule.scheduled']['lt'] = \
                '{}||/d'.format(end_of_this_week.strftime(config.ELASTIC_DATE_FORMAT))
        elif date_filter_param.lower() == 'next_week':
            start_of_next_week = get_start_of_next_week(None, start_of_week)
            end_of_next_week = start_of_next_week + timedelta(days=7)

            date_filters['range']['_planning_schedule.scheduled']['gte'] = \
                '{}||/d'.format(start_of_next_week.strftime(config.ELASTIC_DATE_FORMAT))
            date_filters['range']['_planning_schedule.scheduled']['lt'] = \
                '{}||/d'.format(end_of_next_week.strftime(config.ELASTIC_DATE_FORMAT))
        else:
            if start_date:
                date_filters['range']['_planning_schedule.scheduled']['gte'] = start_date
            if end_date:
                date_filters['range']['_planning_schedule.scheduled']['lte'] = end_date

        return {
            'nested': {
                'path': '_planning_schedule',
                'filter': date_filters,
            }
        }

    def _map_args_to_term_filter(self, request):
        """Maps HTTP request arguments to elastic term filters

        :param request: object representing the HTTP request
        """
        arguments = {
            'anpa_category': 'anpa_category.qcode',
            'subject': 'subject.qcode',
            'place': 'place.qcode'
        }
        filters = []

        for arg_name, field_name in arguments.items():
            term_filter = self._get_terms_filter_for_arguments(request, arg_name, field_name)
            if term_filter:
                filters.append(term_filter)

        return filters

    def _map_args_to_query_string(self, request):
        """Maps HTTP request arguments to elastic query string

        :param request: object representing the HTTP request
        """
        arguments = {
            'full_text': None,
            'reference': 'reference'
        }

        filters = []

        for arg_name, field_name in arguments.items():
            query_string_filter = self._get_query_string_for_arguments(request, arg_name, field_name)
            if query_string_filter:
                filters.append(query_string_filter)

        return filters

    def _get_terms_filter_for_arguments(self, request, arg_name, field_name):
        """Returns terms query for request args

        :param request: object representing the HTTP request
        :param str arg_name: request arguments
        :param str field_name: elasticsearch field name
        """

        if not request or not getattr(request, 'args') or not getattr(request, 'args').get(arg_name):
            return None

        filter_value = getattr(request, 'args').get(arg_name)
        try:
            filter_value = json.loads(filter_value)
        except Exception:
            pass

        if not filter_value:
            raise SuperdeskApiError.badRequestError("Bad parameter value for Parameter ({})".format(arg_name))

        if not isinstance(filter_value, list):
            filter_value = [filter_value]

        return {'terms': {field_name: filter_value}}

    def _get_query_string_for_slugline(self, request):
        """Get elasticsearch query string for slugline

        :param request: object representing the HTTP request
        """
        if not request or not getattr(request, 'args') or not getattr(request, 'args').get('slugline'):
            return []

        query_text = sanitize_query_text(getattr(request, 'args').get('slugline'))
        if not query_text:
            return []

        return [{
            'bool': {
                'should': [
                    {
                        'query_string': {
                            'query': 'slugline:({})'.format(query_text),
                            'lenient': False,
                            'default_operator': 'AND'
                        }
                    },
                    {
                        'nested': {
                            'path': 'coverages',
                            'query': {
                                'bool': {
                                    'must': [
                                        {
                                            'query_string': {
                                                'query': 'coverages.planning.slugline:({})'.format(query_text),
                                                'lenient': False,
                                                'default_operator': 'AND'
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }]

    def _get_query_string_for_arguments(self, request, arg_name, field_name=None):
        """Returns query string for request args

        :param request: object representing the HTTP request
        :param str arg_name: request arguments
        :param str field_name: elasticsearch field name
        """
        if not request or not getattr(request, 'args') or not getattr(request, 'args').get(arg_name):
            return None
        search_string = sanitize_query_text(getattr(request, 'args').get(arg_name))
        query_text = '{}{}({})'.format(
            field_name if field_name else '',
            ':' if field_name else '',
            search_string
        )

        return {
            'query_string': {
                'query': query_text,
                'lenient': True,
                'default_operator': 'AND'
            }
        }


class EventsPlanningResource(superdesk.Resource):
    resource_methods = ['GET']
    item_methods = []
    endpoint_name = 'events_planning_search'

    schema = deepcopy(planning_schema)
    schema.update(events_schema)
