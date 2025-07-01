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
from planning.output_formatters.ninjs3_utils import DatesObject, RecurrenceObject

from ..types import PlanningCAPIParams, ContentAPIEventResource
from ..resources import ContentAPIEventService

event_endpoints = EndpointGroup("events_capi", __name__)


class ContentAPIEventResponse(ContentAPIEventResource):
    dates: DatesObject


class EventParams(PlanningCAPIParams):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        return SearchItemType.EVENT


BASE_EXCLUDE_FIELDS: set[str] = {
    "_created",
    "created",
    "_updated",
    "updated",
    "_etag",
    "etag",
    "_type",
    "type",
    "subscribers",
    "_planning_schedule",
    "planning_schedule",
}


def _convert_capi_event_to_response_instance(item: ContentAPIEventResource) -> dict:
    exclude_fields = BASE_EXCLUDE_FIELDS.copy()
    if item.model_extra:
        exclude_fields.update(item.model_extra.keys())

    print("Exclude fields: ", exclude_fields)

    print(item)
    item_response = item.to_dict(
        exclude_none=True,
        exclude_unset=False,
        exclude_defaults=False,
        exclude=exclude_fields,
    )
    from superdesk.core import json

    print(json.dumps(item_response, indent=4))

    if "dates" not in exclude_fields and item.dates:
        dates = DatesObject()
        dates.startDate = item.dates.start
        dates.endDate = item.dates.end
        dates.timezone = item.dates.tz

        if item.dates.end and item.dates.no_end_time:
            dates.endDate = None
            dates.expectedEndDate = item.dates.end.strftime("%Y-%m-%d")

        recurring_rule = item.dates.recurring_rule
        if item.dates.recurring_rule:
            dates.recurrence = RecurrenceObject.from_dict(
                {
                    "recurrenceRules": [
                        {
                            key: getattr(recurring_rule, key)
                            for key in ("frequency", "interval", "until", "count")
                            if getattr(recurring_rule, key)
                        }
                    ]
                }
            )
        item_response["dates"] = dates.to_dict(exclude_none=True)

    return item_response


@event_endpoints.endpoint("events", methods=["GET"])
async def get_event_list(args: None, params: EventParams, request: Request) -> Response:
    service = ContentAPIEventService()
    search_request = params.to_search_request(request)
    cursor = await service.find(req=search_request)

    return Response(
        {
            "_items": [_convert_capi_event_to_response_instance(item) async for item in cursor],
            "_meta": {
                "page": search_request.page,
                "max_results": search_request.max_results,
                "total": await cursor.count(),
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

    return Response(_convert_capi_event_to_response_instance(item))
