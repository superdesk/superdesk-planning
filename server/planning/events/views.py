from pydantic import BaseModel
from eve_elastic.elastic import parse_date

from planning.events.events_cancel import process_cancel_event
from planning.events.events_reschedule import process_reschedule_event
from planning.events.events_update_repetitions import process_update_repetitions
from planning.events.events_update_time import process_update_time
from planning.events.events_spike import process_spike_event, process_unspike_event
from planning.events.events_postpone import process_postpone_event
from planning.utils import get_json_or_400_async

from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response
from superdesk import get_resource_service


events_endpoints_group: EndpointGroup = EndpointGroup("events", __name__)


class EventsArgs(BaseModel):
    event_id: str


@events_endpoints_group.endpoint(
    "events/update_time/<string:event_id>",
    name="events_update_time",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_management")],
)
async def update_time(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
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

    updated_event = await process_update_time(updates, original)

    return Response(updated_event)


@events_endpoints_group.endpoint(
    "events/spike/<string:event_id>",
    name="events_spike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_spike")],
)
async def spike_event(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)
    spiked_event = await process_spike_event(updates, original)

    return Response(spiked_event)


@events_endpoints_group.endpoint(
    "events/unspike/<string:event_id>",
    name="events_unspike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_unspike")],
)
async def unspike_event(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)
    unspiked_event = await process_unspike_event(updates, original)

    return Response(unspiked_event)


@events_endpoints_group.endpoint(
    "events/postpone/<string:event_id>",
    name="events_postpone",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_management")],
)
async def postpone_event(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)
    postponed_event = await process_postpone_event(updates, original)

    return Response(postponed_event)


@events_endpoints_group.endpoint(
    "events/cancel/<string:event_id>",
    name="events_cancel",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_management")],
)
async def cancel_event(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)
    cancelled_event = await process_cancel_event(updates, original)

    return Response(cancelled_event)


@events_endpoints_group.endpoint(
    "events/reschedule/<string:event_id>",
    name="events_reschedule",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_management")],
)
async def reschedule_event(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)

    # Make sure date-time strings are converted to datetime instances
    # Using Eve-Elastic's ``parse_date`` because it handles many different date/time formats
    updates["dates"]["start"] = parse_date(updates["dates"]["start"])
    updates["dates"]["end"] = parse_date(updates["dates"]["end"])

    rescheduled_event = await process_reschedule_event(updates, original)

    return Response(rescheduled_event)


@events_endpoints_group.endpoint(
    "events/update_repetitions/<string:event_id>",
    name="events_update_repetitions",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_event_management")],
)
async def update_repetitions(args: EventsArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("events").find_one_async(req=None, _id=args.event_id)
    if not original:
        await request.abort(404, "Event not found")

    updates = await get_json_or_400_async(request)

    # Validate the data from the request
    if not updates.get("dates", {}).get("recurring_rule"):
        await request.abort(400, "New recurring rules not provided")
    elif not original.get("recurrence_id"):
        await request.abort(400, "Not a series of recurring events")

    updated_repetitions_event = await process_update_repetitions(updates, original)

    return Response(updated_repetitions_event)
