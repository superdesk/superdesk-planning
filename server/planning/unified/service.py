import logging
from typing import Any

from quart_babel import gettext

from superdesk.core.resources import AsyncResourceService, ResourceModelType
from superdesk.errors import SuperdeskApiError
from apps.auth import get_user_id

from planning.types.unified import (
    UnifiedPlanningResource,
    PlanningItemType,
    RelatedEventLinkType,
    EmbeddedPlanningItem,
)
from planning.events.events_sync import sync_event_metadata_with_planning_items
from planning.events.events_history_async_service import EventsHistoryAsyncService
from planning.history import fields_to_remove as history_fields_to_remove
from planning.signals import on_unified_planning_duplicated

from .common import set_planning_schedule, get_first_related_event_id, ItemUpdateRequest
from .events import on_event_create, on_event_created, on_event_update, on_event_updated
from .planning import (
    validate_create_planning,
    validate_update_planning,
    on_create_planning,
    on_planning_created,
    on_planning_update,
    on_planning_updated,
)
from .coverages import validate_scheduled_updates, add_coverage, on_coverage_update, on_coverage_updated
from .notifications import send_created_notifications, send_updated_notifications, send_deleted_notifications
from .files import delete_item_files


logger = logging.getLogger(__name__)

FIELDS_NOT_STORED_IN_DB = (
    "update_method",
    "planning_ids",
    "failed_planning_ids",
    "planning_item",
    "embedded_planning",
    "associated_plannings",
)


class UnifiedPlanningResourceService(AsyncResourceService[UnifiedPlanningResource]):
    async def on_create(self, docs: list[UnifiedPlanningResource]) -> None:
        await super().on_create(docs)

        for doc in list(docs):
            current_user_id = get_user_id()
            if current_user_id:
                doc.original_creator = current_user_id
                doc.version_creator = current_user_id

            # Set `expired` to `False`, as no new item can be created as expired
            doc.expired = False

            self._copy_translated_values_to_root_level_fields(doc)

            if doc.item_type == PlanningItemType.EVENT:
                await on_event_create(doc, docs)
            elif doc.item_type == PlanningItemType.PLANNING:
                await on_create_planning(doc, docs)

            if doc.coverages:
                for coverage in doc.coverages:
                    await add_coverage(doc, coverage)

            set_planning_schedule(doc)

    async def insert_into_dbs(self, doc: UnifiedPlanningResource) -> tuple[str, str]:
        embedded_planning_lists: list[tuple[UnifiedPlanningResource, list[EmbeddedPlanningItem]]] = []

        if doc.embedded_planning:
            embedded_planning = doc.embedded_planning
            doc.embedded_planning = None
            if len(embedded_planning):
                embedded_planning_lists.append((doc, embedded_planning))

        # Remove all fields we don't want in storage
        field_values_not_stored: dict = {}
        for field in FIELDS_NOT_STORED_IN_DB:
            field_values_not_stored[field] = getattr(doc, field, None)
            setattr(doc, field, None)
        db_response = await super().insert_into_dbs(doc)

        # And add those values back onto the model
        for field, value in field_values_not_stored.items():
            setattr(doc, field, value)

        for item, embedded_planning in embedded_planning_lists:
            item_dict = item.to_dict()
            embedded_planning = item_dict.get("embedded_planning", [])
            await sync_event_metadata_with_planning_items(None, item_dict, embedded_planning)

        return db_response

    async def update_in_dbs(
        self, item_id: str, original: UnifiedPlanningResource, updates: dict, validated_updates: dict
    ) -> dict:
        # Remove all fields we don't want in storage
        field_values_not_stored: dict = {}
        for field in FIELDS_NOT_STORED_IN_DB:
            if field in updates:
                field_values_not_stored[field] = updates.pop(field)

        rtn = await super().update_in_dbs(item_id, original, updates, validated_updates)

        # And add those values back onto the updates dict
        for field, value in field_values_not_stored.items():
            field_values_not_stored[field] = value

        return rtn

    async def validate_create(self, doc: UnifiedPlanningResource) -> None:
        await super().validate_create(doc)
        if doc.item_type == PlanningItemType.PLANNING:
            await validate_create_planning(doc)

        validate_scheduled_updates(doc)

    async def validate_update(self, updates: dict, original: UnifiedPlanningResource, etag: str | None) -> dict:
        rtn = await super().validate_update(updates, original, etag)
        if original.item_type == PlanningItemType.PLANNING:
            await validate_update_planning(original, updates)

        updated = original.clone_with(rtn)
        validate_scheduled_updates(updated)
        return rtn

    async def on_created(self, docs: list[UnifiedPlanningResource]) -> None:
        notifications_sent: set[str] = set()
        events_history_service = EventsHistoryAsyncService()

        for doc in docs:
            if doc.duplicate_from:
                parent_item = await self.find_by_id(doc.duplicate_from)
                if not parent_item:
                    raise SuperdeskApiError.badRequestError(
                        message=gettext(f"Parent item '{doc.duplicate_from}' not found")
                    )

                await on_unified_planning_duplicated.send(doc, parent_item)

                # Update parent item's `duplicate_to` field
                duplicate_ids = parent_item.duplicate_to or []
                duplicate_ids.append(doc.id)
                await self.update(doc.duplicate_from, {"duplicate_to": duplicate_ids})

            # If this Planning item is linked to an Event, add a history record for the Event as well
            parent_event: UnifiedPlanningResource | None = None
            parent_event_id = get_first_related_event_id(doc, RelatedEventLinkType.PRIMARY)
            if parent_event_id:
                parent_event = await self.find_by_id(parent_event_id)
                if not parent_event:
                    logger.warning(
                        "Failed to find linked event for planning", extra=dict(event_id=parent_event_id, plan_id=doc.id)
                    )
                else:
                    if parent_event.expiry:
                        await self.system_update(
                            parent_event_id,
                            {
                                "expiry": None,
                                # Event hasn't actually been updated
                                # So we leave these version dates alone
                                "_updated": parent_event.updated,
                                "versioncreated": parent_event.versioncreated,
                            },
                        )

                    # TODO-UNIFIED: Update history
                    await events_history_service.on_item_updated(
                        {"planning_id": doc.id}, parent_event.to_dict(), "planning_created"
                    )

            if doc.item_type == PlanningItemType.PLANNING:
                await on_planning_created(doc, parent_event)
            else:
                await on_event_created(doc)

            await super().on_created(docs)
            send_created_notifications(doc, notifications_sent)

    async def on_update(self, updates: dict[str, Any], original: UnifiedPlanningResource) -> None:
        await super().on_update(updates, original)
        if "skip_on_update" in updates:
            del updates["skip_on_update"]
            return

        if updates.get("dates"):
            for field, value in original.dates.to_dict().items():  # we need to preserve non-updated values
                updates["dates"].setdefault(field, value)

        user_id = get_user_id()
        str_user_id = str(user_id) if user_id else None

        if original.item_type == PlanningItemType.PLANNING:
            if user_id and self._should_update_version_creator(updates, original):
                updates["version_creator"] = user_id
            else:
                updates.pop("version_creator", None)
                updates.pop("versioncreated", None)
        if user_id:
            updates["version_creator"] = user_id

        if original.lock_user and str(original.lock_user) != str_user_id:
            raise SuperdeskApiError.forbiddenError(gettext("The item was locked by another user"))

        updated = original.clone_with(updates)

        self._copy_translated_values_to_root_level_fields(updated)
        item_update_request = ItemUpdateRequest(original=original, updates=updates, updated=updated)

        if original.item_type == PlanningItemType.EVENT:
            await on_event_update(item_update_request)
        else:
            await on_planning_update(item_update_request)

        if "coverages" in updates:
            await on_coverage_update(item_update_request)

        updates.update(updated.to_dict())

    async def on_updated(self, updates: dict[str, Any], original: UnifiedPlanningResource) -> None:
        await super().on_updated(updates, original)

        if original.item_type == PlanningItemType.EVENT:
            await on_event_updated(updates, original)
        else:
            await on_planning_updated(updates, original)

        if "coverages" in updates:
            await on_coverage_updated(original, updates)

        await delete_item_files(original.item_type, original.files, updates.get("files"))
        send_updated_notifications(
            original, original.clone_with(updates), related_events_changed=updates.pop("related_events_changed", False)
        )

    async def on_deleted(self, doc: ResourceModelType) -> None:
        send_deleted_notifications(doc)

    def _copy_translated_values_to_root_level_fields(self, item: UnifiedPlanningResource) -> None:
        if not item.translations:
            return

        for translation in item.translations:
            if translation.language == item.language and not getattr(item, translation.field):
                setattr(item, translation.field, translation.value)

    @staticmethod
    def _should_update_version_creator(updates: dict, original: UnifiedPlanningResource):
        """
        Check if version_creator and versioncreated should be updated.

        Uses an exclusion approach since planning fields are dynamic and configurable.
        Returns True if planning fields changed, False for coverage-only or system field changes.
        """
        excluded_fields = set(history_fields_to_remove) | {
            "coverages",
            "update_method",
            "state",
            "pubstatus",
            "state_reason",
            "revert_state",
            "expired",
            "versionposted",
            "version",
        }

        for field in updates.keys():
            if field not in excluded_fields:
                if updates.get(field) != getattr(original, field):
                    return True

        return False
