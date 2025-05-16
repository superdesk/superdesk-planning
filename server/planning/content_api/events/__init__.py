# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.flask import g
from superdesk.core.web import EndpointGroup
from superdesk.core.types import SearchRequest
from superdesk.core.types import Request, Response
from .event import ContentAPIEventService
from planning.content_api.utils import PlanningCAPIParams

event_endpoints = EndpointGroup("events_capi", __name__)


@event_endpoints.endpoint("event", methods=["GET"])
async def get_event_list(args: None, params: PlanningCAPIParams, request: Request) -> Response:
    service = ContentAPIEventService()

    lookup = {}
    user = g.get("user")
    if user and "_id" in user:
        lookup["subscribers"] = user["_id"]

    search_request = params.to_search_request()
    if search_request.args is None:
        search_request.args = {}
    search_request.args.update(lookup)

    cursor = await service.find(req=search_request)
    items = [item.dict() async for item in cursor]
    return {"_items": items}


@event_endpoints.endpoint("event/<string:item_id>", methods=["GET"])
async def get_event_item(args, params, request: Request) -> Response:
    service = ContentAPIEventService()
    item_id = request.get_view_args("item_id")

    if not item_id:
        return Response({"error": "Item ID is required"}, status=400)

    items = await service.find_by_ids([item_id])
    if not items:
        return Response({"error": "Not found"}, status=404)

    return Response(items[0].dict())
