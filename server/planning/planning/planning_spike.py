from copy import deepcopy
from typing import Any

from quart_babel import gettext as _

from superdesk import get_resource_service
from superdesk.resource_fields import ID_FIELD
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.auth import get_user, get_user_id
from apps.archive.common import get_auth

from planning import signals
from planning.assignments import AssignmentsAsyncService
from planning.common import (
    ITEM_EXPIRY,
    ITEM_STATE,
    set_item_expiry,
    WORKFLOW_STATE,
    get_coverage_type_name,
    remove_lock_information,
)
from planning.item_lock import LOCK_USER
from planning.planning.planning_utils import delete_assignments_for_coverages
from planning.planning_notifications import PlanningNotifications
from planning.utils import get_related_event_ids_for_planning, get_first_related_event_id_for_planning


def post_update_planning_item_actions(updates: dict[str, Any], original: dict[str, Any]):
    if original.get(LOCK_USER) and LOCK_USER in updates and updates[LOCK_USER] is None:
        push_notification(
            "planning:unlock",
            item=str(original.get(ID_FIELD)),
            user=str(get_user_id()),
            lock_session=str(get_auth().get(ID_FIELD)),
            etag=updates.get("_etag"),
            event_ids=get_related_event_ids_for_planning(original),
            recurrence_id=original.get("recurrence_id") or None,
            type=original.get("type"),
        )


async def post_planning_item_spike_actions(updates: dict[str, Any], original: dict[str, Any]):
    post_update_planning_item_actions(updates, original)
    events_service = get_resource_service("events")

    # Delete assignments in workflow
    assignments_to_delete = []
    coverages = original.get("coverages") or []
    for coverage in coverages:
        if coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE:
            assignments_to_delete.append(coverage)

    notify_user_on_failed_assignment_deletes = True
    first_event_id = get_first_related_event_id_for_planning(original, "primary")

    if first_event_id:
        event = await events_service.find_one_async(req=None, _id=first_event_id)
        notify_user_on_failed_assignment_deletes = not event or event.get("state") != WORKFLOW_STATE.SPIKED

    await delete_assignments_for_coverages(assignments_to_delete, notify_user_on_failed_assignment_deletes)


async def notify_draft_coverage_on_spike(coverage: dict[str, Any]):
    assignment_service = AssignmentsAsyncService()

    assigned_to = coverage.get("assigned_to")
    if assigned_to and assigned_to.get("assignment_id"):
        user = get_user()
        assignment = await assignment_service.find_by_id_raw(assigned_to["assignment_id"])
        if assignment:
            slugline = assignment.get("planning", {}).get("slugline", "")
            coverage_type = assignment.get("planning", {}).get("g2_content_type", "")
            await PlanningNotifications().notify_assignment(
                coverage_status=coverage.get("workflow_status"),
                target_user=assignment.get("assigned_to", {}).get("user"),
                target_desk=(
                    assignment.get("assigned_to", {}).get("desk")
                    if not assignment.get("assigned_to", {}).get("user")
                    else None
                ),
                message="assignment_spiked_msg",
                slugline=slugline,
                coverage_type=get_coverage_type_name(coverage_type),
                actioning_user=user.get("display_name", user.get("username", "Unknown")),
                omit_user=True,
            )


async def process_spike_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Function to spike planning item.

    :param updates: The update payload from the client.
    :param original: The original planning document.
    :return: The updated planning document.
    """
    planning_service = get_resource_service("planning")

    if original.get("pubstatus") or original.get("state") not in [
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.POSTPONED,
        WORKFLOW_STATE.CANCELLED,
    ]:
        raise SuperdeskApiError.badRequestError(message=_("Spike failed. Planning item in invalid state for spiking."))

    user = get_user()

    updates["revert_state"] = original[ITEM_STATE]
    updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
    set_item_expiry(updates)

    coverages = deepcopy(original.get("coverages") or [])
    for coverage in coverages:
        if coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE:
            coverage["workflow_status"] = WORKFLOW_STATE.DRAFT
            coverage["assigned_to"] = {}

    updates["coverages"] = coverages

    # Mark item as unlocked directly in order to avoid more queries and notifications
    # coming from lockservice.
    remove_lock_information(updates)
    planning_item_id = original[ID_FIELD]
    await planning_service.update_async(planning_item_id, updates, original, skip_signals=True)
    await signals.planning_spiked.send(updates, original)
    spiked_planning_item = await planning_service.find_one_async(req=None, _id=planning_item_id)
    assert spiked_planning_item is not None, "Expected spiked_planning to be a dict, got None"

    push_notification(
        "planning:spiked",
        item=str(planning_item_id),
        user=str(user.get(ID_FIELD, "")),
        etag=spiked_planning_item["_etag"],
        revert_state=spiked_planning_item["revert_state"],
    )

    for coverage in coverages:
        workflow_status = coverage.get("workflow_status")
        if workflow_status == WORKFLOW_STATE.DRAFT:
            await notify_draft_coverage_on_spike(coverage)

    # Perform post planning spike actions
    await post_planning_item_spike_actions(updates, original)

    return spiked_planning_item


async def process_unspike_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Function to unspike planning item.

    :param updates: The update payload from the client.
    :param original: The original planning document.
    :return: The updated planning document.
    """
    planning_service = get_resource_service("planning")
    events_service = get_resource_service("events")

    first_event_id = get_first_related_event_id_for_planning(original, "primary")
    if first_event_id:
        event = await events_service.find_one_async(req=None, _id=first_event_id)
        if event and event.get("state") == WORKFLOW_STATE.SPIKED:
            raise SuperdeskApiError.badRequestError(message=_("Unspike failed. Associated event is spiked."))

    updates[ITEM_STATE] = original.get("revert_state", WORKFLOW_STATE.DRAFT)
    updates["revert_state"] = None
    updates[ITEM_EXPIRY] = None
    remove_lock_information(updates)

    planning_item_id = original[ID_FIELD]
    await planning_service.update_async(planning_item_id, updates, original, skip_signals=True)
    await signals.planning_unspiked.send(updates, original)
    unspiked_planning_item = await planning_service.find_one_async(req=None, _id=planning_item_id)
    assert unspiked_planning_item is not None, "Expected unspiked_planning to be a dict, got None"

    push_notification(
        "planning:unspiked",
        item=str(planning_item_id),
        user=str(get_user_id()),
        etag=unspiked_planning_item.get("_etag"),
        state=unspiked_planning_item[ITEM_STATE],
    )

    # Perform post update actions
    post_update_planning_item_actions(updates, original)

    return unspiked_planning_item
