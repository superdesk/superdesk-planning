from copy import deepcopy
from datetime import date, datetime
from pydantic import BaseModel
from typing import Any

from planning.common import UPDATE_FUTURE, UPDATE_SINGLE, TO_BE_CONFIRMED_FIELD, remove_lock_information
from planning.events.events_service import EventsAsyncService
from planning.events.events_utils import get_recurring_timeline
from planning.types.common import PlanningSchedule
from planning.utils import get_json_or_400_async

from superdesk.core import get_current_app
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response
from superdesk.resource_fields import ID_FIELD
from superdesk.utc import local_to_utc, utc_to_local


blueprint = EndpointGroup("events", __name__)


class EventsArgs(BaseModel):
    event_id: str


async def update_single_event(updates: dict[str, Any]):
    # Release the Lock on the selected Event
    remove_lock_information(updates)

    # Set '_planning_schedule' on the Event item
    updates["_planning_schedule"] = [PlanningSchedule(scheduled=updates["dates"].get("start"))]


async def update_recurring_events(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    events_service = EventsAsyncService()
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

    app = get_current_app().as_any()
    for event in new_series:
        if not event.get(ID_FIELD):
            continue

        new_updates = {"dates": deepcopy(event["dates"])} if event.get(ID_FIELD) != original.get(ID_FIELD) else updates

        # Calculate midnight in local time for this occurrence
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
            app.on_updated_events_update_time(new_updates, {"_id": event[ID_FIELD]})


@blueprint.endpoint(
    "/update_time/<string:event_id>", methods=["PATCH"], auth=[]
)  # TODO: Confirm on auth_rules in planning module
async def update_time(args: EventsArgs, params: None, request: Request) -> Response:
    events_service = EventsAsyncService()

    original = await events_service.find_by_id_raw(args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)

    # Validate the data from the request
    if not updates.get("dates") and not updates.get("_timeToBeConfirmed"):
        await request.abort(400, "No new time was provided")
    elif not updates["dates"].get("start"):
        await request.abort(400, "No start time was provided")
    elif not updates["dates"].get("end"):
        await request.abort(400, "No end time was provided")

    # Determine update method, ensuring non-recurring events use UPDATE_SINGLE
    update_method = updates.pop("update_method", UPDATE_SINGLE)
    if not original.get("dates", {}).get("recurring_rule"):
        update_method = UPDATE_SINGLE

    if update_method == UPDATE_SINGLE:
        await update_single_event(updates)
    else:
        await update_recurring_events(updates, original, update_method)

    updates.pop("update_method", None)

    # Update the original event in the database
    await events_service.update(original[ID_FIELD], updates)
    updated_event = await events_service.find_by_id_raw(original[ID_FIELD])

    return Response(updated_event)
