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

from werkzeug.datastructures import MultiDict, ImmutableMultiDict
from eve.utils import ParsedRequest

from quart_babel import gettext as _

from superdesk import Resource
from superdesk.core import get_current_app
from superdesk.core.types import SearchRequest
from superdesk.core.resources.cursor import DictCursorAsync
from superdesk.core.resources.utils import get_projection_arg
from superdesk.eve_async.service import AsyncBaseService
from superdesk.resource_fields import ITEMS, LINKS
from superdesk.errors import SuperdeskApiError

from planning.types.unified import UnifiedPlanningResource
from planning.search.eventsplanning_filters_service import EventsPlanningFiltersAsyncService
from planning.common import get_item_type_name, get_hateoas_links

from .queries.planning import PLANNING_PARAMS, PLANNING_SEARCH_FILTERS
from .queries.events import EVENT_PARAMS, EVENT_SEARCH_FILTERS
from .queries.combined import COMBINED_PARAMS, COMBINED_SEARCH_FILTERS
from .queries.common import construct_search_query
from .queries.assignments import ASSIGNMENTS_PARAMS, ASSIGNMENTS_SEARCH_FILTERS


logger = logging.getLogger(__name__)


class EventsPlanningService(AsyncBaseService):
    default_page_size = 100

    def _get_page_size(self, request: ParsedRequest, search_filter: dict) -> int:
        """Get the page size"""

        if search_filter["params"].get("max_results"):
            return search_filter["params"]["max_results"]
        elif request.max_results:
            return request.max_results
        else:
            return self.default_page_size

    async def _construct_search_query(self, repo: str, params: dict, search_filter: dict | None) -> dict:
        if repo == "events":
            filters = EVENT_SEARCH_FILTERS
        elif repo == "planning":
            filters = PLANNING_SEARCH_FILTERS
        elif repo == "assignments":
            filters = ASSIGNMENTS_SEARCH_FILTERS
        else:
            filters = COMBINED_SEARCH_FILTERS

        return await construct_search_query(repo, filters, params, search_filter)

    def _get_whitelist(self, repo: str) -> list[str]:
        if repo == "events":
            return EVENT_PARAMS
        elif repo == "planning":
            return PLANNING_PARAMS
        elif repo == "assignments":
            return ASSIGNMENTS_PARAMS
        else:
            return COMBINED_PARAMS

    def _check_for_unknown_params(self, params: MultiDict, search_filter: dict, whitelist: list[str]) -> None:
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

    async def _get_search_filter(self, repo: str, params: dict) -> dict:
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

    async def _search_assignments(self, request, params, query, search_filter):
        page = request.page or 1
        page_size = self._get_page_size(request, search_filter)
        query = {
            "query": query["query"],
            "sort": query["sort"] if query.get("sort") else {"planning.scheduled": {"order": "asc"}},
            "size": page_size,
            "from": (page - 1) * page_size,
        }

        app = get_current_app()
        fields: str | None = None
        if app.data.elastic.should_project(request):
            fields = app.data.elastic.get_projected_fields(request)

        params: dict = {}
        if fields:
            # If projections are provided, make sure `type` is always included
            if "type" not in fields:
                fields += ",type"

            params["_source"] = fields

        return await app.data.elastic_async.search(query, ["assignments"], params)

    async def _search_unified_planning(self, request: ParsedRequest, params: dict, query: dict, search_filter: dict):
        if not query.get("sort"):
            query["sort"] = {
                "_planning_schedule.scheduled": {
                    "order": "asc",
                    "nested": {"path": "_planning_schedule"},
                }
            }

        search_request = SearchRequest(
            where=query,
            page=request.page or 1,
            max_results=self._get_page_size(request, search_filter),
        )

        if params.get("projections"):
            projection_include, projection_fields = get_projection_arg(params["projections"])
            if projection_include is True:
                # This is an inclusion projection
                # Make sure minimum fields are included for UnifiedPlanningResource to be valid
                projection_fields.extend(["type", "dates"])
                search_request.projection = projection_fields
            elif projection_include is False:
                # This is an exclusion projection
                # Make sure we aren't excluding fields for UnifiedPlanningResource to be valid
                search_request.projection = {
                    field: False for field in projection_fields if field not in ("type", "dates")
                }

        return DictCursorAsync(await UnifiedPlanningResource.get_service().find(search_request))

    async def get_async(self, req: ParsedRequest | None, lookup: dict | None):
        """Retrieve a list of events and planning that match the filter criteria (if any) passed along the HTTP request.

        :param req: object representing the HTTP request
        :type req: `eve.utils.ParsedRequest`
        :param dict lookup: sub-resource lookup from the endpoint URL

        :return: database results cursor object
        :rtype: `pymongo.cursor.Cursor`
        """

        if not req:
            req = ParsedRequest()
        params = req.args or MultiDict()

        if isinstance(params, ImmutableMultiDict):
            params = params.copy()

        repo = params.get("repo", "combined")
        search_filter = await self._get_search_filter(repo, params)
        self._check_for_unknown_params(params, search_filter, self._get_whitelist(repo))
        query = await self._construct_search_query(repo, params, search_filter)

        if repo == "assignments":
            cursor = await self._search_assignments(req, params, query, search_filter)
        else:
            cursor = await self._search_unified_planning(req, params, query, search_filter)

        # to avoid call on_fetched_resource callback from some internal resource
        on_fetched_resource = True
        try:
            on_fetched_resource = req.exec_on_fetched_resource
        except AttributeError:
            pass

        if on_fetched_resource:
            app = get_current_app().as_any()
            types = ["assignment"] if repo == "assignments" else ["events", "planning"]
            for resource in types:
                response = {ITEMS: [doc async for doc in cursor if get_item_type_name(doc) == resource]}
                await getattr(app, "on_fetched_resource").call_async(resource, response)
                await getattr(app, f"on_fetched_resource_{resource}").call_async(response)

        return cursor

    async def on_fetched_async(self, doc):
        """
        Overriding to set HATEOAS to specific resource endpoint for each individual item in the response.

        :param doc: response doc
        :type doc: dict
        """

        docs = doc[ITEMS]
        for item in docs:
            item.setdefault(LINKS, {}).update(get_hateoas_links(item))

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

    async def search_by_filter_id(self, filter_id, args=None, page=1, page_size=None, projections=None):
        search_filter = await EventsPlanningFiltersAsyncService().find_by_id_raw(filter_id)

        if not search_filter:
            raise SuperdeskApiError.notFoundError(_("EventPlanning Filter {} not found").format(filter_id))

        if args is None:
            args = {}

        args["filter_id"] = filter_id

        return await self.search_repos(search_filter["item_type"], args, page, page_size, projections)


class EventsPlanningResource(Resource):
    resource_methods = ["GET"]
    item_methods = []
    endpoint_name = "events_planning_search"

    allow_unknown = True
