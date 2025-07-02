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

from ..types import PlanningCAPIParams
from ..resources import ContentAPIPlanningService
from ..utils import convert_cursor_to_response_items, convert_capi_item_to_response_instance


planning_endpoints = EndpointGroup("planning_capi", __name__)


class PlanningParams(PlanningCAPIParams):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        return SearchItemType.PLANNING


@planning_endpoints.endpoint("planning", methods=["GET"])
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


@planning_endpoints.endpoint("planning/<string:item_id>", methods=["GET"])
async def get_planning_item(args, params, request: Request) -> Response:
    service = ContentAPIPlanningService()
    item_id = request.get_view_args("item_id")

    if not item_id:
        return await request.abort(404)

    item = await service.find_by_id(item_id)
    token_id = request.storage.request.get("user")
    if not item or ObjectId(token_id) not in item.subscribers:
        return await request.abort(404)

    return Response(convert_capi_item_to_response_instance(item))
