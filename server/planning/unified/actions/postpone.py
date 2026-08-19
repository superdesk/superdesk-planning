# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Merged postpone logic for Event & Planning items (SDBELGA-1119).

Reads/writes go through the ``UnifiedPlanningResource`` Pydantic service — the Eve
``events``/``planning`` services are now front-end-compat only, their business
logic is gutted. Coverages are processed for both item types (Events carry
coverages too now).
"""

from copy import deepcopy
from typing import Any

from superdesk.resource_fields import ID_FIELD
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth

from planning import signals
from planning.assignments import AssignmentsAsyncService
from planning.common import (
    UPDATE_SINGLE,
    UPDATE_FUTURE,
    WORKFLOW_STATE,
    ITEM_STATE,
    get_coverage_type_name,
    remove_lock_information,
    set_actioned_date_to_event,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.planning_notifications import PlanningNotifications
from planning.types import UnifiedPlanningResource
from planning.types.unified import PlanningItemType, RelatedEventLinkType
from planning.unified.common import get_related_planning_for_events


async def process_postpone(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    if original.get("type") == PlanningItemType.EVENT.value:
        return await process_postpone_event(updates, original)
    return await process_postpone_planning_item(updates, original)


def set_event_postponed(updates):
    reason = updates.get("reason", None)
    remove_lock_information(updates)
    updates["state"] = WORKFLOW_STATE.POSTPONED
    updates["state_reason"] = reason


async def postpone_item_coverages(updates: dict[str, Any], original: dict[str, Any]):
    """Postpone the coverages carried by the item (Events support coverages too)."""
    coverages = deepcopy(original.get("coverages"))
    if not coverages:
        return
    updates["coverages"] = coverages
    for coverage in coverages:
        await postpone_coverage(updates, coverage)


async def postpone_event_plannings(updates: dict[str, Any], original: dict[str, Any]):
    reason = updates.get("reason", None)

    async for planning in await get_related_planning_for_events([original[ID_FIELD]], RelatedEventLinkType.PRIMARY):
        plan = planning.to_dict()
        if plan.get("state") != WORKFLOW_STATE.CANCELLED:
            await process_postpone_planning_item({"reason": reason}, plan)


async def postpone_single_event(updates: dict[str, Any], original: dict[str, Any]):
    set_event_postponed(updates)
    await postpone_item_coverages(updates, original)
    await postpone_event_plannings(updates, original)


async def postpone_recurring_event(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    service = UnifiedPlanningResource.get_service()
    historic, past, future = await get_recurring_timeline(original)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        postponed_events = future
    else:
        postponed_events = past + future

    set_event_postponed(updates)

    for event in postponed_events:
        new_updates = deepcopy(updates)

        # Mark the Event as being Postponed
        await postpone_event_plannings(new_updates, event)
        await postpone_item_coverages(new_updates, event)
        new_updates["skip_on_update"] = True
        await service.update(event[ID_FIELD], new_updates)

    await postpone_event_plannings(updates, original)
    await postpone_item_coverages(updates, original)


async def process_postpone_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event postpone, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    service = UnifiedPlanningResource.get_service()
    ACTION = "postpone"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION)

    # Determin update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await postpone_single_event(updates, original)
    else:
        await postpone_recurring_event(updates, original, update_method)

    # Clean updates before persisting change
    reason = updates.pop("reason", None)
    set_actioned_date_to_event(updates, original)
    updates.pop("update_method", None)

    # Update the original event in the database. Go through the service's on_update,
    # but skip the (still unimplemented) recurring date-update logic via
    # `skip_on_update`; on_update strips the flag before persisting.
    updates["skip_on_update"] = True
    event_id = original[ID_FIELD]
    updated = await service.update(event_id, updates)
    await signals.event_postponed.send(updates, original)
    postponed_event = updated.to_dict()

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "events:postpone",
        item=str(event_id),
        user=str(user),
        session=str(session),
        reason=reason,
        actioned_date=updates.get("actioned_date"),
    )

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return postponed_event


async def postpone_coverage(updates: dict[str, Any], coverage: dict[str, Any]):
    assignment_service = AssignmentsAsyncService()

    if coverage.get("workflow_status") != WORKFLOW_STATE.CANCELLED:
        coverage["planning"]["workflow_status_reason"] = updates.get("reason")

    assigned_to = coverage.get("assigned_to")
    if assigned_to:
        assignment = await assignment_service.find_by_id_raw(assigned_to.get("assignment_id"))
        if assignment:
            slugline = assignment.get("planning", {}).get("slugline", "")
            coverage_type = assignment.get("planning", {}).get("g2_content_type", "")
            await PlanningNotifications().notify_assignment(
                coverage_status=assignment.get("assigned_to", {}).get("state"),
                target_user=assignment.get("assigned_to", {}).get("user"),
                target_desk=(
                    assignment.get("assigned_to", {}).get("desk")
                    if not assignment.get("assigned_to", {}).get("user")
                    else None
                ),
                message="assignment_postponed_msg",
                slugline=slugline,
                coverage_type=get_coverage_type_name(coverage_type),
            )


async def process_postpone_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    service = UnifiedPlanningResource.get_service()

    # Postpone the planning_item using reason in updates
    updates["state_reason"] = updates.get("reason")
    updates[ITEM_STATE] = WORKFLOW_STATE.POSTPONED

    await postpone_item_coverages(updates, original)

    reason = updates.get("reason", None)
    if "reason" in updates:
        del updates["reason"]

    # Go through the service's on_update, but skip the (still unimplemented)
    # recurring date-update logic via `skip_on_update`; on_update strips the flag.
    updates["skip_on_update"] = True
    planning_item_id = original[ID_FIELD]
    updated = await service.update(planning_item_id, updates)
    await signals.planning_postponed.send(updates, original)
    postponed_planning_item = updated.to_dict()

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "planning:postponed",
        item=str(planning_item_id),
        user=str(user),
        session=str(session),
        reason=reason,
    )

    return postponed_planning_item
