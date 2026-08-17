from typing import Any

from quart_babel import gettext as _

from superdesk import get_resource_service
from apps.auth import get_auth, get_user

from apps.item_lock.components.item_lock import LOCK_USER, LOCK_SESSION

from planning import signals
from planning.common import (
    ITEM_EXPIRY,
    ITEM_STATE,
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    remove_autosave_on_spike,
    remove_lock_information,
    set_item_expiry,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.planning.planning_spike import process_spike_planning_item
from planning.types.assignment import AssignmentResourceModel
from planning.utils import (
    event_has_planning_items,
    get_first_related_event_id_for_planning,
    get_related_planning_for_events_async,
)
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.resource_fields import ID_FIELD


async def post_spike_event_actions(original: dict[str, Any]) -> None:
    assignments_service = AssignmentResourceModel.get_service()

    # Spike associated planning
    spiked_items = []

    for planning in await get_related_planning_for_events_async([original[ID_FIELD]], "primary"):
        if planning["state"] == WORKFLOW_STATE.DRAFT:
            await process_spike_planning_item({"state": "spiked"}, planning)
            spiked_items.append(str(planning[ID_FIELD]))

    # When a planning item associated with this event is spiked
    # If there were any failures in removing assignments
    # Send those notifications here
    if len(spiked_items) > 0:
        query = {"query": {"bool": {"must": {"terms": {"planning_item": spiked_items}}}}}
        results = await assignments_service.search(query)
        assignments = await results.to_list_raw()

        if len(assignments) > 0:
            session_id = get_auth().get("_id")
            user_id = get_user().get(ID_FIELD)
            push_notification(
                "assignments:delete:fail",
                items=[
                    {
                        "slugline": a.get("planning", {}).get("slugline", ""),
                        "type": a.get("planning", {}).get("g2_content_type", ""),
                    }
                    for a in assignments
                ],
                session=session_id,
                user=user_id,
            )


def can_spike_event(event: dict[str, Any], events_with_plans: list) -> bool:
    return "pubstatus" not in event and event[ID_FIELD] not in events_with_plans and "reschedule_from" not in event


def unspike_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    updates[ITEM_STATE] = original.get("revert_state", WORKFLOW_STATE.DRAFT)
    updates["revert_state"] = None
    updates[ITEM_EXPIRY] = None


def spike_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    updates["revert_state"] = original[ITEM_STATE]
    updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
    set_item_expiry(updates)


def validate_event_states(event: dict[str, Any]) -> None:
    # Public Events (except unposted) cannot be spiked
    if event.get("pubstatus") and event.get("state") != WORKFLOW_STATE.KILLED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Posted Events cannot be spiked."))

    # Posted Events with Planning items cannot be spiked
    elif event.get("pubstatus") and event_has_planning_items(event[ID_FIELD], "primary"):
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Event has an associated Planning item."))

    # Event was created from a 'Reschedule' action or is 'Rescheduled'
    elif event.get("reschedule_from") or event.get(ITEM_STATE) == WORKFLOW_STATE.RESCHEDULED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Rescheduled Events cannot be spiked."))

    # Event already spiked
    elif event.get(ITEM_STATE) == WORKFLOW_STATE.SPIKED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Event is already spiked."))


async def validate_spike_event(event: dict[str, Any]) -> None:
    for planning in await get_related_planning_for_events_async([event[ID_FIELD]], "primary"):
        if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(
                message="Spike failed. One or more related planning items are locked."
            )
    validate_event_states(event)


async def validate_recurring_event(original: dict[str, Any], recurrence_id: str) -> list:
    events_service = get_resource_service("events")
    planning_service = get_resource_service("planning")
    events_with_plans = []

    validate_event_states(original)

    async for event in await events_service.find_async({"recurrence_id": recurrence_id}):
        if event[ID_FIELD] == original[ID_FIELD]:
            continue

        if event.get(LOCK_USER) or event.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(message=_("Spike failed. An event in the series is locked."))

    async for planning in await planning_service.find_async({"recurrence_id": recurrence_id}):
        if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(message=_("Spike failed. A related planning item is locked."))

        first_event_id = get_first_related_event_id_for_planning(planning, "primary")
        if first_event_id not in events_with_plans:
            events_with_plans.append(first_event_id)

    return events_with_plans


async def spike_single_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    await validate_spike_event(original)
    remove_lock_information(updates)
    spike_event(updates, original)


async def unspike_single_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    remove_lock_information(updates)
    unspike_event(updates, original)


async def spike_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str) -> None:
    events_service = get_resource_service("events")

    # Ensure that no other Event or Planning item is currently locked
    events_with_plans = await validate_recurring_event(original, original["recurrence_id"])
    historic, past, future = await get_recurring_timeline(original, postponed=True, cancelled=True)

    # Mark item as unlocked directly in order to avoid more queries and notifications
    # coming from lockservice.
    remove_lock_information(updates)
    spike_event(updates, original)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        spiked_events = future
    else:
        spiked_events = past + future

    notifications = []
    for event in spiked_events:
        if not can_spike_event(event, events_with_plans):
            continue

        new_updates = {"skip_on_update": True}
        spike_event(new_updates, event)
        await events_service.patch_async(event[ID_FIELD], new_updates)
        item = await events_service.find_one_async(req=None, _id=event[ID_FIELD])
        await signals.event_spiked.send(new_updates, event)

        if item:
            notifications.append(
                {
                    "id": event[ID_FIELD],
                    "etag": item["_etag"],
                    "revert_state": item["revert_state"],
                }
            )

    updates["_spiked_items"] = notifications


async def unspike_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str) -> None:
    events_service = get_resource_service("events")

    historic, past, future = await get_recurring_timeline(original, spiked=True)
    remove_lock_information(updates)
    unspike_event(updates, original)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        unspiked_events = future
    else:
        unspiked_events = past + future

    notifications = []
    for event in unspiked_events:
        if event.get(ITEM_STATE) != WORKFLOW_STATE.SPIKED:
            continue

        new_updates = {"skip_on_update": True}
        unspike_event(new_updates, event)
        await events_service.patch_async(event[ID_FIELD], new_updates)
        item = await events_service.find_one_async(req=None, _id=event[ID_FIELD])
        await signals.event_unspiked.send(new_updates, event)

        notifications.append(
            {
                "id": event[ID_FIELD],
                "etag": item["_etag"],
                "state": event.get("revert_state", WORKFLOW_STATE.DRAFT),
            }
        )

    updates["_unspiked_items"] = notifications


async def process_spike_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event spike update, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    events_service = get_resource_service("events")
    ACTION = "spiked"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION, False)

    # Determine update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await spike_single_event(updates, original)
    else:
        await spike_recurring_events(updates, original, update_method)

    # Clean updates before persisting change
    spiked_items = updates.pop("_spiked_items", [])
    await remove_autosave_on_spike(original)
    updates.pop("update_method", None)
    updates.pop("skip_on_update", None)

    # Update the original event in the database
    await events_service.update_async(original[ID_FIELD], updates, original, skip_signals=True)
    await signals.event_spiked.send(updates, original)
    spiked_event = await events_service.find_one_async(req=None, _id=original[ID_FIELD])
    assert spiked_event is not None, "Expected spiked_event to be a dict, got None"

    user_id = get_user().get(ID_FIELD, "")
    if user_id:
        spiked_items.append(
            {"id": spiked_event[ID_FIELD], "etag": spiked_event["_etag"], "revert_state": spiked_event["revert_state"]}
        )
        push_notification(
            "events:spiked",
            item=str(original[ID_FIELD]),
            user=str(user_id),
            spiked_items=spiked_items,
        )

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION, False)
    await post_spike_event_actions(original)

    return spiked_event


async def process_unspike_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event unspike update, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    events_service = get_resource_service("events")
    ACTION = "unspiked"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION, False)

    # Determine update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await unspike_single_event(updates, original)
    else:
        await unspike_recurring_events(updates, original, update_method)

    # Clean updates before persisting change
    unspiked_items = updates.pop("_unspiked_items", [])

    # Update the original event in the database
    await events_service.update_async(original[ID_FIELD], updates, original, skip_signals=True)
    await signals.event_unspiked.send(updates, original)
    unspiked_event = await events_service.find_one_async(req=None, _id=original[ID_FIELD])
    assert unspiked_event is not None, "Expected unspiked_event to be a dict, got None"

    user_id = get_user().get(ID_FIELD, "")
    if user_id:
        unspiked_items.append(
            {"id": unspiked_event[ID_FIELD], "etag": unspiked_event["_etag"], "state": unspiked_event[ITEM_STATE]}
        )
        push_notification(
            "events:unspiked",
            item=str(original[ID_FIELD]),
            user=str(user_id),
            unspiked_items=unspiked_items,
        )

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return unspiked_event
