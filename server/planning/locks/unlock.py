import logging

from bson import ObjectId

from superdesk import get_resource_service
from superdesk.core import get_current_app
from superdesk.notification import push_notification

from apps.archive.common import get_user

from planning.types import (
    AssignmentResourceModel,
    AssignmentEventOrPlanning,
    AssignmentWorkflowState,
    PlanningFeaturedLockResource,
)
from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning import signals
from planning.unified.common import get_related_event_ids

from .common import validate_lock_permission

logger = logging.getLogger(__name__)


async def unlock_item[T: AssignmentEventOrPlanning](item: T) -> T:
    if await _existing_item_not_locked(item):
        return item

    await _validate_unlock_request(item)
    return await _remove_item_lock(item)


async def unlock_session(user_id: ObjectId, session_id: ObjectId, is_last_session: bool):
    logger.info(f"planning:item_lock: Unlocking session {session_id}")
    await _unlock_session_for_resource(user_id, session_id, is_last_session, UnifiedPlanningResource)
    await _unlock_session_for_resource(user_id, session_id, is_last_session, AssignmentResourceModel)
    await _unlock_featured_planning(user_id, session_id, is_last_session)


async def _existing_item_not_locked(item: AssignmentEventOrPlanning) -> bool:
    if isinstance(item, AssignmentResourceModel):
        # If this is an Assignment, then first check if the associated archive item is locked by this user
        if item.assigned_to and item.assigned_to.state == AssignmentWorkflowState.IN_PROGRESS:
            archive_item = await get_resource_service("archive").find_one_async(req=None, assignment_id=item.id)
            try:
                user_id = get_user()["_id"]
            except KeyError:
                user_id = None
            if archive_item and user_id and archive_item.get("lock_user") == user_id:
                return False

    return item.lock_user is None and item.lock_session is None and item.lock_action is None


async def _validate_unlock_request(item: AssignmentEventOrPlanning) -> None:
    try:
        user_id = get_user()["_id"]
    except KeyError:
        user_id = None

    if user_id and item.lock_user == user_id:
        # The user is allowed to unlock any item they currently hold a lock on
        return

    validate_lock_permission(item, item)


async def _remove_item_lock[T: AssignmentEventOrPlanning](original: T) -> T:
    app = get_current_app()
    current_request = app.get_current_request()

    if isinstance(original, UnifiedPlanningResource):
        service = UnifiedPlanningResource.get_service()
    else:
        service = AssignmentResourceModel.get_service()

    updates = {
        "lock_user": None,
        "lock_session": None,
        "lock_time": None,
        "lock_action": None,
    }

    item_type = "events" if original.item_type == PlanningItemType.EVENT else original.item_type
    original_dict = original.to_dict()
    await getattr(app, f"on_unlock_{item_type}").call_async(original_dict, updates)
    await signals.on_item_unlock.send(original)

    updated = await service.update(original.id, updates, original=original, skip_signals=True)
    push_notification(
        f"{item_type}:unlock",
        item=original.id,
        user=str(original.lock_user),
        lock_session=(original.lock_session),
        etag=updated.etag,
        event_ids=get_related_event_ids(original),
        recurrence_id=original.recurrence_id,
        type=original.item_type,
        clientId=current_request.get_url_arg("clientId") if current_request else None,
    )

    await getattr(app, f"on_unlocked_{item_type}").call_async(updated.to_dict())
    await signals.on_item_unlocked.send(updated)

    return updated


async def _unlock_session_for_resource(
    user_id: ObjectId, session_id: ObjectId, is_last_session: bool, resource_model: type[AssignmentEventOrPlanning]
) -> None:
    logger.info(f"planning:item_lock: Unlocking {resource_model.model_resource_name} resources")
    service = resource_model.get_service()
    term_filter = {"lock_user": str(user_id)} if is_last_session else {"lock_session": str(session_id)}
    async for item in await service.search({"query": {"bool": {"filter": {"term": term_filter}}}}):
        await unlock_item(item)


async def _unlock_featured_planning(user_id: ObjectId, session_id: ObjectId, is_last_session: bool) -> None:
    service = PlanningFeaturedLockResource.get_service()
    query = {"lock_user": str(user_id)} if is_last_session else {"lock_session": str(session_id)}
    count = await service.count(query, use_mongo=True)
    if count:
        await service.delete_many({})
