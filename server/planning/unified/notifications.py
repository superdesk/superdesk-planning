from superdesk.notification import push_notification
from apps.auth import get_auth, get_user_id

from planning.types.unified import (
    UnifiedPlanningResource,
    PlanningItemType,
    RelatedEventLinkType,
)

from .common import get_related_event_ids, get_related_planning_for_events


def send_created_notifications(item: UnifiedPlanningResource, notifications_sent: set[str]):
    item_type = "events" if item.item_type == PlanningItemType.EVENT else "planning"
    user_id = str(item.original_creator or "")
    event_name: str
    item_id: str

    if item.recurrence_id:
        event_name = f"{item_type}:recurrence_created"
        item_id = item.recurrence_id
    else:
        event_name = f"{item_type}:created"
        item_id = str(item.id)

    # Don't send notification if one has already been sent
    # This is to ensure recurring events doesn't send multiple notifications
    if item_id in notifications_sent or "previous_recurrence_id" in item:
        return

    notifications_sent.add(item_id)
    kwargs = dict(
        item=item_id,
        user=user_id,
        session=get_auth().get("_id"),
    )

    if item.item_type == PlanningItemType.PLANNING:
        kwargs.update(
            dict(
                added_agendas=[str(agenda_id) for agenda_id in item.agendas or []],
                removed_agendas=[],
                event_ids=get_related_event_ids(item, RelatedEventLinkType.PRIMARY),
            )
        )

    push_notification(event_name, **kwargs)


def send_updated_notifications(
    original: UnifiedPlanningResource, updated: UnifiedPlanningResource, related_events_changed: bool = False
):
    item_type = "events" if original.item_type == PlanningItemType.EVENT else "planning"
    user_id = str(updated.version_creator or "")
    session_id = get_auth().get("_id")
    kwargs = dict(
        item=str(original.id),
        user=user_id,
        session=session_id,
    )

    if original.item_type == PlanningItemType.PLANNING:
        updated_agendas = set(str(agenda_id) for agenda_id in updated.agendas or [])
        original_agendas = set(str(agenda_id) for agenda_id in original.agendas or [])
        removed_agendas = original_agendas - updated_agendas
        added_agendas = updated_agendas - original_agendas
        kwargs.update(
            dict(
                added_agendas=list(added_agendas),
                removed_agendas=list(removed_agendas),
                event_ids=get_related_event_ids(updated, RelatedEventLinkType.PRIMARY),
                related_events_changed=related_events_changed,
            )
        )

    push_notification(f"{item_type}:updated", **kwargs)

    if original.lock_user and not updated.lock_user:
        # When the item is unlocked by a patch
        kwargs = dict(
            item=original.id,
            recurrence_id=original.recurrence_id,
            user=user_id,
            lock_session=session_id,
            etag=updated.etag,
            from_ingest=False,  # TODO-PR: Figure out what to do here
            type=original.item_type,
        )

        if original.item_type == PlanningItemType.PLANNING:
            kwargs.update(
                dict(
                    event_ids=get_related_event_ids(updated, RelatedEventLinkType.PRIMARY),
                )
            )

        push_notification(f"{item_type}:unlocked", **kwargs)


def send_deleted_notifications(item: UnifiedPlanningResource) -> None:
    item_type = "events" if item.item_type == PlanningItemType.EVENT else "planning"
    push_notification(
        f"{item_type}:delete", item=item.id, user=str(get_user_id()), lock_session=str(get_auth().get("_id"))
    )


def send_unlock_notification(item: UnifiedPlanningResource, updates: dict):
    item_type = "events" if item.item_type == PlanningItemType.EVENT else "planning"

    push_notification(
        f"{item_type}:unlocked",
        item=str(item.id),
        lock_session=str(get_auth().get("_id")),
        etag=updates["_etag"],
        recurrence_id=item.recurrence_id,
        from_ingest=False,  # TODO-PR
        type=item.item_type,
    )


async def notify_related_events_changed(updates: dict, original: UnifiedPlanningResource) -> bool:
    if "related_events" not in updates:
        return False

    updates_ids = set(link["_id"] for link in updates["related_events"] or [])
    original_ids = set(link._id for link in original.related_events or [])

    removed_ids = original_ids - updates_ids
    added_ids = updates_ids - original_ids
    changed_ids = removed_ids.union(added_ids)

    for event_id in changed_ids:
        plans = await get_related_planning_for_events([event_id])
        push_notification(
            "event:link_updated",
            event=event_id,
            planning=original.id,
            action="delete" if event_id in removed_ids else "create",
            links=[plan.id async for plan in plans],
        )

    return len(changed_ids) > 0
