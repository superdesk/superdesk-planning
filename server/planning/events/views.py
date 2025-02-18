from pydantic import BaseModel

from planning.events.events_service import EventsAsyncService
from planning.events.events_update_time import process_update_time
from planning.utils import get_json_or_400_async

from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response


blueprint = EndpointGroup("events", __name__)


class EventsArgs(BaseModel):
    event_id: str


@blueprint.endpoint(
    "/update_time/<string:event_id>", methods=["PATCH"], auth=[required_privilege_rule("planning_event_management")]
)
async def update_time(args: EventsArgs, params: None, request: Request) -> Response:
    original = await EventsAsyncService().find_by_id_raw(args.event_id)
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
