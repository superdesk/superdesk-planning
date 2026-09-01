import logging

from bson import ObjectId
from quart import request

from superdesk import get_resource_service
from superdesk.core import get_current_app
from superdesk.notification import push_notification

from planning.types import (
    AssignmentResourceModel,
    AssignmentEventOrPlanning,
    AssignmentWorkflowState,
    PlanningFeaturedLockResource,
)
from planning.types.unified import UnifiedPlanningResource
from planning import signals
from planning.common import get_item_type_name

from .common import validate_lock_permission, get_service_and_ids_for_locks, get_current_user_id, get_current_session_id

logger = logging.getLogger(__name__)


async def unlock_item[T: AssignmentEventOrPlanning](item: T) -> T:
    if await _existing_item_not_locked(item):
        return item

    request_id = request.headers.get("X-Request-Id") if request and getattr(request, "headers", None) else None
    client_id = request.args.get("clientId") if request else None
    current_user_id = get_current_user_id()
    current_session_id = get_current_session_id()
    logger.info(
        "planning:item_lock: unlock_requested resource=%s item=%s user=%s session=%s previous_lock_user=%s previous_lock_session=%s previous_lock_action=%s request_id=%s client_id=%s",
        item.item_type,
        item.id,
        current_user_id,
        current_session_id,
        item.lock_user,
        item.lock_session,
        item.lock_action,
        request_id,
        client_id,
    )

    await _validate_unlock_request(item)
    updated = await _remove_item_lock(item)

    logger.info(
        "planning:item_lock: unlock_applied resource=%s item=%s user=%s session=%s etag=%s request_id=%s",
        item.item_type,
        item.id,
        current_user_id,
        current_session_id,
        updated.etag or item.etag,
        request_id,
    )

    return updated


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
            user_id = get_current_user_id()
            if archive_item and user_id and archive_item.get("lock_user") == user_id:
                return True

    return item.lock_user is None and item.lock_session is None and item.lock_action is None


async def _validate_unlock_request(item: AssignmentEventOrPlanning) -> None:
    user_id = get_current_user_id()

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

    item_type_name = get_item_type_name(original)
    service, recurrence_id, related_event_ids = get_service_and_ids_for_locks(original)

    original_dict = original.to_dict()
    await getattr(app, f"on_unlock_{item_type_name}").call_async(original_dict, updates)
    await signals.on_item_unlock.send(original)

    updated = await service.update(original.id, updates, original=original, skip_signals=True)
    push_notification(
        f"{item_type_name}:unlock",
        item=original.id,
        user=str(original.lock_user),
        lock_session=(original.lock_session),
        etag=updated.etag,
        event_ids=related_event_ids,
        recurrence_id=recurrence_id,
        type=original.item_type,
        clientId=current_request.get_url_arg("clientId") if current_request else None,
    )

    await getattr(app, f"on_unlocked_{item_type_name}").call_async(updated.to_dict())
    await signals.on_item_unlocked.send(updated)

    return updated


async def _unlock_session_for_resource(
    user_id: ObjectId, session_id: ObjectId, is_last_session: bool, resource_model: type[AssignmentEventOrPlanning]
) -> None:
    logger.info(f"planning:item_lock: Unlocking {resource_model.model_resource_name} resources")
    service = resource_model.get_service()
    term_filter = {"lock_user": str(user_id)} if is_last_session else {"lock_session": str(session_id)}
    unlocked_count = 0
    async for item in await service.search({"query": {"bool": {"filter": {"term": term_filter}}}}):
        await unlock_item(item)
        unlocked_count += 1

    logger.info(
        "planning:item_lock: unlock_session_complete resource=%s user=%s session=%s is_last_session=%s unlocked_count=%s",
        resource_model.model_resource_name,
        user_id,
        session_id,
        is_last_session,
        unlocked_count,
    )


async def _unlock_featured_planning(user_id: ObjectId, session_id: ObjectId, is_last_session: bool) -> None:
    service = PlanningFeaturedLockResource.get_service()
    query = {"lock_user": user_id} if is_last_session else {"lock_session": session_id}
    count = await service.count(query, use_mongo=True)
    if count:
        await service.delete_many({})
