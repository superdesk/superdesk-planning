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
from superdesk.core.resources.service import AsyncResourceService

from content_api import MONGO_PREFIX, ELASTIC_PREFIX
from planning.output_formatters import JsonPlanningFormatter
from planning.content_api.types.planning import ContentAPIPlanningResource


class ContentAPIPlanningService(AsyncResourceService[ContentAPIPlanningResource]):
    """Service for publishing planning items to the content API"""

    formatter = JsonPlanningFormatter()

    async def publish_async(self, item, subscribers=None) -> None:
        """
        Uses the `JsonPlanningFormatter` to format the planning item and publish it to the content API.
        If the planning item already exists, it will be updated, otherwise it will be created.
        """

        formatted_item = await self.formatter._format_item(item)
        planning_id = item.get("_id")
        original = await self.find_by_id(planning_id)

        if original:
            await self.update(planning_id, formatted_item)
        else:
            await self.create([formatted_item])


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
