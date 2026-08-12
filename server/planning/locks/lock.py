from collections.abc import Iterator
from contextlib import contextmanager

from quart_babel import gettext

from superdesk import get_resource_service
from superdesk.core import get_current_app
from superdesk.errors import SuperdeskApiError
from superdesk.lock import lock, unlock
from superdesk.notification import push_notification
from superdesk.utc import utcnow

from apps.archive.common import get_user, get_auth

from planning.types import AssignmentResourceModel, AssignmentEventOrPlanning, AssignmentWorkflowState, WorkflowState
from planning.types.unified import UnifiedPlanningResource, LockFields, RelatedEventLinkType, PlanningItemType
from planning.unified.common import (
    get_first_related_event_id,
    get_all_items_in_relationship,
    get_related_event_ids,
)
from planning import signals

from .common import validate_lock_permission

__all__ = ["lock_item"]


async def lock_item[T: AssignmentEventOrPlanning](item: T, lock_data: LockFields) -> T:
    lock_data.lock_time = lock_data.lock_time or utcnow()

    if not lock_data.lock_user:
        try:
            lock_data.lock_user = get_user()["_id"]
        except KeyError:
            # This must not be from a web request
            lock_data.lock_user = None

    if not lock_data.lock_session:
        try:
            lock_data.lock_session = get_auth()["_id"]
        except KeyError:
            # This must not be from a web request
            lock_data.lock_session = None

    if _existing_lock_is_unchanged(item, lock_data):
        # No need to lock the item for this user, session and action
        # as it is already locked for such a purpose
        return item

    await _validate_lock_request(item, lock_data)
    return await _update_item_lock(item, lock_data)


def _existing_lock_is_unchanged(item: AssignmentEventOrPlanning, lock_data: LockFields) -> bool:
    return (
        item.lock_user == lock_data.lock_user
        and item.lock_session == lock_data.lock_session
        and item.lock_action == lock_data.lock_action
    )


async def _validate_lock_request(item: AssignmentEventOrPlanning, lock_data: LockFields) -> None:
    validate_lock_permission(item, lock_data)
    _validate_can_lock(item)

    if isinstance(item, UnifiedPlanningResource):
        await _validate_relationship_locks(item)
    else:
        await _validate_assignment_lock(item)


def _validate_can_lock(item: AssignmentEventOrPlanning) -> None:
    user_id = get_user(required=True)["_id"]
    session_id = get_auth()["_id"]

    if item.lock_user:
        if str(user_id) == str(item.lock_user):
            if str(session_id) != str(item.lock_session):
                raise SuperdeskApiError.forbiddenError(gettext("Item is locked by you in another session."))
        else:
            raise SuperdeskApiError.forbiddenError(gettext("Item is locked by another user."))

    return


async def _validate_relationship_locks(item: UnifiedPlanningResource) -> None:
    async for related_item in get_all_items_in_relationship(item):
        if related_item.id == item.id:
            # No need to check the item that was provided
            continue
        elif not related_item.lock_user or not related_item.lock_session:
            # This item is not locked
            continue

        # This item is locked, construct the appropriate error message
        # and raise a forbidden error
        message: str

        if item.item_type == PlanningItemType.EVENT:
            if related_item.item_type == PlanningItemType.EVENT:
                if item.recurrence_id:
                    message = gettext("Another event in this recurring series is already locked.")
                else:
                    message = gettext("Another event is already locked.")
            elif item.recurrence_id:
                message = gettext("An associated planning item in this recurring series is already locked.")
            else:
                message = gettext("An associated planning item is already locked.")
        elif item.item_type == PlanningItemType.PLANNING:
            if related_item.item_type == PlanningItemType.PLANNING:
                if item.recurrence_id:
                    message = gettext("Another planning item in this recurring series is already locked.")
                else:
                    message = gettext("Another planning item is already locked.")
            elif item.recurrence_id:
                message = gettext("An associated event in this recurring series is already locked.")
            else:
                message = gettext("An associated event is already locked.")

        raise SuperdeskApiError.forbiddenError(message)


async def _validate_assignment_lock(item: AssignmentResourceModel) -> None:
    valid_states = [
        AssignmentWorkflowState.IN_PROGRESS,
        AssignmentWorkflowState.SUBMITTED,
        AssignmentWorkflowState.ASSIGNED,
        AssignmentWorkflowState.COMPLETED,
    ]
    if not item.assigned_to or item.assigned_to.state not in valid_states:
        raise SuperdeskApiError.badRequestError(gettext("Assignment workflow state error."))
    elif item.assigned_to.state == AssignmentWorkflowState.IN_PROGRESS:
        archive_item = await get_resource_service("archive").find_one_async(req=None, assignment_id=item.id)
        user_id = get_user(required=True)["_id"]
        if archive_item and archive_item.get("lock_user") and archive_item["lock_user"] != user_id:
            # Archive item is locked by another user
            raise SuperdeskApiError.badRequestError(gettext("Archive item is locked by another user."))
    elif item.to_delete:
        plan = await UnifiedPlanningResource.get_service().find_by_id(item.planning_item)
        if plan:
            state = "unposted" if plan.state == WorkflowState.KILLED else plan.state
            raise SuperdeskApiError.forbiddenError(gettext(f"Action failed. Related planning item is {state}"))


def _get_lock_id(item: AssignmentEventOrPlanning) -> str:
    # lock_id will be:
    # 1 - Recurrence Id for items part of recurring series (event or planning)
    # 2 - Event ID for planning with related primary event
    # 3 - item's _id for all other cases
    if isinstance(item, UnifiedPlanningResource):
        first_primary_event_id = get_first_related_event_id(item, RelatedEventLinkType.PRIMARY)
        if item.recurrence_id:
            return f"item_lock {item.recurrence_id}"
        elif item.item_type != PlanningItemType.EVENT and first_primary_event_id is not None:
            return f"item_lock {first_primary_event_id}"

    return f"item_lock {item.id}"


@contextmanager
def _item_lock_guard(item: AssignmentEventOrPlanning) -> Iterator[None]:
    lock_id = _get_lock_id(item)
    if not lock(lock_id, expire=5):
        raise SuperdeskApiError.forbiddenError(gettext("Item is locked by another user"))

    try:
        yield
    finally:
        unlock(lock_id, remove=True)


async def _update_item_lock[T: AssignmentEventOrPlanning](original: T, lock_data: LockFields) -> T:
    app = get_current_app()
    current_request = app.get_current_request()
    if not lock_data.lock_time:
        lock_data.lock_time = utcnow()

    related_event_ids: list[str]
    recurrence_id: str | None
    if isinstance(original, UnifiedPlanningResource):
        service = UnifiedPlanningResource.get_service()
        related_event_ids = get_related_event_ids(original)
        recurrence_id = original.recurrence_id
    else:
        service = AssignmentResourceModel.get_service()
        related_event_ids = []
        recurrence_id = None

    with _item_lock_guard(original):
        item_type = "events" if original.item_type == PlanningItemType.EVENT else original.item_type
        original_dict = original.to_dict()
        await getattr(app, f"on_lock_{item_type}").call_async(original_dict, lock_data.lock_user)
        await signals.on_item_lock.send(original, lock_data)

        updated = await service.update(original.id, lock_data.to_dict(), original=original, skip_signals=True)
        push_notification(
            f"{item_type}:lock",
            item=original.id,
            user=str(lock_data.lock_user),
            lock_time=updated.lock_time,
            lock_sessoin=str(updated.lock_session),
            lock_action=updated.lock_action,
            etag=updated.etag,
            event_ids=related_event_ids,
            recurrence_id=recurrence_id,
            type=original.item_type,
            clientId=current_request.get_url_arg("clientId") if current_request else None,
        )

        await getattr(app, f"on_locked_{item_type}").call_async(original_dict, updated.to_dict())
        await signals.on_item_locked.send(original, updated)

        return updated
