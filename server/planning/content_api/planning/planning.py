# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.content_api.types.planning import ContentAPIPlanningResource
from content_api import MONGO_PREFIX, ELASTIC_PREFIX
from superdesk.core.resources.service import AsyncResourceService


class ContentAPIPlanningService(AsyncResourceService[ContentAPIPlanningResource]):
    async def publish_async(self, item, subscribers=None) -> None:
        planning_id = item.get("_id")
        original = await self.find_by_id(planning_id)

        if original:
            await self.update(planning_id, item)
        else:
            doc = ContentAPIPlanningResource.from_dict(item)
            await self.create([doc])


content_api_planning_resource_config: ResourceConfig = ResourceConfig(
    name="planning_capi",
    data_class=ContentAPIPlanningResource,
    service=ContentAPIPlanningService,
    mongo=MongoResourceConfig(
        prefix=MONGO_PREFIX,
        indexes=[
            MongoIndexOptions(
                name="planning_recurrence_id",
                keys=[("planning_recurrence_id", 1)],
                unique=False,
            ),
        ],
    ),
    elastic=ElasticResourceConfig(prefix=ELASTIC_PREFIX),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET"],
        item_methods=["GET"],
        enable_cors=True,
    ),
)
