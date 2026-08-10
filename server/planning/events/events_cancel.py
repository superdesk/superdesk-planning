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

from quart_babel import gettext as _

from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.planning.planning_history_async_service import PlanningHistoryAsyncService
from planning.types import EventsHistoryResourceModel
from superdesk.resource_fields import ID_FIELD
from superdesk.flask import request
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth

from planning.common import (
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    remove_lock_information,
    set_actioned_date_to_event,
)
from planning.utils import get_related_planning_for_events_async
from planning import signals


async def patch_related_event_as_cancelled(
    updates: dict[str, Any], original: dict[str, Any], notifications: list[dict[str, Any]]
):
    events_service = get_resource_service("events")
    events_history_service = EventsHistoryResourceModel.get_service()

    if not validate_states(original):
        # Don't raise exception for related events in series - simply ignore
        return

    id = original[ID_FIELD]
    updates["skip_on_update"] = True

    await events_service.patch_async(id, updates)
    updated_event = await events_service.find_one_async(req=None, _id=id)
    assert updated_event is not None, "Expected updated_event to be a dict, got None"
    await events_history_service.on_cancel(updated_event, original)

    notifications.append({"_id": id, "_etag": updated_event.get("_etag")})


def validate_states(event: dict[str, Any]):
    if event.get("state") not in [
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.SCHEDULED,
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.KILLED,
        WORKFLOW_STATE.POSTPONED,
    ]:
        return False

    return True


async def cancel_event_plannings(updates: dict[str, Any], original: dict[str, Any]):
    planning_cancel_service = get_resource_service("planning_cancel")
    planning_history_service = PlanningHistoryAsyncService()
    reason = updates.get("reason", None)

    for plan in await get_related_planning_for_events_async([original[ID_FIELD]], "primary"):
        if plan.get("state") != WORKFLOW_STATE.CANCELLED:
            request.view_args["event_cancellation"] = True
            cancelled_plan = await planning_cancel_service.patch_async(plan[ID_FIELD], {"reason": reason})

            # Write history records
            await planning_history_service.on_cancel(cancelled_plan, plan)


def set_event_cancelled(updates: dict[str, Any], original: dict[str, Any], occur_cancel_state):
    if not validate_states(original):
        raise SuperdeskApiError.badRequestError(_("Event not in valid state for cancellation"))

    remove_lock_information(updates)
    updates.update(
        {
            "state": WORKFLOW_STATE.CANCELLED,
            "occur_status": occur_cancel_state,
            "state_reason": updates.get("reason"),
        }
    )
    set_actioned_date_to_event(updates, original)


async def get_cancel_state():
    eocstat_map = await get_resource_service("vocabularies").find_one_async(req=None, _id="eventoccurstatus")
    occur_cancel_state = [x for x in eocstat_map.get("items", []) if x["qcode"] == "eocstat:eos6"][0]
    occur_cancel_state.pop("is_active", None)
    return occur_cancel_state


async def cancel_single_event(updates: dict[str, Any], original: dict[str, Any]):
    occur_cancel_state = await get_cancel_state()
    set_event_cancelled(updates, original, occur_cancel_state)
    await cancel_event_plannings(updates, original)


async def cancel_recurring_event(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    occur_cancel_state = await get_cancel_state()
    historic, past, future = await get_recurring_timeline(original, postponed=True)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        cancelled_events = future
    else:
        cancelled_events = past + future

    set_event_cancelled(updates, original, occur_cancel_state)

    notifications: list = []

    for event in cancelled_events:
        new_updates = deepcopy(updates)
        await cancel_event_plannings(new_updates, event)
        await patch_related_event_as_cancelled(new_updates, event, notifications)

    await cancel_event_plannings(updates, original)
    updates["_cancelled_events"] = notifications


async def process_cancel_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event cancel, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    events_service = get_resource_service("events")
    ACTION = "cancel"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION)

    # Determin update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await cancel_single_event(updates, original)
    else:
        await cancel_recurring_event(updates, original, update_method)

    # Clean updates before persisting change
    reason = updates.pop("reason", None)
    cancelled_items = updates.pop("_cancelled_events", [])
    updates.pop("update_method", None)
    updates.pop("skip_on_update", None)

    # Update the original event in the database
    event_id = original[ID_FIELD]
    await events_service.update_async(event_id, updates, original, skip_signals=True)
    await signals.event_cancel.send(updates, original)
    canceled_event = await events_service.find_one_async(req=None, _id=event_id)
    assert canceled_event is not None, "Expected canceled_event to be a dict, got None"

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "events:cancel",
        item=str(event_id),
        user=str(user),
        session=str(session),
        occur_status=updates.get("occur_status"),
        etag=canceled_event.get("_etag"),
        cancelled_items=cancelled_items,
        reason=reason or "",
        actioned_date=updates.get("actioned_date"),
    )

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return canceled_event
