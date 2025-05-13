# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy
from bson import ObjectId
from superdesk.flask import g
from typing import Set, Optional
from bson.errors import InvalidId
from eve.utils import ParsedRequest
from werkzeug.datastructures import MultiDict
from superdesk.datalayer import InvalidSearchString
from content_api.errors import BadParameterValueError
from superdesk.core.resources import ResourceConfig, MongoResourceConfig, MongoIndexOptions, ElasticResourceConfig

from superdesk.core.resources.service import AsyncResourceService

from content_api import MONGO_PREFIX, ELASTIC_PREFIX
from planning.output_formatters import JsonEventFormatter
from planning.content_api.types.events import ContentAPIEventResource
from planning.content_api.utils import (
    ALLOWED_PARAMS,
    DEFAULT_SORT,
    check_for_unknown_params,
    set_fields_filter,
    set_default_sort,
    set_search_field,
)


class ContentAPIEventService(AsyncResourceService[ContentAPIEventResource]):
    """Service for publishing events to the content API"""

    formatter = JsonEventFormatter()

    async def publish_async(self, item, subscribers=None) -> None:
        """
        Uses the `JsonEventFormatter` to format the event and publish it to the content API.
        If the event already exists, it will be updated, otherwise it will be created.
        """

        formatted_item = await self.formatter._format_item(item)
        event_id = item.get("_id")
        original = await self.find_by_id(event_id)

        if original:
            await self.update(event_id, formatted_item)
        else:
            await self.create([formatted_item])

    async def find_one(self, req: Optional[ParsedRequest] = None, **lookup):
        if req is None:
            req = ParsedRequest()

        allowed_params = {"include_fields", "exclude_fields"}
        check_for_unknown_params(req, whitelist=allowed_params, allow_filtering=False)
        set_fields_filter(req)

        # Apply subscriber filter
        lookup["subscribers"] = g.get("user")

        item_id = lookup.pop("_id", None)
        if not item_id:
            return None

        try:
            object_id = ObjectId(item_id)
        except InvalidId:
            return None

        ids = [object_id]
        items = await super().find_by_ids(ids)
        if items:
            return items[0].dict()
        return None

    async def get(self, req: Optional[ParsedRequest] = None, lookup=None):
        if lookup is None:
            lookup = {}

        internal_req = ParsedRequest() if req is None else deepcopy(req)
        internal_req.args = MultiDict()
        orig_request_params = MultiDict(getattr(req, "args", {}))

        check_for_unknown_params(req, whitelist=ALLOWED_PARAMS)
        set_search_field(internal_req.args, orig_request_params)
        set_fields_filter(internal_req)

        # Apply subscriber filter
        user = g.get("user")
        if user and "_id" in user:
            lookup["subscribers"] = user["_id"]

        set_default_sort(internal_req, DEFAULT_SORT)
        try:
            items = []
            async for item in super().get_all(lookup):
                items.append(item.dict())
            return {"_items": items}
        except InvalidSearchString:
            raise BadParameterValueError("invalid search text")


content_api_event_resource_config: ResourceConfig = ResourceConfig(
    name="events_capi",
    data_class=ContentAPIEventResource,
    service=ContentAPIEventService,
    default_sort=[("versioncreated", -1)],
    versioning=False,
    mongo=MongoResourceConfig(
        prefix=MONGO_PREFIX,
        indexes=[
            MongoIndexOptions(
                name="recurrence_id_1",
                keys=[("recurrence_id", 1)],
                unique=False,
            ),
            MongoIndexOptions(name="state", keys=[("state", 1)], unique=False),
            MongoIndexOptions(name="dates_start_1", keys=[("dates.start", 1)], unique=False),
            MongoIndexOptions(name="dates_end_1", keys=[("dates.end", 1)], unique=False),
            MongoIndexOptions(name="template", keys=[("template", 1)], unique=False),
        ],
    ),
    elastic=ElasticResourceConfig(prefix=ELASTIC_PREFIX),
)
