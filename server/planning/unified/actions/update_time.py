# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Event update-time logic (SDBELGA-1120).

Event-only action (Planning items have no schedule of their own); relocated into
the unified actions package for cohesion. Reads/writes ``unified_planning`` via
the ``events`` service proxy and uses the type-scoped recurring-series helpers.
"""

from typing import Any

from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service

from planning import signals
from planning.common import UPDATE_SINGLE, remove_lock_information
from planning.events.events_utils import (
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
    get_recurring_event_updates_iterator,
    set_planning_schedule,
)
from planning.types import PlanningSchedule


async def update_single_event(updates: dict[str, Any]):
    # Release the Lock on the selected Event
    remove_lock_information(updates)

    # Set '_planning_schedule' on the Event item
    updates["_planning_schedule"] = [PlanningSchedule(scheduled=updates["dates"].get("start")).to_dict()]


async def update_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    events_service = get_resource_service("events")

    # Release the Lock on the selected Event
    remove_lock_information(updates)

    async for event, new_updates in get_recurring_event_updates_iterator(original, updates, update_method):
        await events_service.patch_async(event[ID_FIELD], new_updates)
        await signals.event_time_updated.send(new_updates, {"_id": event[ID_FIELD]})


async def process_update_time(
    updates: dict[str, Any], original: dict[str, Any], require_lock: bool = True
) -> dict[str, Any]:
    """
    Processes the event time update, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :param require_lock: Whether to enforce lock removal (default True).
    :return: The updated event document.
    """
    events_service = get_resource_service("events")
    ACTION = "update_time"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION, require_lock)

    # Determine update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await update_single_event(updates)
    else:
        await update_recurring_events(updates, original, update_method)

    # Clean updates before persisting change
    updates.pop("update_method", None)
    updates.pop("skip_on_update", None)
    set_planning_schedule(updates)

    # Update the original event in the database
    await events_service.update_async(original[ID_FIELD], updates, original, skip_signals=True)

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    updated_event = await events_service.find_one_async(req=None, _id=original[ID_FIELD])
    assert updated_event is not None, "Expected updated_event to be a dict, got None"

    return updated_event
