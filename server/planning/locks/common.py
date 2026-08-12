from quart_babel import gettext

from superdesk.errors import SuperdeskApiError
from superdesk.users.services import current_user_has_privilege

from planning.types import AssignmentEventOrPlanning, AssignmentResourceModel
from planning.types.unified import LockFields


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
