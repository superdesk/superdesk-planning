# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Merged reschedule logic for Event & Planning items (SDBELGA-1120).

The Planning side previously lived in the Eve ``PlanningRescheduleService``
(``internal_resource``, backed by the legacy ``planning`` collection); it is
folded in here as ``process_reschedule_planning_item`` and now reads/writes
``unified_planning``. The event cascade queries the unified index.
"""

import pytz
from copy import deepcopy
from datetime import datetime
from itertools import islice
from typing import Any

from planning import signals
from planning.common import (
    UPDATE_FUTURE,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    ITEM_STATE,
    remove_lock_information,
    set_original_creator,
    set_actioned_date_to_event,
    get_max_recurrent_events,
    get_coverage_type_name,
    TO_BE_CONFIRMED_FIELD,
)
from planning.events.events_utils import (
    get_recurring_timeline,
    get_update_method,
    post_update_event_actions,
    pre_update_event_actions,
    set_planning_schedule,
    remove_fields,
    generate_recurring_dates,
)
from planning.history.planning import UnifiedPlanningHistoryService
from planning.planning_notifications import PlanningNotifications
from planning.types import UnifiedPlanningHistoryResource, UnifiedPlanningResource
from planning.types.unified import RelatedEventLinkType
from planning.unified.common import get_related_planning_for_events, event_has_planning_items
from planning.unified.actions.cancel import process_cancel_planning_item

from superdesk.core import get_current_app
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from apps.archive.common import get_user, get_auth


async def get_related_primary_plannings(event_id: str) -> list[dict[str, Any]]:
    """Return the related *primary* Planning items for an Event from the unified index."""
    return [
        plan.to_dict() async for plan in await get_related_planning_for_events([event_id], RelatedEventLinkType.PRIMARY)
    ]


def set_next_occurrence(updates: dict[str, Any]):
    new_dates = [
        date
        for date in islice(
            generate_recurring_dates(
                start=updates["dates"]["start"],
                tz=updates["dates"].get("tz") and pytz.timezone(updates["dates"]["tz"] or ""),
                **updates["dates"]["recurring_rule"],
                all_day=bool(updates["dates"].get("all_day")),
            ),
            0,
            get_max_recurrent_events(),
        )
    ]
    time_delta = updates["dates"]["end"] - updates["dates"]["start"]
    updates["dates"]["start"] = new_dates[0]
    updates["dates"]["end"] = new_dates[0] + time_delta
    set_planning_schedule(updates)


def mark_event_rescheduled(updates: dict[str, Any], reason: str, keep_dates: bool = False):
    updates["state"] = WORKFLOW_STATE.RESCHEDULED
    updates["state_reason"] = reason

    # We don't want to update the schedule of this current event
    # As the duplicated Event will have the new schedule
    if not keep_dates:
        updates.pop("dates", None)


async def reschedule_event_plannings(original: dict[str, Any], reason: str, plans=None, state=None):
    plan_updates = {"reason": reason, "state": state}
    for plan in plans if plans is not None else await get_related_primary_plannings(original[ID_FIELD]):
        if plan.get("state") != WORKFLOW_STATE.CANCELLED:
            await process_reschedule_planning_item(deepcopy(plan_updates), plan)
            if len(plan.get("coverages", [])) > 0:
                await process_cancel_planning_item(
                    {"reason": reason},
                    plan,
                    cancel_all_coverage=True,
                    event_reschedule=True,
                )


async def duplicate_event(updates: dict[str, Any], original: dict[str, Any]):
    events_service = get_resource_service("events")
    events_history_service = UnifiedPlanningHistoryResource.get_service()

    new_event = deepcopy(original)
    new_event.update(updates)

    # Remove fields not required by new events
    remove_fields(new_event)

    new_event[ITEM_STATE] = WORKFLOW_STATE.DRAFT
    new_event_guid = generate_guid(type=GUID_NEWSML)
    new_event["guid"] = new_event_guid
    new_event["_id"] = new_event["guid"]
    new_event["reschedule_from"] = original[ID_FIELD]
    new_event["_reschedule_from_schedule"] = original["dates"]["start"]
    new_event.pop("state_reason", None)
    set_original_creator(new_event)
    set_planning_schedule(new_event)

    await events_service.create_async([new_event])
    await events_history_service.on_reschedule_from(new_event)
    return new_event


async def reschedule_single_event(updates: dict[str, Any], original: dict[str, Any]):
    has_plannings = await event_has_planning_items(original[ID_FIELD])

    remove_lock_information(updates)
    reason = updates.pop("reason", None)

    event_in_use = has_plannings or (original.get("pubstatus") or "") != ""
    if event_in_use or original.get("state") == WORKFLOW_STATE.POSTPONED:
        if event_in_use:
            # If the Event is in use, then we will duplicate the original
            # and set the original's status to `rescheduled`
            duplicated_event = await duplicate_event(updates, original)
            updates["reschedule_to"] = duplicated_event[ID_FIELD]
            set_actioned_date_to_event(updates, original)
        else:
            updates["actioned_date"] = None

        mark_event_rescheduled(updates, reason, not event_in_use)

        if not event_in_use:
            updates["state"] = WORKFLOW_STATE.DRAFT

        if has_plannings:
            await reschedule_event_plannings(original, reason)

    set_planning_schedule(updates)


async def reschedule_recurring_event(updates: dict[str, Any], original: dict[str, Any], update_method: str):
    service = UnifiedPlanningResource.get_service()
    events_service = get_resource_service("events")
    remove_lock_information(updates)

    rules_changed = updates["dates"]["recurring_rule"] != original["dates"]["recurring_rule"]
    times_changed = (
        updates["dates"]["start"] != original["dates"]["start"] or updates["dates"]["end"] != original["dates"]["end"]
    )
    reason = updates.pop("reason", None)
    historic, past, future = await get_recurring_timeline(original, postponed=True)

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UPDATE_FUTURE

    if update_method == UPDATE_FUTURE:
        rescheduled_events = [original] + future
        new_start_date = updates["dates"]["start"]
        original_start_date = original["dates"]["start"]
        original_rule = original["dates"]["recurring_rule"]
    else:
        rescheduled_events = past + [original] + future

        # Assign the date from the beginning of the new series
        new_start_date = updates["dates"]["start"]
        original_start_date = past[0]["dates"]["start"]
        original_rule = past[0]["dates"]["recurring_rule"]

    updated_rule = deepcopy(updates["dates"]["recurring_rule"])
    if updated_rule["endRepeatMode"] == "count":
        num_events = len(historic) + len(past) + len(future) + 1
        updated_rule["count"] -= num_events - len(rescheduled_events)

    # Compute the difference between start and end in the updated event
    time_delta = updates["dates"]["end"] - updates["dates"]["start"]

    # Generate the dates for the new event series
    max_events = get_max_recurrent_events()
    new_dates = [
        date
        for date in islice(
            generate_recurring_dates(
                start=new_start_date,
                tz=updates["dates"].get("tz") and pytz.timezone(updates["dates"]["tz"] or ""),
                date_only=True,
                all_day=bool(updates["dates"].get("all_day")),
                **updated_rule,
            ),
            0,
            max_events,
        )
    ]

    # Generate the dates for the original events
    original_dates = [
        date
        for date in islice(
            generate_recurring_dates(
                start=original_start_date,
                tz=original["dates"].get("tz") and pytz.timezone(original["dates"]["tz"] or ""),
                date_only=True,
                all_day=bool(original["dates"].get("all_day")),
                **original_rule,
            ),
            0,
            max_events,
        )
    ]

    set_next_occurrence(updates)

    dates_processed = []

    # Iterate over the current events in the series and delete/spike
    # or update the event accordingly
    deleted_events = {}
    app = get_current_app().as_any()
    for event in rescheduled_events:
        if event[ID_FIELD] == original[ID_FIELD]:
            event_date = updates["dates"]["start"].replace(tzinfo=None).date()
        else:
            event_date = event["dates"]["start"].replace(tzinfo=None).date()
        # If the event does not occur in the new dates, then we need to either
        # delete or spike this event
        if event_date not in new_dates:
            # Add it to the list of events to delete or spike
            # This is done later so that we can perform a single
            # query against mongo, rather than one per deleted event
            deleted_events[event[ID_FIELD]] = event

        # If the date has already been processed, then we should mark this event for deletion
        # This occurs when the selected Event is being updated to an Event that already exists
        # in another Event in the series.
        # This stops multiple Events to occur on the same day
        elif event_date in new_dates and event_date in dates_processed:
            deleted_events[event[ID_FIELD]] = event

        # Otherwise this Event does occur in the new dates
        else:
            # Because this Event occurs in the new dates, then we are not to set the state to 'rescheduled',
            # instead we set it to either 'scheduled' (if public) or 'draft' (if not public)
            new_state = WORKFLOW_STATE.SCHEDULED if event.get("pubstatus") else WORKFLOW_STATE.DRAFT

            # If this is the selected Event, then simply update the fields and
            # Reschedule associated Planning items
            if event[ID_FIELD] == original[ID_FIELD]:
                mark_event_rescheduled(updates, reason, True)
                updates["state"] = new_state
                await reschedule_event_plannings(event, reason, state=WORKFLOW_STATE.DRAFT)

            else:
                # skip on_update: its recurring-date branch is an unimplemented TODO that raises
                new_updates = {"reason": reason, "skip_on_update": True}
                mark_event_rescheduled(new_updates, reason)
                new_updates["state"] = new_state

                # Update the 'start', 'end' and 'recurring_rule' fields of the Event
                if rules_changed or times_changed:
                    new_updates["state"] = new_state
                    new_updates["dates"] = event["dates"]
                    new_updates["dates"]["start"] = datetime.combine(event_date, updates["dates"]["start"].time())
                    new_updates["dates"]["end"] = new_updates["dates"]["start"] + time_delta
                    new_updates["dates"]["recurring_rule"] = updates["dates"]["recurring_rule"]
                    set_planning_schedule(new_updates)

                # And finally update the Event, and Reschedule associated Planning items
                await service.update(event[ID_FIELD], new_updates)
                await reschedule_event_plannings(event, reason, state=WORKFLOW_STATE.DRAFT)
                await signals.event_reschedule.send(new_updates, {"_id": event[ID_FIELD]})

            # Mark this date as being already processed
            dates_processed.append(event_date)

    # Create new events that do not fall on the original occurrence dates
    new_events = []
    for date in new_dates:
        # If the new date falls on the original occurrences, or if the
        # start date of the selected one, then skip this date occurrence
        if date in original_dates or date in dates_processed:
            continue

        # Create a copy of the metadata to use for the new event
        new_event = deepcopy(original)
        new_event.update(deepcopy(updates))

        # Remove fields not required by the new events
        for key in list(new_event.keys()):
            if key.startswith("_") and key != TO_BE_CONFIRMED_FIELD:
                new_event.pop(key)
            elif key.startswith("lock_"):
                new_event.pop(key)

        # Set the new start and end dates, as well as the _id and guid fields
        new_event["dates"]["start"] = datetime.combine(date, updates["dates"]["start"].time())
        new_event["dates"]["end"] = new_event["dates"]["start"] + time_delta
        new_event[ID_FIELD] = new_event["guid"] = generate_guid(type=GUID_NEWSML)
        new_event.pop("reason", None)
        set_planning_schedule(new_event)

        # And finally add this event to the list of events to be created
        new_events.append(new_event)

    # Now iterate over the new events and create them
    if new_events:
        await events_service.create_async(new_events)
        await app.on_inserted_events.call_async(new_events)

    for event in deleted_events.values():
        event_plans = await get_related_primary_plannings(event[ID_FIELD])
        is_original = event[ID_FIELD] == original[ID_FIELD]
        if len(event_plans) > 0 or event.get("pubstatus", None) is not None:
            if is_original:
                mark_event_rescheduled(updates, reason)
            else:
                # This event has Planning items, so spike this event and
                # all Planning items
                new_updates = {"reason": reason}
                mark_event_rescheduled(new_updates, reason)
                await service.update(event[ID_FIELD], new_updates, skip_signals=True)

            if len(event_plans) > 0:
                await reschedule_event_plannings(original, reason, event_plans)
        else:
            # This event has no Planning items, therefor we can safely
            # delete this event
            await events_service.delete_action_async(lookup={"_id": event[ID_FIELD]})
            await app.on_deleted_item_events.call_async(event)

            if is_original:
                updates["_deleted"] = True


async def process_reschedule_event(
    updates: dict[str, Any], original: dict[str, Any], require_lock: bool = True
) -> dict[str, Any]:
    """
    Processes the event reschedule, handling both single and recurring events.

    :param updates: The update payload from the client.
    :param original: The original event document.
    :param require_lock: Whether to enforce lock removal (default True).
    :return: The updated event document.
    """
    service = UnifiedPlanningResource.get_service()
    ACTION = "reschedule"

    # Perform pre update event actions
    await pre_update_event_actions(updates, original, ACTION, require_lock)

    # Determin update method
    update_method = get_update_method(updates, original)

    if update_method == UPDATE_SINGLE:
        await reschedule_single_event(updates, original)
    else:
        await reschedule_recurring_event(updates, original, update_method)

    # Clean updates before persisting change
    updates.pop("update_method", None)

    event_id = original[ID_FIELD]
    rescheduled_event = (await service.update(event_id, updates, skip_signals=True)).to_dict()
    await signals.event_rescheduled.send(updates, original)

    # Perform post update actions
    await post_update_event_actions(updates, original, ACTION)

    return rescheduled_event


# ---------------------------------------------------------------------------
# Planning reschedule (merged from the Eve PlanningRescheduleService)
# ---------------------------------------------------------------------------


def _reschedule_plan(updates: dict[str, Any], original: dict[str, Any], reason: str):
    updates["state_reason"] = reason

    if updates.get(ITEM_STATE) == WORKFLOW_STATE.DRAFT and original.get("pubstatus"):
        updates[ITEM_STATE] = WORKFLOW_STATE.SCHEDULED
    else:
        updates[ITEM_STATE] = updates.get(ITEM_STATE) or WORKFLOW_STATE.RESCHEDULED


async def _reschedule_coverage(coverage: dict[str, Any], reason: str):
    if coverage.get("workflow_status") != WORKFLOW_STATE.CANCELLED:
        coverage["planning"]["workflow_status_reason"] = reason
        coverage["workflow_status"] = WORKFLOW_STATE.CANCELLED

    assigned_to = coverage.get("assigned_to")
    if assigned_to:
        assignment_service = get_resource_service("assignments")
        assignment = await assignment_service.find_one_async(req=None, _id=assigned_to.get("assignment_id"))
        slugline = assignment.get("planning").get("slugline", "")
        coverage_type = assignment.get("planning").get("g2_content_type", "")
        await PlanningNotifications().notify_assignment(
            coverage_status=coverage.get("workflow_status"),
            target_user=assignment.get("assigned_to").get("user"),
            target_desk=(
                assignment.get("assigned_to").get("desk") if not assignment.get("assigned_to").get("user") else None
            ),
            message="assignment_rescheduled_msg",
            slugline=slugline,
            coverage_type=get_coverage_type_name(coverage_type),
        )


async def process_reschedule_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    service = UnifiedPlanningResource.get_service()

    reason = updates.pop("reason", None)
    _reschedule_plan(updates, original, reason)

    updates["coverages"] = deepcopy(original.get("coverages"))
    coverages = updates.get("coverages") or []

    for coverage in coverages:
        await _reschedule_coverage(coverage, reason)

    planning_item_id = original[ID_FIELD]
    rescheduled_planning_item = (await service.update(planning_item_id, updates, skip_signals=True)).to_dict()

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "planning:rescheduled",
        item=str(planning_item_id),
        user=str(user),
        session=str(session),
    )

    # Record the reschedule in history (was the app.on_updated_planning_reschedule signal)
    await UnifiedPlanningHistoryService().on_reschedule(updates, original)

    return rescheduled_planning_item
