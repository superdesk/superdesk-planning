from typing import cast
from quart_babel import gettext

from superdesk.core.types import Request, Response
from superdesk.core.web import EndpointGroup
from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.resource_fields import STATUS, STATUS_OK
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow

from planning.types import PlanningFeaturedLockResource, AssignmentEventOrPlanning, AssignmentResourceModel
from planning.types.unified import UnifiedPlanningResource, LockFields, PlanningItemType
from planning.unified.common import get_related_planning_for_events, format_item_addresses
from planning.common import get_hateoas_links

from .common import get_current_session_id, get_current_user_id
from .lock import lock_item
from .unlock import unlock_item
from .get_locks import PlanningLocksParams, get_planning_module_locks


planning_lock_endpoints = EndpointGroup("planning_locks", __name__)


@planning_lock_endpoints.endpoint("planning/<string:item_id>/lock", name="planning_lock", methods=["POST"])
async def lock_planning_endpoint(request: Request) -> Response:
    item, lock_data = await _get_lock_data_from_request(request, UnifiedPlanningResource)
    updated = await lock_item(item, lock_data)
    await _enhance_item_for_response(updated)
    response = updated.to_dict()
    response.update(
        {
            STATUS: STATUS_OK,
            "_links": get_hateoas_links(updated),
        }
    )

    return Response(response, status_code=201)


@planning_lock_endpoints.endpoint("assignments/<string:item_id>/lock", name="assignments_lock", methods=["POST"])
async def lock_assignment_endpoint(request: Request) -> Response:
    item, lock_data = await _get_lock_data_from_request(request, AssignmentResourceModel)
    updated = await lock_item(item, lock_data)
    response = updated.to_dict()
    response.update(
        {
            STATUS: STATUS_OK,
            "_links": get_hateoas_links(updated),
        }
    )
    return Response(response, status_code=201)


@planning_lock_endpoints.endpoint("planning/<string:item_id>/unlock", name="planning_unlock", methods=["POST"])
async def unlock_planning_endpoint(request: Request) -> Response:
    item = await _get_item_from_request(request, UnifiedPlanningResource)
    updated = await unlock_item(item)
    await _enhance_item_for_response(updated)
    response = updated.to_dict()
    response.update(
        {
            STATUS: STATUS_OK,
            "_links": get_hateoas_links(updated),
        }
    )
    return Response(response, status_code=201)


@planning_lock_endpoints.endpoint("assignments/<string:item_id>/unlock", name="assignments_unlock", methods=["POST"])
async def unlock_assignment_endpoint(request: Request) -> Response:
    item = await _get_item_from_request(request, AssignmentResourceModel)
    updated = await unlock_item(item)
    response = updated.to_dict()
    response.update(
        {
            STATUS: STATUS_OK,
            "_links": get_hateoas_links(updated),
        }
    )
    return Response(response, status_code=201)


@planning_lock_endpoints.endpoint("planning_locks", name="get_planning_locks", methods=["GET"])
async def get_locks_endpoint(_: None, params: PlanningLocksParams, _r: None) -> Response:
    current_locks: dict = cast(dict, await get_planning_module_locks(params.repos))
    current_locks[STATUS] = STATUS_OK
    return Response(current_locks)


@planning_lock_endpoints.endpoint(
    "planning_featured_lock",
    name="planning_featured_lock",
    methods=["POST"],
    auth=[required_privilege_rule("planning")],
)
async def lock_featured_planning_endpoint() -> Response:
    docs = await PlanningFeaturedLockResource.get_service().create([{}])
    response = docs[0].to_dict()
    response.update(
        {
            STATUS: STATUS_OK,
            "_links": {"self": {"title": "Planning Featured Lock", "href": f"/planning_featured_lock/{docs[0].id}"}},
        }
    )
    return Response(response, status_code=201)


@planning_lock_endpoints.endpoint(
    "planning_featured_unlock",
    name="planning_featured_unlock",
    methods=["POST"],
    auth=[required_privilege_rule("planning")],
)
async def unlock_featured_planning_endpoint() -> Response:
    await PlanningFeaturedLockResource.get_service().delete_many({})
    return Response({"_id": "featured_unlock", STATUS: STATUS_OK}, status_code=201)


async def _get_item_from_request[T: AssignmentEventOrPlanning](request: Request, resource_model: type[T]) -> T:
    item_id = request.get_view_args("item_id")
    if not item_id:
        raise SuperdeskApiError.badRequestError(gettext("Item ID is required"))

    item = await resource_model.get_service().find_by_id(item_id)
    if not item:
        raise SuperdeskApiError.notFoundError(gettext("Item not found"))

    return item


async def _get_lock_data_from_request[T: AssignmentEventOrPlanning](
    request: Request, resource_model: type[T]
) -> tuple[T, LockFields]:
    user_id = get_current_user_id(required=True)
    session_id = get_current_session_id()

    request_body = await request.get_json()
    if not isinstance(request_body, dict):
        raise SuperdeskApiError.badRequestError(gettext("Invalid request body"))
    elif not request_body.get("lock_action"):
        raise SuperdeskApiError.badRequestError(gettext("Lock action is required"))

    item = await _get_item_from_request(request, resource_model)
    lock_data = LockFields(
        lock_action=request_body["lock_action"],
        lock_session=session_id,
        lock_user=user_id,
        lock_time=utcnow(),
    )

    return item, lock_data


async def _enhance_item_for_response(item: UnifiedPlanningResource) -> None:
    if item.item_type != PlanningItemType.EVENT:
        return

    cursor = await get_related_planning_for_events([item.id], projection=["_id"])
    planning_ids = [plan.id async for plan in cursor]
    if len(planning_ids):
        item.planning_ids = planning_ids

    format_item_addresses(item)

    # this is to fix the existing events have original creator as empty string
    if not item.original_creator:
        item.original_creator = None
