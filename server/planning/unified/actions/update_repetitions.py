# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Event update-repetitions logic (SDBELGA-1120).

Event-only action; relocated into the unified actions package. The internal
series lookup is now scoped to ``type == event`` so Planning items sharing a
``recurrence_id`` don't leak into the Event series (the shared ``unified_planning``
collection applies no implicit type filter), and the "has related planning"
check reads the unified index.
"""

import pytz
from copy import deepcopy
from typing import Any
from datetime import datetime, timezone

from quart_babel import gettext
from superdesk.core import get_current_app
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service

from planning.types import UnifiedPlanningHistoryResource, UnifiedPlanningResource, PostStates, WorkflowState
from planning import signals
from planning.common import remove_lock_information
from planning.events.events_utils import post_update_event_actions, pre_update_event_actions, set_planning_schedule
from planning.unified.common import get_series, generate_recurring_dates
from planning.unified.recurring_items import duplicate_event_for_series
from planning.unified.actions.cancel import cancel_single_event, validate_states
from planning.unified.actions.reschedule import event_has_planning_items


def _update_rules(original: UnifiedPlanningResource, updated_rules: dict[str, Any]) -> dict:
    return {
        "dates": {
            **original.dates.to_dict(),
            "recurring_rule": deepcopy(updated_rules),
        },
    }


async def cancel_event(event: UnifiedPlanningResource, updated_rule: dict[str, Any]):
    service = UnifiedPlanningResource.get_service()

    # If the Event is not in a valid state to Cancel, then we simply ignore this Event
    event_dict = event.to_dict()
    if not validate_states(event_dict):
        return

    updates = _update_rules(event, updated_rule)
    await cancel_single_event(updates, event_dict)

    await service.system_update(event.id, updates)
    await signals.event_cancel.send(updates, event_dict)

    # If the event was posted we need to post the cancellation
    if event.pubstatus in [PostStates.CANCELLED, PostStates.USABLE]:
        post = {
            "event": event.id,
            "etag": event.etag,
            "update_method": "single",
            "pubstatus": event.pubstatus,
        }
        await get_resource_service("events_post").post_async([post])


async def delete_event(event: UnifiedPlanningResource, updated_rule: dict[str, Any]):
    events_service = UnifiedPlanningResource.get_service()

    if event.pubstatus is not None or await event_has_planning_items(event.id):
        await cancel_event(event, updated_rule)
    else:
        await events_service.delete_many({"_id": event.id})
        app = get_current_app().as_any()
        await app.on_deleted_item_events.call_async(event.to_dict())


async def update_event(updated_rule: dict[str, Any], original: UnifiedPlanningResource):
    service = UnifiedPlanningResource.get_service()
    events_history_service = UnifiedPlanningHistoryResource.get_service()

    updates = _update_rules(original, updated_rule)
    set_planning_schedule(updates)
    await service.system_update(original.id, updates)
    await events_history_service.on_update_repetitions(
        updates,
        original.id,
        "update_repetitions" if original.lock_action == "update_repetitions" else "update_repetitions_update",
    )


async def update_event_repetitions(updates: dict[str, Any], original: UnifiedPlanningResource) -> None:
    remove_lock_information(updates)

    if not original.recurrence_id or not original.dates.recurring_rule:
        return

    updated_rule = deepcopy(updates["dates"]["recurring_rule"])
    existing_events = [event async for event in get_series(original.recurrence_id)]

    first_event = existing_events[0]
    new_dates = [
        (
            date
            if isinstance(date, datetime)
            else datetime(year=date.year, month=date.month, day=date.day, tzinfo=timezone.utc)
        )
        for date in generate_recurring_dates(
            start=first_event.dates.start,
            tz=updates["dates"].get("tz") and pytz.timezone(updates["dates"]["tz"] or ""),
            all_day=bool(updates["dates"].get("all_day")),
            **updated_rule,
        )
    ]

    original_dates = [
        date
        for date in generate_recurring_dates(
            start=first_event.dates.start,
            tz=pytz.timezone(original.dates.tz) if original.dates.tz else None,
            all_day=original.dates.all_day,
            **original.dates.recurring_rule.to_dict(),
        )
    ]

    # Compute the difference between start and end in the updated event
    time_delta = original.dates.end - original.dates.start

    deleted_events: dict[str, UnifiedPlanningResource] = {}
    new_events: list[UnifiedPlanningResource] = []

    # Update the recurring rules for EVERY event in the series
    # Also if we're decreasing the length of the series, then
    # delete or mark the Event as cancelled.
    for event in existing_events:
        # if the event does not occur in the new dates, then we need to either
        # delete or cancel this event
        if event.dates.start not in new_dates:
            deleted_events[event.id] = event

        # Otherwise this Event does occur in the new dates
        # So just update the recurring_rule to match the new series recurring_rule
        else:
            await update_event(updated_rule, event)

    # Create new events that do not fall on the original series
    for date in new_dates:
        if date not in original_dates:
            new_event = duplicate_event_for_series(original, date, date + time_delta, updates)
            new_event.state = WorkflowState.DRAFT
            new_events.append(new_event)

    # Now iterate over the new events and create them
    events_service = UnifiedPlanningResource.get_service()
    events_history_service = UnifiedPlanningHistoryResource.get_service()
    if new_events:
        # Don't run the `on_create` methods as it will try and create a new series here
        # Which is the same code path used when creating a series to begin with
        created_events = await events_service.create(new_events, skip_signals=True)
        await events_service.on_created(created_events)
        for event in created_events:
            await events_history_service.on_update_repetitions(event.to_dict(), event.id, "update_repetitions_create")

    for event in deleted_events.values():
        await delete_event(event, updated_rule)

    # if the original event was "posted" then post the new generated events
    if original.pubstatus in [PostStates.CANCELLED, PostStates.USABLE]:
        post = {
            "event": original.id,
            "etag": original.etag,
            "update_method": "all",
            "pubstatus": original.pubstatus,
            "repost_on_update": True,
        }
        await get_resource_service("events_post").post_async([post])


async def process_update_repetitions(
    updates: dict[str, Any], original: UnifiedPlanningResource, require_lock: bool = True
) -> UnifiedPlanningResource:
    """
    Processes updating event repetitions

    :param updates: The update payload from the client.
    :param original: The original event document.
    :param require_lock: Whether to enforce lock removal (default True).
    :return: The updated event document.
    """
    service = UnifiedPlanningResource.get_service()
    ACTION = "update_repetitions"

    # Perform pre update event actions
    original_dict = original.to_dict()
    await pre_update_event_actions(updates, original_dict, ACTION, require_lock)
    await update_event_repetitions(updates, original)

    updated_repetitions_event = await service.find_by_id(original.id)
    if updated_repetitions_event is None:
        raise SuperdeskApiError.internalError(gettext("Updated event not found"))

    # Perform post update actions
    await post_update_event_actions(updates, original_dict, ACTION, update_post=False)

    return updated_repetitions_event
