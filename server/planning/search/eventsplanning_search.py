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
from typing import List, Dict, Any, Optional
from copy import deepcopy

from werkzeug.datastructures import MultiDict, ImmutableMultiDict
from eve.utils import ParsedRequest
from flask import current_app as app

from superdesk import Resource, Service, get_resource_service
from superdesk.resource import build_custom_hateoas
from superdesk.errors import SuperdeskApiError

from planning.planning.planning import planning_schema
from planning.events.events_schema import events_schema

from .queries.planning import PLANNING_PARAMS, PLANNING_SEARCH_FILTERS
from .queries.events import EVENT_PARAMS, EVENT_SEARCH_FILTERS
from .queries.combined import COMBINED_PARAMS, COMBINED_SEARCH_FILTERS, construct_combined_view_data_query
from .queries.common import construct_search_query


logger = logging.getLogger(__name__)


class EventsPlanningService(Service):
    default_page_size = 100

    def get(self, req, lookup):
        """Retrieve a list of events and planning that match the filter criteria (if any) passed along the HTTP request.

        :param req: object representing the HTTP request
        :type req: `eve.utils.ParsedRequest`
        :param dict lookup: sub-resource lookup from the endpoint URL

        :return: database results cursor object
        :rtype: `pymongo.cursor.Cursor`
        """

        params = req.args or MultiDict()

        if isinstance(params, ImmutableMultiDict):
            params = params.copy()

        repo = params.get('repo', 'combined')
        search_filter = self._get_search_filter(repo, params)
        self._check_for_unknown_params(params, search_filter, self._get_whitelist(repo))
        query = self._construct_search_query(repo, params, search_filter)

        if repo == 'events' or repo == 'event':
            return self._search_events(req, params, query, search_filter)
        elif repo == 'planning':
            return self._search_planning(req, params, query, search_filter)
        else:
            items = self._get_events_and_planning(req, query, search_filter)
            return self._get_combined_view_data(items, req, params, search_filter)

    def on_fetched(self, doc):
        """
        Overriding to set HATEOAS to specific resource endpoint for each individual item in the response.

        :param doc: response doc
        :type doc: dict
        """

        docs = doc[app.config['ITEMS']]
        for item in docs:
            build_custom_hateoas(
                {
                    'self': {
                        'title': item['_type'],
                        'href': '/{}/{{_id}}'.format(item['_type'])
                    }
                },
                item
            )

    def _get_search_filter(self, repo: str, params: Dict[str, Any]):
        filter_id = params.get('filter_id')
        if not filter_id or filter_id == 'ALL_EVENTS_PLANNING':
            return {'params': {}}

        search_filter = get_resource_service('events_planning_filters').find_one(req=None, _id=filter_id)
        if not search_filter:
            logger.warning(f'Event filter {filter_id} not found')
            return {'params': {}}

        item_type = search_filter.get('item_type', 'combined')
        if item_type != repo:
            logger.warning(f'Incorrect filter type supplied ({item_type})')
            return {'params': {}}
        elif not len(search_filter.get('params') or {}):
            logger.warning(f'Search filter {filter_id} has no params')
            return {'params': {}}

        return search_filter

    def _construct_search_query(
        self,
        repo: str,
        params: Dict[str, Any],
        search_filter: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:

        if repo == 'events':
            filters = EVENT_SEARCH_FILTERS
        elif repo == 'planning':
            filters = PLANNING_SEARCH_FILTERS
        else:
            filters = COMBINED_SEARCH_FILTERS

        return construct_search_query(
            filters,
            params,
            search_filter
        )

    def _get_combined_view_data(self, items, request, params, search_filter):
        """Get list of event and planning for the combined view

        :param items:
        :param request: object representing the HTTP request
        """
        query = construct_combined_view_data_query(params, search_filter, items)
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': self._get_sort(),
            'size': page_size,
            'from': (page - 1) * page_size
        })
        req.page = request.page or 1
        req.max_results = page_size
        if params.get('projections'):
            req.args['projections'] = params['projections']
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _get_events_and_planning(self, request, query, search_filter):
        """Get list of event and planning based on the search criteria

        :param request: object representing the HTTP request
        """
        # params = request.args or MultiDict()
        # query = construct_combined_search_query(params)
        page = request.page or 1
        max_results = self._get_page_size(request, search_filter)
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

    def _search_events(self, request, params, query, search_filter):
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': query['sort'] if query.get('sort') else {'dates.start': {'order': 'asc'}},
            'size': page_size,
            'from': (page - 1) * page_size
        })
        req.args['repos'] = 'events'
        req.page = page
        req.max_results = page_size
        if params.get('projections'):
            req.args['projections'] = params['projections']
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _search_planning(self, request, params, query, search_filter):
        # params = request.args or MultiDict()
        # query = construct_planning_search_query(params)
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['source'] = json.dumps({
            'query': query['query'],
            'sort': query['sort'] if query.get('sort') else self._get_sort(),
            'size': page_size,
            'from': (page - 1) * page_size
        })
        req.args['repos'] = 'planning'
        req.page = page
        req.max_results = page_size
        if params.get('projections'):
            req.args['projections'] = params['projections']
        return get_resource_service('planning_search').get(req=req, lookup=None)

    def _get_whitelist(self, repo):
        if repo == 'events':
            return EVENT_PARAMS
        elif repo == 'planning':
            return PLANNING_PARAMS
        else:
            return COMBINED_PARAMS

    def _check_for_unknown_params(self, params: MultiDict, search_filter: Dict[str, Any], whitelist: List[str]):
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

        # Silently remove parameters from the search filter that are not in the whitelist
        search_filter_id = search_filter.get('_id')
        for param_name in list(search_filter['params'].keys()):
            if param_name not in whitelist:
                logger.warning(f'Search filter {search_filter_id} contains unsupported param {param_name}')
                search_filter['params'].pop(param_name, None)

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

    def _get_page_size(self, request, search_filter):
        """Get the page size"""

        if search_filter['params'].get('max_results'):
            return search_filter['params']['max_results']
        elif request.max_results:
            return request.max_results
        else:
            return self.default_page_size

    # Helper methods for use with other internal services or commands
    def search_repos(self, repo, args, page=1, page_size=None, projections=None):
        req = ParsedRequest()
        req.args = MultiDict()
        req.args['repo'] = repo
        req.args.update(args)

        if projections is not None:
            req.args['projections'] = json.dumps(projections)

        req.page = page
        req.max_results = page_size or self.default_page_size
        return self.get(req=req, lookup=None)

    def search_by_filter_id(self, filter_id, args=None, page=1, page_size=None, projections=None):
        search_filter = get_resource_service('events_planning_filters').find_one(req=None, _id=filter_id)

        if not search_filter:
            raise SuperdeskApiError.notFoundError('EventPlanning Filter {} not found'.format(filter_id))

        if args is None:
            args = {}

        args['filter_id'] = filter_id

        return self.search_repos(
            search_filter['item_type'],
            args,
            page,
            page_size,
            projections
        )


class EventsPlanningResource(Resource):
    resource_methods = ['GET']
    item_methods = []
    endpoint_name = 'events_planning_search'

    schema = deepcopy(planning_schema)
    schema.update(events_schema)
