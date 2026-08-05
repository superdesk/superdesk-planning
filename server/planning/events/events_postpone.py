# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy
from typing import Any

from superdesk import get_resource_service
from superdesk.resource_fields import ID_FIELD
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth

from planning import signals
from planning.common import (
    UPDATE_SINGLE,
    UPDATE_FUTURE,
    WORKFLOW_STATE,
    remove_lock_information,
    set_actioned_date_to_event,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.planning.planning_postpone import process_postpone_planning_item
from planning.utils import get_related_planning_for_events_async


def set_event_postponed(updates):
    reason = updates.get("reason", None)
    remove_lock_information(updates)
    updates["state"] = WORKFLOW_STATE.POSTPONED
    updates["state_reason"] = reason


async def postpone_event_plannings(updates: dict[str, Any], original: dict[str, Any]):
    reason = updates.get("reason", None)

    for plan in await get_related_planning_for_events_async([original[ID_FIELD]], "primary"):
        if plan.get("state") != WORKFLOW_STATE.CANCELLED:
            updated_plan = await process_postpone_planning_item({"reason": reason}, plan)
            await signals.planning_postponed.send(updated_plan, plan)


async def postpone_single_event(updates: dict[str, Any], original: dict[str, Any]):
    set_event_postponed(updates)
    await postpone_event_plannings(updates, original)


async def postpone_recurring_event(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    events_service = get_resource_service("events")
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
        new_updates["skip_on_update"] = True
        await events_service.patch_async(event[ID_FIELD], new_updates)

    await postpone_event_plannings(updates, original)


async def process_postpone_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event postpone, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    events_service = get_resource_service("events")
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
    updates.pop("skip_on_update", None)

    # Update the original event in the database
    event_id = original[ID_FIELD]
    await events_service.update_async(event_id, updates, original, skip_signals=True)
    await signals.event_postponed.send(updates, original)
    postponed_event = await events_service.find_one_async(req=None, _id=event_id)
    assert postponed_event is not None, "Expected postponed_event to be a dict, got None"

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
