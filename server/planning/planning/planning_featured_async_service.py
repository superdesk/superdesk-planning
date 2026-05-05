from typing import Any
from copy import deepcopy

from quart_babel import gettext as _

from apps.auth import get_user_id
from bson import ObjectId
from planning.core.service import BasePlanningAsyncService
from planning.common import (
    get_version_item_for_post,
    enqueue_planning_item,
)
from planning.planning.planning_service import PlanningAsyncService
from planning.types import PlanningFeaturedResourceModel
from superdesk import get_resource_service, logger
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow


class PlanningFeaturedAsyncService(BasePlanningAsyncService[PlanningFeaturedResourceModel]):
    """Async Service class for the planning featured model."""

    async def on_create(self, docs: list[PlanningFeaturedResourceModel]):
        await super().on_create(docs)

        for doc in docs:
            items = await super().find({"_id": doc.id})
            if await items.count() > 0:
                raise SuperdeskApiError.badRequestError(message=_("Featured story already exists for this date."))

            await self.validate_featured_attrribute(doc.items)
            await self.post_featured_planning(doc)

    async def on_created(self, docs: list[PlanningFeaturedResourceModel]):
        await super().on_created(docs)

        for doc in docs:
            await self.enqueue_published_item(doc, doc)

    async def on_update(self, updates: dict[str, Any], original: PlanningFeaturedResourceModel):
        await super().on_update(updates, original)
        # Find all planning items in the list
        added_featured = [item_id for item_id in updates.get("items") or [] if item_id not in original.items or []]
        await self.validate_featured_attrribute(added_featured)
        await self.post_featured_planning(original.clone_with(updates), original)

    async def on_updated(self, updates: dict[str, Any], original: PlanningFeaturedResourceModel):
        await super().on_updated(updates, original)
        await self.enqueue_published_item(original.clone_with(updates), original)

    async def post_featured_planning(
        self, updates: PlanningFeaturedResourceModel, original: PlanningFeaturedResourceModel | None = None
    ):
        if updates.posted:
            await self.validate_post_status(updates.items if updates.items else (original.items if original else []))
            updates.posted = True
            updates.last_posted_time = utcnow()
            updates.last_posted_by = ObjectId(get_user_id())

    async def enqueue_published_item(
        self, updates: PlanningFeaturedResourceModel, original: PlanningFeaturedResourceModel
    ):
        if updates.posted:
            plan = deepcopy(original.to_dict())
            plan.update(updates.to_dict())
            version, plan = get_version_item_for_post(plan)

            # Create an entry in the planning versions collection for this published version
            version_id = await get_resource_service("published_planning").post_async(
                [
                    {
                        "item_id": plan["_id"],
                        "version": version,
                        "type": "planning_featured",
                        "published_item": plan,
                    }
                ]
            )
            if version_id:
                # Enqueue the item for publishing.
                await enqueue_planning_item(version_id[0])
            else:
                logger.error("Failed to save planning_featured version for featured item id {}".format(plan["_id"]))

    async def validate_featured_attrribute(self, planning_ids: list):
        planning_service = PlanningAsyncService()
        for planning_id in planning_ids:
            planning_item = await planning_service.find_by_id_raw(planning_id)
            if planning_item and not planning_item.get("featured"):
                raise SuperdeskApiError.badRequestError(message=_("A planning item in the list is not featured."))

    async def validate_post_status(self, planning_ids: list):
        planning_service = PlanningAsyncService()
        for planning_id in planning_ids:
            planning_item = await planning_service.find_by_id_raw(planning_id)
            if planning_item and not planning_item.get("pubstatus", None):
                raise SuperdeskApiError.badRequestError(
                    message="Not all planning items are posted. Aborting post action."
                )
