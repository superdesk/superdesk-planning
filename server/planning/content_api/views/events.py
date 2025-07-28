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
from datetime import datetime

from bson import ObjectId
from pydantic import computed_field, Field

from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response

from planning.types import SearchItemType, ninjs3

from ..types import PlanningCAPIParams, ContentAPIEventResource, GetItemArgs
from ..resources import ContentAPIEventService
from ..utils import convert_cursor_to_response_items, convert_capi_item_to_response_instance

event_endpoints = EndpointGroup("events_capi", __name__)


class ContentAPIEventResponse(ContentAPIEventResource):
    dates: ninjs3.DatesObject
    plans: Annotated[list[str], Field(description="List of Planning IDs that are linked to the Event")]


class EventParams(PlanningCAPIParams):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        return SearchItemType.EVENT


@event_endpoints.endpoint(
    "events",
    methods=["GET"],
    tags=["Events"],
    summary="List all events",
    description="Returns a list of events with optional filtering",
    responses={
        "200": {
            "description": "A list of events",
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "_items": {
                                "type": "array",
                                "items": {"$ref": "#/components/schemas/ContentAPIEventResponse"},
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
async def get_event_list(args: None, params: EventParams, request: Request) -> Response:
    service = ContentAPIEventService()
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


@event_endpoints.endpoint(
    "events/<string:item_id>",
    methods=["GET"],
    tags=["Events"],
    summary="Get a specific event",
    description="Returns the event with the specified ID",
    responses={
        "200": {
            "description": "The requested event",
            "content": {
                "application/json": {
                    "schema": {"$ref": "#/components/schemas/ContentAPIEventResponse"},
                },
            },
        },
    },
)
async def get_event_item(args: GetItemArgs, params: None, request: Request) -> Response:
    service = ContentAPIEventService()
    if not args.item_id:
        return await request.abort(404)

    item = await service.find_by_id(args.item_id)
    token_id = request.storage.request.get("user")
    if not item or ObjectId(token_id) not in item.subscribers:
        return await request.abort(404)

    return Response(await convert_capi_item_to_response_instance(item))
