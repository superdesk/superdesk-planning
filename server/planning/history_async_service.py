from copy import deepcopy
from typing import Any, Generic, TypeVar
from bson import ObjectId

from planning.types import HistoryResourceModel
from superdesk.core import get_current_app
from superdesk.core.resources import AsyncResourceService
from superdesk.resource_fields import ID_FIELD
from .item_lock import LOCK_ACTION, LOCK_USER, LOCK_TIME, LOCK_SESSION
from superdesk.metadata.item import ITEM_TYPE


HistoryResourceModelType = TypeVar("HistoryResourceModelType", bound=HistoryResourceModel)

fields_to_remove = [
    "_id",
    "_etag",
    "_current_version",
    "_updated",
    "_created",
    "_links",
    "version_creator",
    "guid",
    LOCK_ACTION,
    LOCK_USER,
    LOCK_TIME,
    LOCK_SESSION,
    "planning_ids",
    "_updates_schedule",
    "_planning_schedule",
    "_planning_date",
    "_reschedule_from_schedule",
    "versioncreated",
]


class HistoryAsyncService(AsyncResourceService[Generic[HistoryResourceModelType]]):
    """Provide common async methods for tracking history of Creation, Updates and Spiking to collections"""

    async def on_item_created(self, items: list[dict[str, Any]], operation: str | None = None):
        for item in items:
            if not item.get("duplicate_from"):
                await self._save_history(
                    {ID_FIELD: ObjectId(item[ID_FIELD]) if ObjectId.is_valid(item[ID_FIELD]) else str(item[ID_FIELD])},
                    deepcopy(item),
                    operation or "create",
                )

    async def on_item_updated(self, updates: dict[str, Any], original: dict[str, Any], operation: str | None = None):
        item = deepcopy(original)
        if list(item.keys()) == ["_id"]:
            diff = updates
        else:
            diff = await self._changes(original, updates)
            if updates:
                item.update(updates)

        await self._save_history(item, diff, operation or "edited")

    async def on_spike(self, updates: dict[str, Any], original: dict[str, Any]):
        await self.on_item_updated(updates, original, "spiked")

    async def on_unspike(self, updates: dict[str, Any], original: dict[str, Any]):
        await self.on_item_updated(updates, original, "unspiked")

    async def on_cancel(self, updates: dict[str, Any], original: dict[str, Any]):
        operation = "events_cancel" if original.get(ITEM_TYPE) == "event" else "planning_cancel"
        await self.on_item_updated(updates, original, operation)

    async def on_reschedule(self, updates: dict[str, Any], original: dict[str, Any]):
        await self.on_item_updated(updates, original, "reschedule")

    async def on_reschedule_from(self, item: dict[str, Any]):
        new_item = deepcopy(item)
        await self._save_history({ID_FIELD: str(item[ID_FIELD])}, new_item, "reschedule_from")

    async def on_postpone(self, updates: dict[str, Any], original: dict[str, Any]):
        await self.on_item_updated(updates, original, "postpone")

    async def get_user_id(self):
        user = get_current_app().get_current_user_dict()
        if user:
            return user.get("_id")

    async def _changes(self, original: dict[str, Any], updates: dict[str, Any]):
        """
        Given the original record and the updates calculate what has changed and what is new

        :param original:
        :param updates:
        :return: dictionary of what was changed and what was added
        """
        original_keys = set(original.keys())
        updates_keys = set(updates.keys())
        intersect_keys = original_keys.intersection(updates_keys)
        modified = {o: updates[o] for o in intersect_keys if original[o] != updates[o]}
        added_keys = updates_keys - original_keys
        added = {a: updates[a] for a in added_keys}
        modified.update(added)
        return self._remove_unwanted_fields(modified)

    def _remove_unwanted_fields(self, update: dict[str, Any]):
        if update:
            update_copy = deepcopy(update)
            for field in fields_to_remove:
                update_copy.pop(field, None)

            return update_copy
        return update

    async def _save_history(self, item: Any, update: dict[str, Any], operation: str | None = None):
        raise NotImplementedError()
