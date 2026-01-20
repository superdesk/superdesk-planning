# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Annotated

from bson import ObjectId
from pydantic import computed_field, Field
from pydantic.json_schema import SkipJsonSchema

from superdesk.core.resources import fields
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response

from planning.types import SearchItemType

from ..types import (
    PlanningCAPIParams,
    GetItemArgs,
    ContentAPIPlanningResource,
    ContentAPICoverageResource,
    ContentAPICoveragePlanning,
)
from ..resources import ContentAPIPlanningService
from ..utils import convert_cursor_to_response_items, convert_capi_item_to_response_instance


planning_endpoints = EndpointGroup("planning_capi", __name__)


class ContentAPICoveragePlanningResponse(ContentAPICoveragePlanning):
    scheduled: fields.DateWithOptionalTime | None = None


class ContentAPICoverageResponse(ContentAPICoverageResource):
    planning: ContentAPICoveragePlanningResponse | None = None
    time_to_be_confirmed: SkipJsonSchema[bool] = False


class ContentAPIPlanningResponse(ContentAPIPlanningResource):
    coverages: Annotated[list[ContentAPICoverageResponse], fields.nested_list(), Field(default_factory=list)]


class PlanningParams(PlanningCAPIParams):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        return SearchItemType.PLANNING


@planning_endpoints.endpoint(
    "planning",
    methods=["GET"],
    tags=["Planning"],
    summary="List all planning items",
    description="Returns a list of planning items with optional filtering",
    responses={
        "200": {
            "description": "A list of planning items",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "_items": {
                                "type": "array",
                                "items": {"$ref": "#/components/schemas/ContentAPIPlanningResponse"},
                            },
                            "_meta": {
                                "type": "object",
                                "properties": {
                                    "page": {"type": "integer"},
                                    "max_results": {"type": "integer"},
                                    "total": {"type": "integer"},
                                },
                            },
                        },
                    },
                },
            },
        },
    },
)
async def get_planning_list(args, params: PlanningParams, request: Request) -> Response:
    service = ContentAPIPlanningService()
    search_request = params.to_search_request(request)
    cursor = await service.find(req=search_request)

    return Response(
        {
            "_items": await convert_cursor_to_response_items(cursor, params),
            "_meta": {
                "page": search_request.page,
                "max_results": search_request.max_results,
                "total": await cursor.count(),
            },
        }
    )


@planning_endpoints.endpoint(
    "planning/<string:item_id>",
    methods=["GET"],
    tags=["Planning"],
    summary="Get a specific planning item",
    description="Returns the planning item with the specified ID",
    responses={
        "200": {
            "description": "The requested planning item",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ContentAPIPlanningResponse"},
                },
            },
        },
    },
)
async def get_planning_item(args: GetItemArgs, params: None, request: Request) -> Response:
    service = ContentAPIPlanningService()

    if not args.item_id:
        return await request.abort(404)

    item = await service.find_by_id(args.item_id)
    token_id = request.storage.request.get("user")
    if not item or ObjectId(token_id) not in item.subscribers:
        return await request.abort(404)

    return Response(await convert_capi_item_to_response_instance(item))
