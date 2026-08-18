from pydantic import BaseModel
from quart_babel import gettext
from eve_elastic.elastic import parse_date

from planning.events.events_cancel import process_cancel_event
from planning.events.events_reschedule import process_reschedule_event
from planning.events.events_update_repetitions import process_update_repetitions
from planning.events.events_update_time import process_update_time
from planning.unified.actions import process_spike, process_unspike, process_postpone
from planning.utils import get_json_or_400_async

from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError


events_endpoints_group: EndpointGroup = EndpointGroup("events", __name__)


class EventsArgs(BaseModel):
    event_id: str


def _set_item_datetimes(data: dict) -> None:
    """Convert strings to datetime instance where applicable.

    Uses Eve-Elastic's ``parse_date`` because it handles many different date/time formats
    """

    if data["dates"].get("start"):
        data["dates"]["start"] = parse_date(data["dates"]["start"])
    if data["dates"].get("end"):
        data["dates"]["end"] = parse_date(data["dates"]["end"])
    if data["dates"].get("recurring_rule") and data["dates"]["recurring_rule"].get("until"):
        data["dates"]["recurring_rule"]["until"] = parse_date(data["dates"]["recurring_rule"]["until"])


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

    _set_item_datetimes(updates)
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
    spiked_event = await process_spike(updates, original)

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
    unspiked_event = await process_unspike(updates, original)

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
    postponed_event = await process_postpone(updates, original)

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
    _set_item_datetimes(updates)
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
        raise SuperdeskApiError.badRequestError(gettext("New recurring rules not provided"))
    elif not original.get("recurrence_id"):
        raise SuperdeskApiError.badRequestError(gettext("Not a series of recurring events"))

    _set_item_datetimes(updates)
    updated_repetitions_event = await process_update_repetitions(updates, original)

    return Response(updated_repetitions_event)
