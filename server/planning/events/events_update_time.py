from copy import deepcopy
from typing import Any
from datetime import date, datetime

from apps.auth import get_user_id
from superdesk.utc import local_to_utc, utc_to_local
from superdesk.resource_fields import ID_FIELD

from planning import signals
from planning.common import (
    TO_BE_CONFIRMED_FIELD,
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    remove_lock_information,
    set_ingested_event_state,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    post_update_event_actions,
    validate_event_action,
)
from planning.types import PlanningSchedule, EventResourceModel


async def update_single_event(updates: dict[str, Any]):
    # Release the Lock on the selected Event
    remove_lock_information(updates)

    # Set '_planning_schedule' on the Event item
    updates["_planning_schedule"] = [PlanningSchedule(scheduled=updates["dates"].get("start"))]


async def update_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    events_service = EventResourceModel.get_service()
    historic, past, future = await get_recurring_timeline(original)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        new_series = [original] + future
    else:
        new_series = past + [original] + future

    # Release the Lock on the selected Event
    remove_lock_information(updates)

    # Get the timezone from the original Event (as the series was created with that timezone in mind)
    timezone = original["dates"]["tz"]

    # First find the hour and minute of the start date in local time
    start_time = utc_to_local(timezone, updates["dates"]["start"]).time()

    # Next convert that to seconds since midnight (which gives us a timedelta instance)
    delta_since_midnight = datetime.combine(date.min, start_time) - datetime.min

    # And calculate the new duration of the events
    duration = updates["dates"]["end"] - updates["dates"]["start"]

    for event in new_series:
        if not event.get(ID_FIELD):
            continue

        new_updates = {"dates": deepcopy(event["dates"])} if event.get(ID_FIELD) != original.get(ID_FIELD) else updates

        # Calculate midnight in local time for this occurrence
        event["dates"]["start"] = datetime.fromisoformat(event["dates"]["start"])
        start_of_day_local = utc_to_local(timezone, event["dates"]["start"]).replace(hour=0, minute=0, second=0)

        # Then convert midnight in local time to UTC
        start_date_time = local_to_utc(timezone, start_of_day_local)

        # Finally add the delta since midnight
        start_date_time += delta_since_midnight

        # Set the new start and end times
        new_updates["dates"]["start"] = start_date_time
        new_updates["dates"]["end"] = start_date_time + duration

        if event.get(TO_BE_CONFIRMED_FIELD):
            new_updates[TO_BE_CONFIRMED_FIELD] = False

        # Set '_planning_schedule' on the Event item
        new_updates["_planning_schedule"] = [PlanningSchedule(scheduled=new_updates["dates"].get("start"))]

        if event.get(ID_FIELD) != original.get(ID_FIELD):
            new_updates["skip_on_update"] = True
            await events_service.update(event[ID_FIELD], new_updates)
            await signals.event_time_updated(new_updates, {"_id": event[ID_FIELD]})


async def process_update_time(
    updates: dict[str, Any], original: dict[str, Any], require_lock: bool = True
) -> dict[str, Any] | None:
    """
    Processes the event time update, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :param require_lock: Whether to enforce lock removal (default True).
    :return: The updated event document.
    """
    events_service = EventResourceModel.get_service()

    # Set version_creator and update ingested state
    user_id = get_user_id()
    if user_id:
        updates["version_creator"] = user_id
        set_ingested_event_state(updates, original)

    # Perform additional validation for event action
    validate_event_action(updates, original, require_lock)

    # Determine update method, ensuring non-recurring events use UPDATE_SINGLE
    update_method = updates.pop("update_method", UPDATE_SINGLE)
    if not original.get("dates", {}).get("recurring_rule"):
        update_method = UPDATE_SINGLE

    if update_method == UPDATE_SINGLE:
        await update_single_event(updates)
    else:
        await update_recurring_events(updates, original, update_method)

    # Clean updates before persisting change
    updates.pop("update_method", None)
    updates.pop("skip_on_update", None)

    # Update the original event in the database
    await events_service.update(original[ID_FIELD], updates)

    # Perform post update actions
    post_update_event_actions(updates, original)

    updated_event = await events_service.find_by_id_raw(original[ID_FIELD])
    return updated_event
