import logging

from copy import deepcopy
from typing import Any

from planning.types import EventResourceModel

from planning.types import EventsHistoryResourceModel
from superdesk.resource_fields import ID_FIELD
from planning.utils import get_related_planning_for_events
from planning.history_async_service import HistoryAsyncService
from planning.item_lock import LOCK_ACTION

logger = logging.getLogger(__name__)


class EventsHistoryAsyncService(HistoryAsyncService[EventsHistoryResourceModel]):
    async def on_item_created(self, items: list[dict[str, Any]], operation: str | None = None):
        created_from_planning = []
        regular_events = []
        for item in items:
            if isinstance(item, EventResourceModel):
                item = item.to_dict()

            planning_items = get_related_planning_for_events([item[ID_FIELD]], "primary")
            if len(planning_items) > 0:
                item["created_from_planning"] = planning_items[0].get("_id")
                created_from_planning.append(item)
            else:
                regular_events.append((item))

        await super().on_item_created(created_from_planning, "created_from_planning")
        await super().on_item_created(regular_events)

    async def on_item_deleted(self, doc: dict[str, Any]):
        lookup = {"event_id": doc[ID_FIELD]}
        await self.delete_many(lookup=lookup)

    async def on_item_updated(self, updates: dict[str, Any], original: dict[str, Any], operation: str | None = None):
        item = deepcopy(original)
        if list(item.keys()) == ["_id"]:
            diff = self._remove_unwanted_fields(updates)
        else:
            diff = await self._changes(original, updates)
            if updates:
                item.update(updates)

        if not operation:
            operation = "convert_recurring" if original.get(LOCK_ACTION) == "convert_recurring" else "edited"

        await self._save_history(item, diff, operation)

    async def _save_history(self, item: dict[str, Any], update: dict[str, Any], operation: str | None = None):
        history = {
            "event_id": item[ID_FIELD],
            "user_id": self.get_user_id(),
            "operation": operation,
            "update": update,
        }
        # a post action is recorded as a special case
        if operation == "update":
            if "scheduled" == update.get("state", ""):
                history["operation"] = "post"
            elif "canceled" == update.get("state", ""):
                history["operation"] = "unpost"
        elif operation == "create" and "ingested" == update.get("state", ""):
            history["operation"] = "ingested"
        await self.create([history])

    async def on_update_repetitions(self, updates: dict[str, Any], event_id: str, operation: str | None = None):
        await self.on_item_updated(updates, {"_id": event_id}, operation or "update_repetitions")

    async def on_update_time(self, updates: dict[str, Any], original: dict[str, Any]):
        await self.on_item_updated(updates, original, "update_time")
