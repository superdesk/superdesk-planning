from pydantic import BaseModel

from superdesk import get_resource_service
from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response

from planning.unified.actions import process_spike, process_unspike, process_duplicate, process_postpone
from planning.utils import get_json_or_400_async


planning_endpoint_group: EndpointGroup = EndpointGroup("planning", __name__)


class PlanningArgs(BaseModel):
    planning_id: str


@planning_endpoint_group.endpoint(
    "planning/spike/<string:planning_id>",
    name="planning_spike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_planning_spike")],
)
async def spike_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("planning").find_one_async(req=None, _id=args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    updates = await get_json_or_400_async(request)
    spiked_planning_item = await process_spike(updates, original)

    return Response(spiked_planning_item)


@planning_endpoint_group.endpoint(
    "planning/unspike/<string:planning_id>",
    name="planning_unspike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_planning_unspike")],
)
async def unspike_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("planning").find_one_async(req=None, _id=args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    updates = await get_json_or_400_async(request)
    unspiked_planning_item = await process_unspike(updates, original)

    return Response(unspiked_planning_item)


@planning_endpoint_group.endpoint(
    "planning/<string:planning_id>/duplicate",
    name="planning_duplicate",
    methods=["POST"],
    auth=[required_privilege_rule("planning_planning_management")],
)
async def duplicate_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("planning").find_one_async(req=None, _id=args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    duplicated_planning_item = await process_duplicate(original)

    duplicated_planning_item["_status"] = "OK"
    return Response(duplicated_planning_item)


@planning_endpoint_group.endpoint(
    "planning/postpone/<string:planning_id>",
    name="planning_postpone",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_planning_management")],
)
async def postpone_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await get_resource_service("planning").find_one_async(req=None, _id=args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    updates = await get_json_or_400_async(request)
    postponed_planning_item = await process_postpone(updates, original)

    return Response(postponed_planning_item)
