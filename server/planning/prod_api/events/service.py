# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Iterable
import json

from elasticsearch.exceptions import RequestError
from werkzeug.datastructures import MultiDict
from quart import has_request_context, request
from eve.utils import ParsedRequest

from superdesk import get_resource_service
from superdesk.resource_fields import ID_FIELD, LINKS
from superdesk.errors import SuperdeskApiError
from superdesk.eve_async import AsyncEveCursor
from prod_api.service import ProdApiService

from planning.prod_api.common import excluded_lock_fields
from planning.prod_api.assignments.utils import (
    get_assignment_ids_from_planning,
    construct_assignment_links,
)
from planning.prod_api.planning.utils import (
    construct_planning_link,
    extract_coverage_summaries,
    str_to_bool,
)
from planning.utils import get_related_planning_for_events_async, get_related_event_ids_for_planning


class EventsService(ProdApiService):
    excluded_fields = ProdApiService.excluded_fields | excluded_lock_fields

    def _include_assignment_links(self) -> bool:
        if not has_request_context():
            return True

        return not str_to_bool(request.args.get("exclude_assignments"), default=False)

    async def get_async(self, req: ParsedRequest | None, lookup: dict | None) -> AsyncEveCursor:
        if req is None:
            req = ParsedRequest()

        planning_query = self._extract_planning_source(req)

        if planning_query is not None:
            event_ids = self._get_event_ids_from_planning(planning_query)
            req.args = req.args.copy() if hasattr(req.args, "copy") else MultiDict(req.args)

            # Build an elasticsearch query that filters by event_ids
            if event_ids:
                # Create an elasticsearch source query for event filtering
                event_query = {"query": {"terms": {"_id": event_ids}}}
                # Merge with any existing source query in req
                if "source" in req.args:
                    existing_source = json.loads(req.args["source"])
                    # Combine queries with AND (must clause)
                    combined_query = {
                        "query": {
                            "bool": {"must": [existing_source.get("query", existing_source), event_query["query"]]}
                        }
                    }
                    req.args["source"] = json.dumps(combined_query)
                else:
                    req.args["source"] = json.dumps(event_query)
            else:
                # No matching events, create a query that returns nothing
                no_results_query: dict = {"query": {"match_none": {}}}
                req.args["source"] = json.dumps(no_results_query)

        return await super().get_async(req, lookup)

    def _extract_planning_source(self, req: ParsedRequest) -> dict | None:
        if not getattr(req, "args", None):
            return None

        raw_planning_source = req.args.get("planning_source")
        if not raw_planning_source:
            return None

        planning_query = self._parse_planning_source(raw_planning_source)
        return planning_query

    def _parse_planning_source(self, raw_planning_source) -> dict:
        try:
            query = json.loads(raw_planning_source) if isinstance(raw_planning_source, str) else raw_planning_source
        except (TypeError, ValueError):
            raise SuperdeskApiError.badRequestError("Invalid planning_source parameter")

        if not isinstance(query, dict):
            raise SuperdeskApiError.badRequestError("planning_source must be an object")

        query.setdefault("sort", [{"_created": "asc"}, {"_updated": "asc"}, {"guid": "asc"}])
        query.setdefault("_source", ["_id", "_resource", "related_events"])

        return query

    def _get_event_ids_from_planning(self, planning_query: dict) -> list[str]:
        # Query planning documents using the planning service
        planning_service = get_resource_service("planning")

        # Search for planning documents matching the query
        try:
            # TODO-ASYNC: Create a ``get_all_batch_elastic_async`` async variant, and use it here
            results = planning_service.get_all_batch_elastic(planning_query)
            event_ids = {event_id for event_id in self._extract_event_items(results) if event_id}
            return list(event_ids)
        except RequestError as e:
            if isinstance(e.info, dict):
                try:
                    error_info = str(e.info["error"]["reason"])
                except (KeyError, TypeError, ValueError):
                    error_info = str(e)
            else:
                error_info = str(e)

            raise SuperdeskApiError.badRequestError(f"Invalid planning_source query: {error_info}")

    def _extract_event_items(self, results: Iterable[dict]) -> Iterable[str]:
        for item in results:
            yield from get_related_event_ids_for_planning(item, "primary")

    async def _process_fetched_object(self, doc):
        super()._process_fetched_object(doc)

        if not doc.get(LINKS):
            return

        plannings = await get_related_planning_for_events_async([doc[ID_FIELD]], "primary")
        if len(plannings):
            assignment_ids = []
            for plan in plannings:
                assignment_ids.extend(get_assignment_ids_from_planning(plan))

            doc[LINKS]["plannings"] = [
                construct_planning_link(
                    item[ID_FIELD],
                    coverages=extract_coverage_summaries(item.get("coverages") or []),
                )
                for item in plannings
            ]

            if len(assignment_ids) and self._include_assignment_links():
                doc[LINKS]["assignments"] = await construct_assignment_links(assignment_ids)


class EventsHistoryService(ProdApiService):
    excluded_fields = {
        "update._etag",
        "update._links",
        "update._status",
        "update._updated",
        "update._created",
    } | ProdApiService.excluded_fields


class EventsFilesService(ProdApiService):
    pass
