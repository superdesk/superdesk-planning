# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from bson import ObjectId
from pydantic import computed_field

from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response

from planning.types import SearchItemType

from .event import ContentAPIEventService
from ..types import PlanningCAPIParams

event_endpoints = EndpointGroup("events_capi", __name__)


class EventParams(PlanningCAPIParams):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        return SearchItemType.EVENT


@event_endpoints.endpoint("events", methods=["GET"])
async def get_event_list(args: None, params: EventParams, request: Request) -> Response:
    service = ContentAPIEventService()
    search_request = params.to_search_request(request)
    items = await (await service.find(req=search_request)).to_list_raw()

    for item in items:
        item.pop("subscribers", None)

    return Response(
        {
            "_items": items,
            "_meta": {
                "page": search_request.page,
                "max_results": search_request.max_results,
                "total": len(items),
            },
        }
    )


@event_endpoints.endpoint("events/<string:item_id>", methods=["GET"])
async def get_event_item(args, params, request: Request) -> Response:
    service = ContentAPIEventService()
    item_id = request.get_view_args("item_id")

    if not item_id:
        return await request.abort(404)

    item = await service.find_by_id(item_id)
    token_id = request.storage.request.get("user")
    if not item or ObjectId(token_id) not in item.subscribers:
        return await request.abort(404)

    item_dict = item.to_dict(exclude_none=True, exclude_unset=False, exclude_defaults=False)
    item_dict.pop("subscribers", None)

    return Response(item_dict)
