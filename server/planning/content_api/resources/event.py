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
    MongoResourceConfig,
    MongoIndexOptions,
    ElasticResourceConfig,
)
from superdesk.core.resources.service import AsyncResourceService

from content_api import MONGO_PREFIX, ELASTIC_PREFIX

from ..types import ContentAPIEventResource
from ..output_formatters import ContentApiEventFormatter


class ContentAPIEventService(AsyncResourceService[ContentAPIEventResource]):
    """Service for publishing events to the content API"""

    formatter = ContentApiEventFormatter()

    async def publish_async(self, item, subscribers=None) -> None:
        """
        Uses the `JsonEventFormatter` to format the event and publish it to the content API.
        If the event already exists, it will be updated, otherwise it will be created.
        """

        formatted_item = await self.formatter._format_item(item, subscribers)
        event_id = item.get("_id")
        original = await self.find_by_id(event_id)

        if original:
            await self.update(event_id, formatted_item)
        else:
            await self.create([formatted_item])

content_api_event_resource_config: ResourceConfig = ResourceConfig(
    name="events_capi",
    data_class=ContentAPIEventResource,
    service=ContentAPIEventService,
    default_sort=[("dates.start", 1)],
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
