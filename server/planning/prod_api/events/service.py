# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import json
from typing import Dict, Iterable, List

from elasticsearch.exceptions import RequestError
from eve.utils import config
from superdesk.errors import SuperdeskApiError
from flask import has_request_context, request
from werkzeug.datastructures import MultiDict

from superdesk import get_resource_service
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


class EventsService(ProdApiService):
    excluded_fields = ProdApiService.excluded_fields | excluded_lock_fields

    def _include_assignment_links(self) -> bool:
        if not has_request_context():
            return True

        return not str_to_bool(request.args.get("exclude_assignments"), default=False)

    def get(self, req, lookup):
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
                no_results_query = {"query": {"match_none": {}}}
                req.args["source"] = json.dumps(no_results_query)

        return super().get(req, lookup)

    def _extract_planning_source(self, req) -> Dict | None:
        if not getattr(req, "args", None):
            return None

        raw_planning_source = req.args.get("planning_source")
        if not raw_planning_source:
            return None

        planning_query = self._parse_planning_source(raw_planning_source)
        return planning_query

    def _parse_planning_source(self, raw_planning_source) -> Dict:
        try:
            query = json.loads(raw_planning_source) if isinstance(raw_planning_source, str) else raw_planning_source
        except (TypeError, ValueError):
            raise SuperdeskApiError.badRequestError("Invalid planning_source parameter")

        if not isinstance(query, dict):
            raise SuperdeskApiError.badRequestError("planning_source must be an object")

        query.setdefault("_source", ["_id", "_resource", "event_item"])

        return query

    def _get_event_ids_from_planning(self, planning_query: Dict) -> List[str]:
        # Query planning documents using the planning service
        planning_service = get_resource_service("planning")

        # Search for planning documents matching the query
        try:
            results = planning_service.get_all_batch_elastic(planning_query)
            event_ids = {event_id for event_id in self._extract_event_items(results) if event_id}
            return list(event_ids)
        except RequestError as e:
            raise SuperdeskApiError.badRequestError(
                f"Invalid planning_source query: {str(e.info.get('error', {}).get('reason', str(e)))}"
            )

    def _extract_event_items(self, results: Iterable[Dict]) -> Iterable[str]:
        for item in results:
            if item.get("event_item"):
                yield item["event_item"]

    def _process_fetched_object(self, doc):
        super()._process_fetched_object(doc)

        planning_service = get_resource_service("planning")
        plannings = list(planning_service.find(where={"event_item": doc.get("guid")}))

        if len(plannings):
            assignment_ids = []
            for plan in plannings:
                assignment_ids.extend(get_assignment_ids_from_planning(plan))

            if doc.get(config.LINKS):
                doc[config.LINKS]["plannings"] = [
                    construct_planning_link(
                        item[config.ID_FIELD],
                        coverages=extract_coverage_summaries(item.get("coverages") or []),
                    )
                    for item in plannings
                ]

                if len(assignment_ids) and self._include_assignment_links():
                    doc[config.LINKS]["assignments"] = construct_assignment_links(assignment_ids)


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
