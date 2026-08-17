from bson import ObjectId
from quart_babel import gettext

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_auth
from superdesk.utc import utcnow

from planning.types import AssignmentResourceModel
from planning.types.unified import LockFields
from planning.assignments.utils import get_assignment_from_content_dict

from .lock import lock_item
from .unlock import unlock_item


__all__ = [
    "validate_assignment_lock",
    "sync_content_lock_to_assignment",
    "sync_content_unlock_to_assignment",
]


async def validate_assignment_lock(item: dict, user_id: ObjectId) -> None:
    assignment = await get_assignment_from_content_dict(item)
    if not assignment:
        return

    try:
        current_session_id = get_auth()["_id"]
    except KeyError:
        # This must not be from a web request
        return

    if (
        assignment
        and assignment.lock_user
        and assignment.lock_action != "content_edit"
        and (assignment.lock_session != current_session_id or assignment.lock_user != user_id)
    ):
        raise SuperdeskApiError.badRequestError(gettext("Lock Failed: Related assignment is locked."))


async def sync_content_lock_to_assignment(item: dict, user_id: ObjectId) -> None:
    assignment = await get_assignment_from_content_dict(item)
    if not assignment or (assignment.planning and assignment.planning.multiple_content is True):
        # Either no Assignment is linked to this content, or it has `multiple_content` enabled
        # in which case there is no lock data to sync
        return

    archive_service = get_resource_service("archive")
    if not item.get("rewrite_of") or await archive_service.count_async({"assignment_id": assignment.id}) <= 1:
        lock_data = LockFields(
            lock_user=user_id or item.get("version_creator"),
            lock_action="content_edit",
            lock_time=item.get("lock_time") or utcnow(),
        )
        await lock_item(assignment, lock_data)


async def sync_content_unlock_to_assignment(item: dict, user_id: ObjectId) -> None:
    assignment = await get_assignment_from_content_dict(item)
    if not assignment or (assignment.planning and assignment.planning.multiple_content is True):
        # Either no Assignment is linked to this content, or it has `multiple_content` enabled
        # in which case there is no lock data to sync
        return
    elif assignment.lock_user and assignment.lock_action == "content_edit":
        await unlock_item(assignment)
