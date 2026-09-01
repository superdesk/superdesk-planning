from quart_babel import gettext
from bson import ObjectId

from superdesk.core.resources import AsyncResourceService
from superdesk.errors import SuperdeskApiError
from superdesk.users.services import current_user_has_privilege

from apps.auth import get_user, get_auth

from planning.types import AssignmentEventOrPlanning, AssignmentResourceModel, UnifiedPlanningResource
from planning.types.unified import LockFields
from planning.unified.common import get_related_event_ids


def validate_lock_permission(item: AssignmentEventOrPlanning, lock_data: LockFields) -> None:
    lock_name: str
    if isinstance(item, AssignmentResourceModel):
        if lock_data.lock_action in ("start_working", "content_edit", "reassign", "complete", "revert"):
            lock_name = "archive"
        else:
            lock_name = "planning_planning_management"
    else:
        lock_name = f"planning_{item.item_type.value}_management"

    if not current_user_has_privilege(lock_name):
        raise SuperdeskApiError.forbiddenError(gettext("User does not have sufficient permissions."))


def get_service_and_ids_for_locks(
    item: AssignmentEventOrPlanning,
) -> tuple[AsyncResourceService, str | None, list[str]]:
    if isinstance(item, UnifiedPlanningResource):
        return UnifiedPlanningResource.get_service(), item.recurrence_id, get_related_event_ids(item)
    else:
        return AssignmentResourceModel.get_service(), None, []


def get_current_user_id(required: bool = False) -> ObjectId | None:
    try:
        return get_user(required)["_id"]
    except KeyError:
        return None


def get_current_session_id() -> ObjectId | None:
    try:
        return get_auth()["_id"]
    except KeyError:
        return None
