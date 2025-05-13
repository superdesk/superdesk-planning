# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Optional
from superdesk.flask import g
from pydantic import BaseModel
from eve.utils import ParsedRequest
from superdesk.core.module import Module
from superdesk.core.web import EndpointGroup
from werkzeug.datastructures import MultiDict
from superdesk.core.types import Request, Response
from .event import content_api_event_resource_config, ContentAPIEventService
from planning.content_api.utils import ALLOWED_PARAMS

event_endpoints = EndpointGroup("events_capi", __name__)


class EventListParams(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    include_fields: Optional[str] = None
    exclude_fields: Optional[str] = None
    max_results: Optional[str] = None
    page: Optional[str] = None
    where: Optional[str] = None
    q: Optional[str] = None
    default_operator: Optional[str] = None


@event_endpoints.endpoint("event", methods=["GET"])
async def get_event_list(args: None, params: EventListParams, request: Request) -> Response:
    service = ContentAPIEventService()
    req = ParsedRequest()
    req.args = MultiDict(
        {param: getattr(params, param) for param in ALLOWED_PARAMS if getattr(params, param) is not None}
    )
    lookup = {"subscribers": g.get("user")}

    result = await service.get(req, lookup)
    return Response(result)


@event_endpoints.endpoint("event/<string:item_id>", methods=["GET"])
async def get_event_item(args, params, request: Request) -> Response:
    service = ContentAPIEventService()
    req = ParsedRequest()
    req.args = MultiDict()

    item_id = request.get_view_args("item_id")
    if not item_id:
        return Response({"error": "Item ID is required"})

    lookup = {"_id": item_id, "subscribers": g.get("user")}

    item = await service.find_one(req, **lookup)
    if not item:
        return Response({"error": "Not found"})
    return Response(item)


module = Module(
    "planning.content_api.events", resources=[content_api_event_resource_config], endpoints=[event_endpoints]
)
