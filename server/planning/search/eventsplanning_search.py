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
import math
from typing import List
from copy import deepcopy

from werkzeug.datastructures import MultiDict
from eve.utils import ParsedRequest

from superdesk import Resource, Service
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service

from planning.planning.planning import planning_schema
from planning.events.events_schema import events_schema

from .queries.planning import PLANNING_PARAMS, construct_planning_search_query
from .queries.events import EVENT_PARAMS, construct_events_search_query
from .queries.combined import COMBINED_PARAMS, construct_combined_search_query, construct_combined_view_data_query


logger = logging.getLogger(__name__)


class EventsPlanningService(Service):
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

        params = req.args or MultiDict()
        repo = params.get('repo', 'combined')

        self._check_for_unknown_params(params, self._get_whitelist(repo))

        if repo == 'events':
            return self._search_events(req)
        elif repo == 'planning':
            return self._search_planning(req)
        else:
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

        query = construct_combined_view_data_query(request.args or MultiDict(), ids)
        page = request.page or 1
        page_size = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
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
        params = request.args or MultiDict()
        query = construct_combined_search_query(params)
        page = request.page or 1
        max_results = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': query['sort'] if query.get('sort') else self._get_sort(),
            'size': int((5 * max_results) * math.ceil(page / 3)),
        })
        req.args['projections'] = json.dumps(['_id', 'type', 'event_item'])
        req.page = page
        req.max_results = max_results
        req.exec_on_fetched_resource = False  # don't call on_fetched_resource
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _search_events(self, request):
        params = request.args or MultiDict()
        query = construct_events_search_query(params)
        page = request.page or 1
        page_size = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': query['sort'] if query.get('sort') else {'dates.start': {'order': 'asc'}},
            'size': self._get_page_size(request),
            'from': (page - 1) * page_size
        })
        req.args['repos'] = 'events'
        req.page = page
        req.max_results = page_size
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _search_planning(self, request):
        params = request.args or MultiDict()
        query = construct_planning_search_query(params)
        page = request.page or 1
        page_size = self._get_page_size(request)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': query['sort'] if query.get('sort') else self._get_sort(),
            'size': self._get_page_size(request),
            'from': (page - 1) * page_size
        })
        req.args['repos'] = 'planning'
        req.page = page
        req.max_results = page_size
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _get_whitelist(self, repo):
        if repo == 'events':
            return EVENT_PARAMS
        elif repo == 'planning':
            return PLANNING_PARAMS
        else:
            return COMBINED_PARAMS

    def _check_for_unknown_params(self, params: MultiDict, whitelist: List[str]):
        """Check if the request contains only allowed parameters.

        :param request: object representing the HTTP request
        :param whitelist: iterable containing the names of allowed parameters.
        """

        for param_name in params.keys():
            if param_name not in whitelist:
                raise SuperdeskApiError.badRequestError(message="Unexpected parameter ({})".format(param_name))

            if len(params.getlist(param_name)) > 1:
                desc = "Multiple values received for parameter ({})"
                raise SuperdeskApiError.badRequestError(message=desc.format(param_name))

    def _get_sort(self):
        """Get the sort"""
        return {
            '_planning_schedule.scheduled': {
                'order': 'asc',
                'nested': {
                    'path': '_planning_schedule'
                }
            }
        }

    def _get_page_size(self, request):
        """Get the page size"""
        return request.max_results if request.max_results else self.default_page_size


class EventsPlanningResource(Resource):
    resource_methods = ['GET']
    item_methods = []
    endpoint_name = 'events_planning_search'

    schema = deepcopy(planning_schema)
    schema.update(events_schema)
