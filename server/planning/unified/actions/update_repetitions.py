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


from superdesk.core import get_current_app
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML

from apps.item_lock.components.item_lock import LOCK_ACTION

from planning import signals
from planning.common import (
    remove_lock_information,
    WORKFLOW_STATE,
    POST_STATE,
    get_max_recurrent_events,
    set_original_creator,
    TO_BE_CONFIRMED_FIELD,
)
from planning.events.events_utils import (
    get_series,
    post_update_event_actions,
    pre_update_event_actions,
    remove_fields,
    set_planning_schedule,
    generate_recurring_dates,
)
from planning.types import UnifiedPlanningHistoryResource, UnifiedPlanningResource
from planning.types.unified import PlanningItemType
from planning.unified.actions.cancel import cancel_single_event, validate_states
from planning.unified.actions.reschedule import event_has_planning_items


def update_rules(event: dict[str, Any], updated_rules: dict[str, Any]):
    updates = {"dates": deepcopy(event["dates"])}
    updates["dates"]["recurring_rule"] = deepcopy(updated_rules)
    remove_lock_information(updates)
    return updates


async def cancel_event(event: dict[str, Any], updated_rule: dict[str, Any]):
    service = UnifiedPlanningResource.get_service()

    # If the Event is not in a valid state to Cancel, then we simply ignore this Event
    if not validate_states(event):
        return

    updates = update_rules(event, updated_rule)
    await cancel_single_event(updates, event)

    event_id = event[ID_FIELD]
    await service.system_update(event_id, updates)
    await signals.event_cancel.send(updates, {"_id": event_id})

    # If the event was posted we need to post the cancellation
    if event.get("pubstatus") in [POST_STATE.CANCELLED, POST_STATE.USABLE]:
        post = {
            "event": event[ID_FIELD],
            "etag": event["_etag"],
            "update_method": "single",
            "pubstatus": event.get("pubstatus"),
        }
        await get_resource_service("events_post").post_async([post])


async def delete_event(event: dict[str, Any], updated_rule: dict[str, Any]):
    events_service = get_resource_service("events")

    if event.get("pubstatus", None) is not None or await event_has_planning_items(event[ID_FIELD]):
        await cancel_event(event, updated_rule)
    else:
        await events_service.delete_action_async(lookup={"_id": event[ID_FIELD]})
        app = get_current_app().as_any()
        await app.on_deleted_item_events.call_async(event)


def create_event(date, updates: dict[str, Any], original: dict[str, Any], time_delta):
    # Create a copy of the metadata to use for the new event
    new_event = deepcopy(original)
    new_event.update(deepcopy(updates))

    # Remove fields not required by new events
    remove_fields(new_event, extra_fields=["reschedule_from", "pubstatus"])

    new_event["state"] = WORKFLOW_STATE.DRAFT
    for key in list(new_event.keys()):
        if (key.startswith("_") and key != TO_BE_CONFIRMED_FIELD) or key.startswith("lock_"):
            new_event.pop(key)

    # Set the new start and end dates, as well as the _id and guid fields
    new_event["dates"]["start"] = date
    new_event["dates"]["end"] = date + time_delta
    new_event[ID_FIELD] = new_event["guid"] = generate_guid(type=GUID_NEWSML)
    set_original_creator(new_event)
    set_planning_schedule(new_event)

    return new_event


async def update_event(updated_rule: dict[str, Any], original: dict[str, Any]):
    service = UnifiedPlanningResource.get_service()
    events_history_service = UnifiedPlanningHistoryResource.get_service()

    event_id = original[ID_FIELD]
    updates = update_rules(original, updated_rule)
    set_planning_schedule(updates)
    await service.system_update(event_id, updates)
    await events_history_service.on_update_repetitions(
        updates,
        event_id,
        "update_repetitions" if original.get(LOCK_ACTION) == "update_repetitions" else "update_repetitions_update",
    )


async def get_internal_series(original: dict[str, Any]) -> list:
    # Events & Planning share one collection now, so restrict the series to Events
    query = {"$and": [{"type": PlanningItemType.EVENT.value}, {"recurrence_id": original["recurrence_id"]}]}
    sort = '[("dates.start", 1)]'
    max_results = get_max_recurrent_events()

    events = []
    async for event in get_series(query, sort, max_results):
        event["dates"]["start"] = event["dates"]["start"]
        event["dates"]["end"] = event["dates"]["end"]
        events.append(event)

    return events


async def update_event_repetitions(updates: dict[str, Any], original: dict[str, Any]):
    events_service = get_resource_service("events")
    events_history_service = UnifiedPlanningHistoryResource.get_service()
    remove_lock_information(updates)

    updated_rule = deepcopy(updates["dates"]["recurring_rule"])
    original_rule = deepcopy(original["dates"]["recurring_rule"])

    existing_events = await get_internal_series(original)

    first_event = existing_events[0]
    new_dates = [
        date
        for date in generate_recurring_dates(
            start=first_event.get("dates", {}).get("start"),
            tz=updates["dates"].get("tz") and pytz.timezone(updates["dates"]["tz"] or ""),
            all_day=bool(updates["dates"].get("all_day")),
            **updated_rule,
        )
    ]

    original_dates = [
        date
        for date in generate_recurring_dates(
            start=first_event.get("dates", {}).get("start"),
            tz=original["dates"].get("tz") and pytz.timezone(original["dates"]["tz"] or ""),
            all_day=bool(original["dates"].get("all_day")),
            **original_rule,
        )
    ]

    # Compute the difference between start and end in the updated event
    time_delta = original["dates"]["end"] - original["dates"]["start"]

    deleted_events = {}
    new_events = []

    # Update the recurring rules for EVERY event in the series
    # Also if we're decreasing the length of the series, then
    # delete or mark the Event as cancelled.
    for event in existing_events:
        # if the event does not occur in the new dates, then we need to either
        # delete or cancel this event
        if event["dates"]["start"].replace(tzinfo=None) not in new_dates:
            deleted_events[event[ID_FIELD]] = event

        # Otherwise this Event does occur in the new dates
        # So just update the recurring_rule to match the new series recurring_rule
        else:
            await update_event(updated_rule, event)

    # Create new events that do not fall on the original series
    for date in new_dates:
        if date not in original_dates:
            new_events.append(create_event(date, updates, original, time_delta))

    # Now iterate over the new events and create them
    if new_events:
        await events_service.create_async(new_events)
        for event in new_events:
            await events_history_service.on_update_repetitions(event, event[ID_FIELD], "update_repetitions_create")

    for event in deleted_events.values():
        await delete_event(event, updated_rule)

    # if the original event was "posted" then post the new generated events
    if original.get("pubstatus") in [POST_STATE.CANCELLED, POST_STATE.USABLE]:
        post = {
            "event": original[ID_FIELD],
            "etag": original["_etag"],
            "update_method": "all",
            "pubstatus": original.get("pubstatus"),
            "repost_on_update": True,
        }
        await get_resource_service("events_post").post_async([post])


async def process_update_repetitions(
    updates: dict[str, Any], original: dict[str, Any], require_lock: bool = True
) -> dict[str, Any]:
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
    await pre_update_event_actions(updates, original, ACTION, require_lock)

    await update_event_repetitions(updates, original)

    updated_repetitions_event = await service.find_by_id(original[ID_FIELD])
    assert updated_repetitions_event is not None, "Expected updated_repetitions_event to be a dict, got None"

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return updated_repetitions_event.to_dict()
