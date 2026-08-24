# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Merged cancel logic for Event & Planning items (SDBELGA-1120).

The Planning side previously lived in the Eve ``PlanningCancelService`` (backed
by the legacy ``planning`` collection); it is folded in here as
``process_cancel_planning_item`` and now writes ``unified_planning`` through the
``UnifiedPlanningResource`` Pydantic service. The event cascade queries the
unified index (``get_related_planning_for_events``) instead of the empty legacy
one.
"""

from copy import deepcopy
from typing import Any

from quart_babel import gettext as _

from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
)
from planning.history.planning import UnifiedPlanningHistoryService
from planning.types import UnifiedPlanningHistoryResource, UnifiedPlanningResource
from planning.types.unified import PlanningItemType, RelatedEventLinkType
from planning.unified.common import get_related_planning_for_events
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth

from planning.common import (
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    ITEM_STATE,
    ITEM_ACTIONS,
    ASSIGNMENT_WORKFLOW_STATE,
    update_post_item,
    is_valid_event_planning_reason,
    get_coverage_status_from_cv,
    remove_lock_information,
    set_actioned_date_to_event,
)
from planning import signals


async def process_cancel(
    updates: dict[str, Any],
    original: dict[str, Any],
    cancel_all_coverage: bool = False,
) -> dict[str, Any]:
    if original.get("type") == PlanningItemType.EVENT.value:
        return await process_cancel_event(updates, original)
    return await process_cancel_planning_item(updates, original, cancel_all_coverage=cancel_all_coverage)


# ---------------------------------------------------------------------------
# Event cancel
# ---------------------------------------------------------------------------


async def patch_related_event_as_cancelled(
    updates: dict[str, Any], original: dict[str, Any], notifications: list[dict[str, Any]]
):
    service = UnifiedPlanningResource.get_service()
    events_history_service = UnifiedPlanningHistoryResource.get_service()

    if not validate_states(original):
        # Don't raise exception for related events in series - simply ignore
        return

    id = original[ID_FIELD]
    # skip on_update: its recurring-date branch is an unimplemented TODO that raises
    updates["skip_on_update"] = True

    updated_event = (await service.update(id, updates)).to_dict()
    await events_history_service.on_cancel(updated_event, original)

    notifications.append({"_id": id, "_etag": updated_event.get("_etag")})


def validate_states(event: dict[str, Any]):
    if event.get("state") not in [
        WORKFLOW_STATE.DRAFT,
        WORKFLOW_STATE.SCHEDULED,
        WORKFLOW_STATE.INGESTED,
        WORKFLOW_STATE.KILLED,
        WORKFLOW_STATE.POSTPONED,
    ]:
        return False

    return True


async def cancel_event_plannings(updates: dict[str, Any], original: dict[str, Any]):
    reason = updates.get("reason", None)

    async for planning in await get_related_planning_for_events([original[ID_FIELD]], RelatedEventLinkType.PRIMARY):
        plan = planning.to_dict()
        if plan.get("state") != WORKFLOW_STATE.CANCELLED:
            await process_cancel_planning_item({"reason": reason}, plan, event_cancellation=True)


def set_event_cancelled(updates: dict[str, Any], original: dict[str, Any], occur_cancel_state):
    if not validate_states(original):
        raise SuperdeskApiError.badRequestError(_("Event not in valid state for cancellation"))

    remove_lock_information(updates)
    updates.update(
        {
            "state": WORKFLOW_STATE.CANCELLED,
            "occur_status": occur_cancel_state,
            "state_reason": updates.get("reason"),
        }
    )
    set_actioned_date_to_event(updates, original)


async def get_cancel_state():
    eocstat_map = await get_resource_service("vocabularies").find_one_async(req=None, _id="eventoccurstatus")
    occur_cancel_state = [x for x in eocstat_map.get("items", []) if x["qcode"] == "eocstat:eos6"][0]
    occur_cancel_state.pop("is_active", None)
    return occur_cancel_state


async def cancel_single_event(updates: dict[str, Any], original: dict[str, Any]):
    occur_cancel_state = await get_cancel_state()
    set_event_cancelled(updates, original, occur_cancel_state)
    await cancel_event_plannings(updates, original)


async def cancel_recurring_event(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    occur_cancel_state = await get_cancel_state()
    historic, past, future = await get_recurring_timeline(original, postponed=True)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        cancelled_events = future
    else:
        cancelled_events = past + future

    set_event_cancelled(updates, original, occur_cancel_state)

    notifications: list = []

    for event in cancelled_events:
        new_updates = deepcopy(updates)
        await cancel_event_plannings(new_updates, event)
        await patch_related_event_as_cancelled(new_updates, event, notifications)

    await cancel_event_plannings(updates, original)
    updates["_cancelled_events"] = notifications


async def process_cancel_event(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    """
    Processes the event cancel, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :return: The updated event document.
    """
    service = UnifiedPlanningResource.get_service()
    ACTION = "cancel"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION)

    # Determin update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await cancel_single_event(updates, original)
    else:
        await cancel_recurring_event(updates, original, update_method)

    # Clean updates before persisting change
    reason = updates.pop("reason", None)
    cancelled_items = updates.pop("_cancelled_events", [])
    updates.pop("update_method", None)

    event_id = original[ID_FIELD]
    canceled_event = (await service.update(event_id, updates, skip_signals=True)).to_dict()
    await signals.event_cancel.send(updates, original)

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "events:cancel",
        item=str(event_id),
        user=str(user),
        session=str(session),
        occur_status=updates.get("occur_status"),
        etag=canceled_event.get("_etag"),
        cancelled_items=cancelled_items,
        reason=reason or "",
        actioned_date=updates.get("actioned_date"),
    )

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return canceled_event


# ---------------------------------------------------------------------------
# Planning cancel (merged from the Eve PlanningCancelService)
# ---------------------------------------------------------------------------


def is_related_event_completed(updates: dict[str, Any], original: dict[str, Any]) -> bool:
    if (
        len(original.get("coverages") or []) > 0
        and len(updates.get("coverages") or []) > 0
        and not original["coverages"][0]["planning"].get("workflow_status_reason")
        and updates["coverages"][0]["planning"].get("workflow_status_reason") == "Event Completed"
    ):
        return True

    return False


async def process_cancel_planning_item(
    updates: dict[str, Any],
    original: dict[str, Any],
    event_cancellation: bool = False,
    cancel_all_coverage: bool = False,
    event_reschedule: bool = False,
) -> dict[str, Any]:
    service = UnifiedPlanningResource.get_service()
    planning_service = get_resource_service("planning")

    if not await is_valid_event_planning_reason(updates, original):
        raise SuperdeskApiError.badRequestError(message=_("Reason is required field."))

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    coverage_cancel_state = get_coverage_status_from_cv("ncostat:notint")
    coverage_cancel_state.pop("is_active", None)

    planning_item_id = original[ID_FIELD]
    ids = []
    updates["coverages"] = deepcopy(original.get("coverages"))
    coverages = updates.get("coverages") or []
    reason = updates.pop("reason", None)

    for coverage in coverages:
        if coverage["workflow_status"] not in [
            WORKFLOW_STATE.CANCELLED,
            ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
        ]:
            ids.append(coverage.get("coverage_id"))
            await planning_service.cancel_coverage(
                coverage,
                coverage_cancel_state,
                coverage.get("workflow_status"),
                None,
                reason,
                event_cancellation,
                event_reschedule,
            )

    if cancel_all_coverage:
        item = None
        if len(ids) > 0:
            item = (await service.update(planning_item_id, updates, skip_signals=True)).to_dict()
            push_notification(
                "coverage:cancelled",
                planning_item=str(planning_item_id),
                user=str(user),
                session=str(session),
                reason=reason,
                coverage_state=coverage_cancel_state,
                etag=item.get("_etag"),
                ids=ids,
            )
            # Re-post + history (was the Eve on_updated_async + on_updated_planning_cancel signal)
            await _finalize_planning_cancel(updates, original, event_cancellation)
        return item if item else await planning_service.find_one_async(req=None, _id=planning_item_id)

    updates["state_reason"] = reason
    updates[ITEM_STATE] = WORKFLOW_STATE.CANCELLED

    cancelled_planning_item = (await service.update(planning_item_id, updates, skip_signals=True)).to_dict()

    push_notification(
        "planning:cancelled",
        item=str(planning_item_id),
        user=str(user),
        session=str(session),
        reason=reason,
        coverage_state=coverage_cancel_state,
        event_cancellation=event_cancellation,
    )

    # Re-post + history (was the Eve on_updated_async + on_updated_planning_cancel signal)
    await _finalize_planning_cancel(updates, original, event_cancellation)

    return cancelled_planning_item


async def _finalize_planning_cancel(updates: dict[str, Any], original: dict[str, Any], event_cancellation: bool):
    """Re-post the item when appropriate and record the cancel in history.

    Reproduces what the removed Eve ``PlanningCancelService.on_updated_async`` +
    ``app.on_updated_planning_cancel`` signal did on every update to the resource,
    for both the direct cancel and the cancel-all-coverage paths.
    """
    lock_action = original.get("lock_action")
    allowed_actions = [
        ITEM_ACTIONS.EDIT,
        ITEM_ACTIONS.PLANNING_CANCEL,
        ITEM_ACTIONS.CANCEL_ALL_COVERAGE,
    ]
    if event_cancellation or lock_action in allowed_actions or is_related_event_completed(updates, original):
        await update_post_item(updates, original)

    await UnifiedPlanningHistoryService().on_cancel(updates, original)
