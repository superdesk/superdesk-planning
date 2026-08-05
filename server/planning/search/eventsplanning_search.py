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
from typing import List, Dict, Any, Optional
from copy import deepcopy

from werkzeug.datastructures import MultiDict, ImmutableMultiDict
from eve.utils import ParsedRequest

from quart_babel import gettext as _

from superdesk import Resource, get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.resource import build_custom_hateoas
from superdesk.resource_fields import ITEMS
from superdesk.errors import SuperdeskApiError

from planning.events.events_schema import events_schema
from planning.planning.planning_schema import planning_schema
from planning.search.eventsplanning_filters_service import EventsPlanningFiltersAsyncService

from .queries.planning import PLANNING_PARAMS, PLANNING_SEARCH_FILTERS
from .queries.events import EVENT_PARAMS, EVENT_SEARCH_FILTERS
from .queries.combined import COMBINED_PARAMS, COMBINED_SEARCH_FILTERS
from .queries.common import construct_search_query
from .queries.assignments import ASSIGNMENTS_PARAMS, ASSIGNMENTS_SEARCH_FILTERS
from .queries.elastic import ElasticQuery, field_exists


logger = logging.getLogger(__name__)


class EventsPlanningService(AsyncBaseService):
    default_page_size = 100

    def _get_sort(self):
        """Get the sort"""
        return {
            "_planning_schedule.scheduled": {
                "order": "asc",
                "nested": {"path": "_planning_schedule"},
            }
        }

    def _get_page_size(self, request, search_filter):
        """Get the page size"""

        if search_filter["params"].get("max_results"):
            return search_filter["params"]["max_results"]
        elif request.max_results:
            return request.max_results
        else:
            return self.default_page_size

    async def _construct_search_query(
        self, repo: str, params: Dict[str, Any], search_filter: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        if repo == "events":
            filters = EVENT_SEARCH_FILTERS
        elif repo == "planning":
            filters = PLANNING_SEARCH_FILTERS
        elif repo == "assignments":
            filters = ASSIGNMENTS_SEARCH_FILTERS
        else:
            filters = COMBINED_SEARCH_FILTERS

        return await construct_search_query(repo, filters, params, search_filter)

    def _get_whitelist(self, repo):
        if repo == "events":
            return EVENT_PARAMS
        elif repo == "planning":
            return PLANNING_PARAMS
        elif repo == "assignments":
            return ASSIGNMENTS_PARAMS
        else:
            return COMBINED_PARAMS

    def _check_for_unknown_params(self, params: MultiDict, search_filter: Dict[str, Any], whitelist: List[str]):
        """Check if the request contains only allowed parameters.

        :param request: object representing the HTTP request
        :param whitelist: iterable containing the names of allowed parameters.
        """

        for param_name in params.keys():
            if param_name not in whitelist:
                raise SuperdeskApiError.badRequestError(message=_("Unexpected parameter ({})").format(param_name))

            if len(params.getlist(param_name)) > 1:
                desc = "Multiple values received for parameter ({})"
                raise SuperdeskApiError.badRequestError(message=desc.format(param_name))

        # Silently remove parameters from the search filter that are not in the whitelist
        search_filter_id = search_filter.get("_id")
        for param_name in list(search_filter["params"].keys()):
            if param_name not in whitelist:
                logger.warning(f"Search filter {search_filter_id} contains unsupported param {param_name}")
                search_filter["params"].pop(param_name, None)

    async def _get_search_filter(self, repo: str, params: Dict[str, Any]):
        filter_id = params.get("filter_id")
        if not filter_id or filter_id == "ALL_EVENTS_PLANNING":
            return {"params": {}}

        search_filter = await EventsPlanningFiltersAsyncService().find_by_id_raw(filter_id)

        if not search_filter:
            logger.warning(f"Event filter {filter_id} not found")
            return {"params": {}}

        item_type = search_filter.get("item_type", "combined")
        if item_type != repo:
            logger.warning(f"Incorrect filter type supplied ({item_type})")
            return {"params": {}}
        elif not len(search_filter.get("params") or {}):
            logger.warning(f"Search filter {filter_id} has no params")
            return {"params": {}}

        return search_filter

    async def _search_events(self, request, params, query, search_filter):
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args["source"] = json.dumps(
            {
                "query": query["query"],
                "sort": query["sort"] if query.get("sort") else {"dates.start": {"order": "asc"}},
                "size": page_size,
                "from": (page - 1) * page_size,
            }
        )
        req.args["repo"] = "events"
        req.page = page
        req.max_results = page_size
        if params.get("projections"):
            req.args["projections"] = params["projections"]
        return await get_resource_service("planning_search").get_async(req=req, lookup=None)

    async def _search_planning(self, request, params, query, search_filter):
        # params = request.args or MultiDict()
        # query = construct_planning_search_query(params)
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args["source"] = json.dumps(
            {
                "query": query["query"],
                "sort": query["sort"] if query.get("sort") else self._get_sort(),
                "size": page_size,
                "from": (page - 1) * page_size,
            }
        )
        req.args["repo"] = "planning"
        req.page = page
        req.max_results = page_size
        if params.get("projections"):
            req.args["projections"] = params["projections"]
        return await get_resource_service("planning_search").get_async(req=req, lookup=None)

    async def _search_assignments(self, request, params, query, search_filter):
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args["source"] = json.dumps(
            {
                "query": query["query"],
                "sort": query["sort"] if query.get("sort") else {"planning.scheduled": {"order": "asc"}},
                "size": page_size,
                "from": (page - 1) * page_size,
            }
        )
        req.args["repo"] = "assignments"
        req.page = page
        req.max_results = page_size
        if params.get("projections"):
            req.args["projections"] = params["projections"]

        return await get_resource_service("planning_search").get_async(req=req, lookup=None)

    async def _get_events_and_planning(self, request, params, query, search_filter):
        """Get list of event and planning based on the search criteria

        :param request: object representing the HTTP request
        """

        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        req = ParsedRequest()
        req.args = MultiDict()
        req.args["source"] = json.dumps(
            {
                "query": query["query"],
                "sort": query["sort"] if query.get("sort") else self._get_sort(),
                "size": page_size,
                "from": (page - 1) * page_size,
            }
        )
        req.page = page
        req.max_results = page_size
        if params.get("projections"):
            req.args["projections"] = params["projections"]
        return await get_resource_service("planning_search").get_async(req=req, lookup=None)

    async def get_async(self, req, lookup):
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

        repo = params.get("repo", "combined")
        search_filter = await self._get_search_filter(repo, params)
        self._check_for_unknown_params(params, search_filter, self._get_whitelist(repo))
        query = await self._construct_search_query(repo, params, search_filter)

        if repo == "events" or repo == "event":
            return await self._search_events(req, params, query, search_filter)
        elif repo == "planning":
            return await self._search_planning(req, params, query, search_filter)
        elif repo == "assignments":
            return await self._search_assignments(req, params, query, search_filter)
        else:
            return await self._get_events_and_planning(req, params, query, search_filter)

    async def on_fetched_async(self, doc):
        """
        Overriding to set HATEOAS to specific resource endpoint for each individual item in the response.

        :param doc: response doc
        :type doc: dict
        """

        docs = doc[ITEMS]
        for item in docs:
            build_custom_hateoas(
                {
                    "self": {
                        "title": item["_type"],
                        "href": "/{}/{{_id}}".format(item["_type"]),
                    }
                },
                item,
            )

    # Helper methods for use with other internal services or commands
    async def search_repos(self, repo, args, page=1, page_size=None, projections=None):
        req = ParsedRequest()
        req.args = MultiDict()
        req.args["repo"] = repo
        req.args.update(args)

        if projections is not None:
            req.args["projections"] = json.dumps(projections)

        req.page = page
        req.max_results = page_size or self.default_page_size
        return await self.get_async(req=req, lookup=None)

    async def search_raw(self, repo, query, sort=None, page=1, page_size=None, projections=None):
        """Send raw elasticsearch query to `planning_search` service

        :param repo: Comma separated list of repos to search, defaults to ``events,planning``
        :param query: Elasticsearch query to send
        :param sort: Elasticsearch sort param, defaults to use the event/planning schedule
        :param page: The page to retrieve, defaults to ``1``
        :param page_size: The page size to use, defaults to ``100``
        :param projections: List of fields to retrieve, default to return all fields
        :rtype `eve_elastic.elastic.ElasticCursor`
        :return: A cursor containing the list of items from the Elasticsearch query
        """

        page = page or 1
        page_size = page_size or self.default_page_size

        req = ParsedRequest()
        req.args = MultiDict()

        if repo is not None:
            req.args["repo"] = repo

        req.args["source"] = json.dumps(
            {
                "query": query,
                "sort": sort or self._get_sort(),
                "size": page_size,
                "from": (page - 1) * page_size,
            }
        )
        req.page = page
        req.max_results = page_size
        if projections is not None:
            req.args["projections"] = json.dumps(projections)

        return await get_resource_service("planning_search").get_async(req=req, lookup=None)

    async def search_by_filter_id(self, filter_id, args=None, page=1, page_size=None, projections=None):
        search_filter = await EventsPlanningFiltersAsyncService().find_by_id_raw(filter_id)

        if not search_filter:
            raise SuperdeskApiError.notFoundError(_("EventPlanning Filter {} not found").format(filter_id))

        if args is None:
            args = {}

        args["filter_id"] = filter_id

        return await self.search_repos(search_filter["item_type"], args, page, page_size, projections)

    # TODO-ASYNC[EventsPlanningSearch] - Convert `get_locked_items` to async when adding support for search param async callbacks
    def get_locked_items(self, repo=None, page=None, page_size=None, projections=None):
        """Return the list of locked items in the provided ``repo``

        :param repo: Comma separated list of repos to search, defaults to ``events,planning``
        :param page: The page to retrieve, defaults to ``1``
        :param page_size: The page size to use, defaults to ``1000``
        :param projections: List of fields to retrieve, default to return all fields
        :rtype `eve_elastic.elastic.ElasticCursor`
        :return: A cursor containing the list of locked items in the provided ``repo``
        """

        query = ElasticQuery()
        query.must.append(field_exists("lock_session"))
        return self.search_raw(
            repo=repo,
            query=query.build(),
            page=page or 1,
            page_size=page_size or 1000,
            sort={
                "_planning_schedule.scheduled": {
                    "order": "desc",
                    "nested": {"path": "_planning_schedule"},
                }
            },
            projections=projections,
        )


class EventsPlanningResource(Resource):
    resource_methods = ["GET"]
    item_methods = []
    endpoint_name = "events_planning_search"

    allow_unknown = True
