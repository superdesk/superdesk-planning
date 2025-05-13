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
from .planning import content_api_planning_resource_config, ContentAPIPlanningService
from planning.content_api.utils import ALLOWED_PARAMS, APIListParams


planning_endpoints = EndpointGroup("planning_capi", __name__)


@planning_endpoints.endpoint("planning", methods=["GET"])
async def get_planning_list(args, params: APIListParams, request: Request) -> Response:
    service = ContentAPIPlanningService()
    req = ParsedRequest()
    req.args = MultiDict(
        {param: getattr(params, param, None) for param in ALLOWED_PARAMS if getattr(params, param, None) is not None}
    )
    lookup = {"subscribers": g.get("user")}
    result = await service.get(req, lookup)
    return Response(result)


@planning_endpoints.endpoint("planning/<string:item_id>", methods=["GET"])
async def get_planning_item(args, params, request: Request) -> Response:
    service = ContentAPIPlanningService()
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
    "planning.content_api.planning", resources=[content_api_planning_resource_config], endpoints=[planning_endpoints]
)
