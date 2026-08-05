# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Search."""
import logging
from eve_elastic.elastic import parse_date, get_dates, fix_query
from copy import deepcopy
from typing import Any, Dict

import superdesk
from superdesk.core import json, get_current_app, get_app_config
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.resource_fields import ITEMS
from superdesk.metadata.utils import item_url

from planning.events.events_schema import events_schema
from planning.planning.planning_schema import planning_schema
from planning.types import EventResourceModel, PlanningResourceModel, AssignmentResourceModel

logger = logging.getLogger(__name__)


class PlanningSearchService(AsyncBaseService):
    repos = ["events", "planning", "assignments"]

    @property
    def elastic(self):
        return get_current_app().data.elastic

    @property
    def elastic_async(self):
        return get_current_app().data.elastic_async

    def _get_query(self, req):
        """Get elastic query."""
        args = getattr(req, "args", {})
        query = json.loads(args.get("source", {})) if args.get("source") else {"query": {"filtered": {}}}
        return query

    def _get_types(self, req):
        """Get document types for the given query."""
        args = getattr(req, "args", {})
        repos = args.get("repo")

        if repos is None:
            return ["events", "planning"]
        else:
            repos = [repo for repo in repos.split(",") if repo in self.repos]
            if len(repos) > 1 and "assignments" in repos:
                raise SuperdeskApiError.badRequestError(
                    "Cannot search for Assignments and Event/Planning at the same time"
                )
            return repos

    def _get_projected_fields(self, req):
        """Get elastic projected fields."""
        app = get_current_app()
        if app.data.elastic.should_project(req):
            return app.data.elastic.get_projected_fields(req)

    def _get_index(self, repos):
        """Get index id for all repos."""
        app = get_current_app()
        indexes = {app.data.elastic.index}
        for repo in repos:
            indexes.add(app.config["ELASTICSEARCH_INDEXES"].get(repo, app.data.elastic.index))
        return ",".join(indexes)

    def _get_date_fields(self, resource: str):
        datasource = self.elastic.get_datasource(resource)
        schema: Dict[str, Any] = {}
        schema.update(get_app_config("DOMAIN")[datasource[0]].get("schema", {}))
        schema.update(get_app_config("DOMAIN")[resource].get("schema", {}))
        return get_dates(schema)

    async def _format_docs(self, cursor):
        date_fields = {}

        async for doc in cursor:
            resource = self._get_item_resource_type(doc)

            if not date_fields.get(resource):
                date_fields[resource] = self._get_date_fields(resource)

            # Format root level date types
            for field in date_fields[resource]:
                if isinstance(doc.get(field), str):
                    doc[field] = parse_date(doc[field])

            # Format nested date types
            if resource == "events" and doc.get("dates"):
                if doc["dates"].get("start"):
                    doc["dates"]["start"] = parse_date(doc["dates"]["start"])
                if doc["dates"].get("end"):
                    doc["dates"]["end"] = parse_date(doc["dates"]["end"])
                if (doc["dates"].get("recurring_rule") or {}).get("until"):
                    doc["dates"]["recurring_rule"]["until"] = parse_date(doc["dates"]["recurring_rule"]["until"])

    def get_indexes_for_search(self, repos: list[str]) -> list[str]:
        indexes: list[str] = []
        if "events" in repos:
            indexes.append(EventResourceModel.get_service().elastic.config.index)
        if "planning" in repos:
            indexes.append(PlanningResourceModel.get_service().elastic.config.index)
        if "assignments" in repos:
            indexes.append(AssignmentResourceModel.get_service().elastic.config.index)
        return indexes

    def get_projection(self, req) -> list[str] | None:
        fields = self._get_projected_fields(req)
        projection = None if not fields else fields.split(",")

        if projection and "type" not in projection:
            # Make sure `type` is always included in the projection
            projection.append("type")

        return projection

    async def get_async(self, req, lookup):
        """Run the query against events and planning indexes"""
        query = self._get_query(req)
        types = self._get_types(req)
        fields = self._get_projected_fields(req)

        params = {}
        if fields:
            # If projections are provided, make sure `type` is always included
            if "type" not in fields:
                fields += ",type"

            params["_source"] = fields

        cursor = await self.elastic_async.search(query, types, params)

        await self._format_docs(cursor)

        # to avoid call on_fetched_resource callback from some internal resource
        on_fetched_resource = True
        try:
            on_fetched_resource = req.exec_on_fetched_resource
        except AttributeError:
            pass

        if on_fetched_resource:
            app = get_current_app().as_any()
            for resource in types:
                response = {
                    ITEMS: [
                        doc
                        async for doc in cursor
                        if self._get_item_resource_type(doc) == resource
                        # if doc["type"] == resource or (resource == "events" and doc["type"] == "event")
                    ]
                }
                await getattr(app, "on_fetched_resource").call_async(resource, response)
                await getattr(app, "on_fetched_resource_%s" % resource).call_async(response)

        return cursor

    def _get_item_resource_type(self, item: dict) -> str:
        resource = item["type"]
        if resource == "event":
            resource = "events"
        elif resource == "assignment":
            resource = "assignments"

        return resource


class PlanningSearchResource(superdesk.Resource):
    resource_methods = ["GET"]
    item_methods = []
    item_url = item_url
    endpoint_name = "planning_search"

    schema = deepcopy(planning_schema)
    schema.update(events_schema)
