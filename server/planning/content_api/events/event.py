# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import json
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
from content_api import MONGO_PREFIX, ELASTIC_PREFIX
from planning.content_api.types.events import ContentAPIEventResource
from superdesk.core.resources.service import AsyncResourceService
from planning.content_api.utils import (
    check_for_unknown_params,
    set_fields_filter,
    set_default_sort,
    set_search_field,
)


class ContentAPIEventService(AsyncResourceService[ContentAPIEventResource]):
    allowed_params = {
        "start_date",
        "end_date",
        "include_fields",
        "exclude_fields",
        "max_results",
        "page",
        "where",
        "q",
        "default_operator",
    }

    default_sort = [("versioncreated", -1)]

    excluded_fields_from_response: Set[str] = {
        "_etag",
        "_created",
        "_updated",
        "subscribers",
        "_current_version",
        "_latest_version",
    }

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
        orig_request_params = getattr(req, "args", MultiDict())

        check_for_unknown_params(req, whitelist=self.allowed_params)
        set_search_field(internal_req.args, orig_request_params)
        set_fields_filter(internal_req)

        # Apply subscriber filter
        lookup["subscribers"] = g.get("user")
        set_default_sort(internal_req, self.default_sort)
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
