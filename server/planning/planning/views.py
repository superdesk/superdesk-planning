from pydantic import BaseModel

from planning.planning import PlanningAsyncService
from planning.planning.planning_spike_async import process_spike_planning_item, process_unspike_planning_item
from planning.planning.planning_duplicate import process_planning_item_duplicate
from planning.utils import get_json_or_400_async

from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Request, Response


planning_views_endpoints: EndpointGroup = EndpointGroup("planning_views", __name__)


class PlanningArgs(BaseModel):
    planning_id: str


@planning_views_endpoints.endpoint(
    "planning/spike/<string:planning_id>",
    name="planning_spike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_planning_spike")],
)
async def spike_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await PlanningAsyncService().find_by_id_raw(args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    updates = await get_json_or_400_async(request)
    spiked_planning_item = await process_spike_planning_item(updates, original)

    return Response(spiked_planning_item)


@planning_views_endpoints.endpoint(
    "planning/unspike/<string:planning_id>",
    name="planning_unspike",
    methods=["PATCH"],
    auth=[required_privilege_rule("planning_planning_unspike")],
)
async def unspike_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await PlanningAsyncService().find_by_id_raw(args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    updates = await get_json_or_400_async(request)
    unspiked_planning_item = await process_unspike_planning_item(updates, original)

    return Response(unspiked_planning_item)


@planning_views_endpoints.endpoint(
    "planning/<string:planning_id>/duplicate",
    name="planning_duplicate",
    methods=["POST"],
    auth=[required_privilege_rule("planning_planning_management")],
)
async def duplicate_planning_item(args: PlanningArgs, params: None, request: Request) -> Response:
    original = await PlanningAsyncService().find_by_id_raw(args.planning_id)
    if not original:
        await request.abort(404, "Planning Item not found")

    duplicated_planning_item = await process_planning_item_duplicate(original)

    return Response(duplicated_planning_item)
