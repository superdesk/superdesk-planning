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
from planning.utils import get_related_planning_for_events

from .planning import ContentAPIPlanningService
from ..types import ContentAPIEventResource, ContentAPIPlanningResource
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

        # Get set of planning items linked to this event from core
        planning_service = ContentAPIPlanningResource.get_service()
        expected_plans = get_related_planning_for_events([event_id]) or []
        expected_plan_ids = {p["_id"] for p in expected_plans}

        # Get what is currently linked in planning content api db
        cursor = await planning_service.find(
            {"query": {"bool": {"must": [{"term": {"events.literal": event_id}}]}}},
            max_results=500,
            projection=["_id", "events"],
        )
        linked_plans = await cursor.to_list_raw()
        linked_plan_ids = {p["_id"] for p in linked_plans}

        # Unlink stale planning items - so they don't show in "plans" on fetch
        stale_plan_ids = linked_plan_ids - expected_plan_ids
        for plan_id in stale_plan_ids:
            plan_doc = next((p for p in linked_plans if p["_id"] == plan_id), None)
            if plan_doc is None:
                plan_doc = await planning_service.find_by_id(plan_id)

            existing_events = plan_doc.get("events") or []
            updated_events = [ev for ev in existing_events if ev.get("literal") != event_id]

            # Update only when there’s a change
            if updated_events != existing_events:
                await planning_service.update(plan_id, {"events": updated_events})
                await ContentAPIPlanningService().publish_async({"_id": plan_id}, subscribers)

        # Publish all still-linked planning items
        for plan in expected_plans:
            await ContentAPIPlanningService().publish_async(plan, subscribers)


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
