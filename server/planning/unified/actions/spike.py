# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Merged spike / unspike logic for Event & Planning items (SDBELGA-1119)."""

from copy import deepcopy
from typing import Any

from quart_babel import gettext as _

from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.resource_fields import ID_FIELD

from apps.auth import get_auth, get_user, get_user_id
from apps.item_lock.components.item_lock import LOCK_USER, LOCK_SESSION

from planning import signals
from planning.assignments import AssignmentsAsyncService
from planning.common import (
    ITEM_EXPIRY,
    ITEM_STATE,
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    get_coverage_type_name,
    remove_lock_information,
    set_item_expiry,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.planning.planning_utils import delete_assignments_for_coverages
from planning.planning_notifications import PlanningNotifications
from planning.types import UnifiedPlanningResource
from planning.types.assignment import AssignmentResourceModel
from planning.types.unified import PlanningItemType, RelatedEventLinkType
from planning.unified.common import get_related_planning_for_events, event_has_planning_items
from planning.utils import (
    get_first_related_event_id_for_planning,
    get_related_event_ids_for_planning,
)


# Shared state mutations (identical for Event & Planning)
def set_item_spiked(updates: dict[str, Any], original: dict[str, Any]) -> None:
    updates["revert_state"] = original[ITEM_STATE]
    updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
    set_item_expiry(updates)


def set_item_unspiked(updates: dict[str, Any], original: dict[str, Any]) -> None:
    updates[ITEM_STATE] = original.get("revert_state", WORKFLOW_STATE.DRAFT)
    updates["revert_state"] = None
    updates[ITEM_EXPIRY] = None


async def process_spike(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    if original.get("type") == PlanningItemType.EVENT.value:
        return await process_spike_event(updates, original)
    return await process_spike_planning_item(updates, original)


async def process_unspike(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    if original.get("type") == PlanningItemType.EVENT.value:
        return await process_unspike_event(updates, original)
    return await process_unspike_planning_item(updates, original)


async def post_spike_event_actions(original: dict[str, Any]) -> None:
    assignments_service = AssignmentResourceModel.get_service()

    # Spike associated planning
    spiked_items = []

    async for planning in await get_related_planning_for_events([original[ID_FIELD]], RelatedEventLinkType.PRIMARY):
        plan = planning.to_dict()
        if plan["state"] == WORKFLOW_STATE.DRAFT:
            await process_spike_planning_item({"state": "spiked"}, plan)
            spiked_items.append(str(plan[ID_FIELD]))

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


async def validate_event_states(event: dict[str, Any]) -> None:
    # Public Events (except unposted) cannot be spiked
    if event.get("pubstatus") and event.get("state") != WORKFLOW_STATE.KILLED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Posted Events cannot be spiked."))

    # Posted Events with Planning items cannot be spiked
    elif event.get("pubstatus") and await event_has_planning_items(event[ID_FIELD], RelatedEventLinkType.PRIMARY):
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Event has an associated Planning item."))

    # Event was created from a 'Reschedule' action or is 'Rescheduled'
    elif event.get("reschedule_from") or event.get(ITEM_STATE) == WORKFLOW_STATE.RESCHEDULED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Rescheduled Events cannot be spiked."))

    # Event already spiked
    elif event.get(ITEM_STATE) == WORKFLOW_STATE.SPIKED:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Event is already spiked."))


async def validate_spike_event(event: dict[str, Any]) -> None:
    async for planning in await get_related_planning_for_events([event[ID_FIELD]], RelatedEventLinkType.PRIMARY):
        plan = planning.to_dict()
        if plan.get(LOCK_USER) or plan.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(
                message="Spike failed. One or more related planning items are locked."
            )
    await validate_event_states(event)


async def validate_recurring_event(original: dict[str, Any], recurrence_id: str) -> list:
    service = UnifiedPlanningResource.get_service()
    events_with_plans = []

    await validate_event_states(original)

    # Scope series lookups by `type` (shared collection, no datalayer filter).
    # `max_results=0` disables the per-page cap so the whole series is checked.
    events = await service.find(
        {"recurrence_id": recurrence_id, "type": PlanningItemType.EVENT.value}, max_results=0, use_mongo=True
    )
    for event_obj in await events.to_list():
        event = event_obj.to_dict()
        if event[ID_FIELD] == original[ID_FIELD]:
            continue

        if event.get(LOCK_USER) or event.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(message=_("Spike failed. An event in the series is locked."))

    plannings = await service.find(
        {"recurrence_id": recurrence_id, "type": PlanningItemType.PLANNING.value}, max_results=0, use_mongo=True
    )
    for planning_obj in await plannings.to_list():
        planning = planning_obj.to_dict()
        if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
            raise SuperdeskApiError.forbiddenError(message=_("Spike failed. A related planning item is locked."))

        first_event_id = get_first_related_event_id_for_planning(planning, "primary")
        if first_event_id not in events_with_plans:
            events_with_plans.append(first_event_id)

    return events_with_plans


async def spike_single_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    await validate_spike_event(original)
    remove_lock_information(updates)
    set_item_spiked(updates, original)


async def unspike_single_event(updates: dict[str, Any], original: dict[str, Any]) -> None:
    remove_lock_information(updates)
    set_item_unspiked(updates, original)


async def spike_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str) -> None:
    service = UnifiedPlanningResource.get_service()

    # Ensure that no other Event or Planning item is currently locked
    events_with_plans = await validate_recurring_event(original, original["recurrence_id"])
    historic, past, future = await get_recurring_timeline(original, postponed=True, cancelled=True)

    # Mark item as unlocked directly in order to avoid more queries and notifications
    # coming from lockservice.
    remove_lock_information(updates)
    set_item_spiked(updates, original)

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

        # Go through on_update but skip the unimplemented recurring date logic
        new_updates: dict[str, Any] = {"skip_on_update": True}
        set_item_spiked(new_updates, event)
        item = (await service.update(event[ID_FIELD], new_updates)).to_dict()
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
    service = UnifiedPlanningResource.get_service()

    historic, past, future = await get_recurring_timeline(original, spiked=True)
    remove_lock_information(updates)
    set_item_unspiked(updates, original)

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

        # Go through on_update but skip the unimplemented recurring date logic
        new_updates: dict[str, Any] = {"skip_on_update": True}
        set_item_unspiked(new_updates, event)
        item = (await service.update(event[ID_FIELD], new_updates)).to_dict()
        await signals.event_unspiked.send(new_updates, event)

        if item:
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
    service = UnifiedPlanningResource.get_service()
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
    updates.pop("update_method", None)

    # Update the original event in the database. Go through on_update but skip the
    # (still unimplemented) recurring date logic via `skip_on_update`.
    updates["skip_on_update"] = True
    updated = await service.update(original[ID_FIELD], updates)
    await signals.event_spiked.send(updates, original)
    spiked_event = updated.to_dict()

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
    service = UnifiedPlanningResource.get_service()
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

    # Update the original event in the database. Go through on_update but skip the
    # (still unimplemented) recurring date logic via `skip_on_update`.
    updates["skip_on_update"] = True
    updated = await service.update(original[ID_FIELD], updates)
    await signals.event_unspiked.send(updates, original)
    unspiked_event = updated.to_dict()

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


def post_update_planning_item_actions(updates: dict[str, Any], original: dict[str, Any]):
    if original.get(LOCK_USER) and LOCK_USER in updates and updates[LOCK_USER] is None:
        push_notification(
            "planning:unlock",
            item=str(original.get(ID_FIELD)),
            user=str(get_user_id()),
            lock_session=str(get_auth().get(ID_FIELD)),
            etag=updates.get("_etag"),
            event_ids=get_related_event_ids_for_planning(original),
            recurrence_id=original.get("recurrence_id") or None,
            type=original.get("type"),
        )


async def post_planning_item_spike_actions(updates: dict[str, Any], original: dict[str, Any]):
    post_update_planning_item_actions(updates, original)
    service = UnifiedPlanningResource.get_service()

    # Delete assignments in workflow
    assignments_to_delete = []
    coverages = original.get("coverages") or []
    for coverage in coverages:
        if coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE:
            assignments_to_delete.append(coverage)

    notify_user_on_failed_assignment_deletes = True
    first_event_id = get_first_related_event_id_for_planning(original, "primary")

    if first_event_id:
        event = await service.find_by_id_raw(first_event_id)
        notify_user_on_failed_assignment_deletes = not event or event.get("state") != WORKFLOW_STATE.SPIKED

    await delete_assignments_for_coverages(assignments_to_delete, notify_user_on_failed_assignment_deletes)


async def notify_draft_coverage_on_spike(coverage: dict[str, Any]):
    assignment_service = AssignmentsAsyncService()

    assigned_to = coverage.get("assigned_to")
    if assigned_to and assigned_to.get("assignment_id"):
        user = get_user()
        assignment = await assignment_service.find_by_id_raw(assigned_to["assignment_id"])
        if assignment:
            slugline = assignment.get("planning", {}).get("slugline", "")
            coverage_type = assignment.get("planning", {}).get("g2_content_type", "")
            await PlanningNotifications().notify_assignment(
                coverage_status=coverage.get("workflow_status"),
                target_user=assignment.get("assigned_to", {}).get("user"),
                target_desk=(
                    assignment.get("assigned_to", {}).get("desk")
                    if not assignment.get("assigned_to", {}).get("user")
                    else None
                ),
                message="assignment_spiked_msg",
                slugline=slugline,
                coverage_type=get_coverage_type_name(coverage_type),
                actioning_user=user.get("display_name", user.get("username", "Unknown")),
                omit_user=True,
            )


async def process_spike_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Function to spike planning item.

    :param updates: The update payload from the client.
    :param original: The original planning document.
    :return: The updated planning document.
    """
    service = UnifiedPlanningResource.get_service()

    if original.get("pubstatus") or original.get("state") not in [
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.POSTPONED,
        WORKFLOW_STATE.CANCELLED,
    ]:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Planning item in invalid state for spiking."))

    user = get_user()

    set_item_spiked(updates, original)

    coverages = deepcopy(original.get("coverages") or [])
    for coverage in coverages:
        if coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE:
            coverage["workflow_status"] = WORKFLOW_STATE.DRAFT
            coverage["assigned_to"] = {}

    updates["coverages"] = coverages

    # Mark item as unlocked directly in order to avoid more queries and notifications
    # coming from lockservice.
    remove_lock_information(updates)
    updates["skip_on_update"] = True
    planning_item_id = original[ID_FIELD]
    updated = await service.update(planning_item_id, updates)
    await signals.planning_spiked.send(updates, original)
    spiked_planning_item = updated.to_dict()

    push_notification(
        "planning:spiked",
        item=str(planning_item_id),
        user=str(user.get(ID_FIELD, "")),
        etag=spiked_planning_item["_etag"],
        revert_state=spiked_planning_item["revert_state"],
    )

    for coverage in coverages:
        workflow_status = coverage.get("workflow_status")
        if workflow_status == WORKFLOW_STATE.DRAFT:
            await notify_draft_coverage_on_spike(coverage)

    # Perform post planning spike actions
    await post_planning_item_spike_actions(updates, original)

    return spiked_planning_item


async def process_unspike_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Function to unspike planning item.

    :param updates: The update payload from the client.
    :param original: The original planning document.
    :return: The updated planning document.
    """
    service = UnifiedPlanningResource.get_service()

    first_event_id = get_first_related_event_id_for_planning(original, "primary")
    if first_event_id:
        event = await service.find_by_id_raw(first_event_id)
        if event and event.get("state") == WORKFLOW_STATE.SPIKED:
            raise SuperdeskApiError.badRequestError(message=_("Unspike failed. Associated event is spiked."))

    set_item_unspiked(updates, original)
    remove_lock_information(updates)

    updates["skip_on_update"] = True
    planning_item_id = original[ID_FIELD]
    updated = await service.update(planning_item_id, updates)
    await signals.planning_unspiked.send(updates, original)
    unspiked_planning_item = updated.to_dict()

    push_notification(
        "planning:unspiked",
        item=str(planning_item_id),
        user=str(get_user_id()),
        etag=unspiked_planning_item.get("_etag"),
        state=unspiked_planning_item[ITEM_STATE],
    )

    # Perform post update actions
    post_update_planning_item_actions(updates, original)

    return unspiked_planning_item
