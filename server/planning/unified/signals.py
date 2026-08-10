from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning import signals
from planning.events import EventsHistoryAsyncService
from planning.planning import PlanningHistoryAsyncService


async def _on_item_created(item: UnifiedPlanningResource) -> None:
    if item.item_type == PlanningItemType.EVENT:
        await EventsHistoryAsyncService().on_item_created([item.to_dict()])
    elif item.item_type == PlanningItemType.PLANNING:
        await PlanningHistoryAsyncService().on_item_created([item.to_dict()])


async def _on_item_updated(item: UnifiedPlanningResource, updates: dict) -> None:
    if item.item_type == PlanningItemType.EVENT:
        await EventsHistoryAsyncService().on_item_updated(updates, item.to_dict())
    elif item.item_type == PlanningItemType.PLANNING:
        await PlanningHistoryAsyncService().on_item_updated(updates, item.to_dict())


async def _on_item_deleted(item: UnifiedPlanningResource) -> None:
    if item.item_type == PlanningItemType.EVENT:
        await EventsHistoryAsyncService().on_item_deleted(item.to_dict())
    elif item.item_type == PlanningItemType.PLANNING:
        await PlanningHistoryAsyncService().on_item_deleted(item.to_dict())


async def _on_item_duplicated(new_item: UnifiedPlanningResource, parent_item: UnifiedPlanningResource) -> None:
    if new_item.item_type == PlanningItemType.EVENT:
        await EventsHistoryAsyncService().on_item_updated(
            {"duplicate_id": new_item.id}, parent_item.to_dict(), operation="duplicate"
        )
        await EventsHistoryAsyncService().on_item_updated(
            {"duplicate_id": parent_item.id}, new_item.to_dict(), operation="duplicate_from"
        )
    elif new_item.item_type == PlanningItemType.PLANNING:
        pass


def connect_signals():
    resource_signals = UnifiedPlanningResource.get_signals()
    resource_signals.data.on_created += _on_item_created
    resource_signals.data.on_updated += _on_item_updated
    resource_signals.data.on_deleted += _on_item_deleted
    signals.on_unified_planning_duplicated += _on_item_duplicated
