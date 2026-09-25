from copy import deepcopy
import itertools
from collections.abc import AsyncGenerator
from datetime import datetime, date, timezone
import logging

import pytz
from quart_babel import gettext


from superdesk import get_resource_service
from superdesk.core import get_config, get_current_app
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utc_to_local, local_to_utc
from superdesk.notification import push_notification

from planning.types import (
    UnifiedPlanningResource,
    WorkflowState,
    PlanningItemType,
    UpdateMethods,
    PostStates,
    UnifiedPlanningHistoryResource,
)
from planning.types.unified import RecurringEndMode
from planning.common import TO_BE_CONFIRMED_FIELD
from planning.utils import get_planning_event_link_method

from .actions.reschedule import reschedule_single_event
from .common import (
    overwrite_event_expiry_date,
    set_planning_schedule,
    ItemUpdateRequest,
    post_on_update_required,
    get_coverage_by_id,
    get_recurring_timeline,
    generate_recurring_dates,
)
from .events import mark_event_complete


__all__ = [
    "duplicate_event_for_series",
    "on_create_recurring",
    "on_update_recurring",
]

logger = logging.getLogger(__name__)


async def on_create_recurring(item: UnifiedPlanningResource) -> list[UnifiedPlanningResource]:
    if not item.dates.recurring_rule or item.dates.recurring_rule.created_externally:
        # If `created_externally` is true, generate_recurring_events is restricted.
        return []

    recurring_items = generate_recurring_events(item)
    if not recurring_items:
        return []

    item.recurrence_id = item.id

    # Set the Planning Item from the origin (generate_recurring_events removes this field)
    item.planning_item = item.planning_item
    return recurring_items


async def on_update_recurring(req: ItemUpdateRequest) -> None:
    if req.original.item_type == PlanningItemType.PLANNING:
        # Recurring items are only supported for Events for now
        if req.updated.update_method not in {UpdateMethods.SINGLE, None}:
            await _update_recurring_planning_items(req)
        return

    if not req.original.dates.recurring_rule:
        req.updated.update_method = UpdateMethods.SINGLE
    elif req.original.dates.recurring_rule != req.updated.dates.recurring_rule:
        req.updated.update_method = UpdateMethods.ALL

    _validate_convert_to_recurring(req)
    if req.updated.update_method in {UpdateMethods.SINGLE, None}:
        await _update_single_item(req)
    else:
        await _update_recurring_items(req)


async def _update_single_item(req: ItemUpdateRequest) -> None:
    if req.original.lock_action not in {"convert_recurring", "edit"} or "dates" not in req.updates:
        return

    generated_items = await _convert_to_recurring_event(req)

    if not len(generated_items):
        raise SuperdeskApiError.badRequestError(gettext("Generated recurring series is empty!"))

    # If the original event was "posted" then post all the generated events
    if req.original.pubstatus in [PostStates.CANCELLED, PostStates.USABLE]:
        post = {
            "event": generated_items[0].id,
            "etag": generated_items[0].etag,
            "update_method": "all",
            "pubstatus": req.original.pubstatus,
        }
        await get_resource_service("events_post").post_async([post])


def _validate_convert_to_recurring(req: ItemUpdateRequest) -> None:
    # Validate recurring rule
    if req.original.lock_action != "convert_recurring":  # or "dates" not in req.updates:
        return

    if (req.updates.get("dates") or {}).get("recurring_rule") is None:
        raise SuperdeskApiError.badRequestError(
            gettext("Event recurring rules are mandatory for convert to recurring action.")
        )
    elif req.original.recurrence_id:
        raise SuperdeskApiError.badRequestError(gettext("Event is already converted to recurring event."))


async def _update_recurring_items(req: ItemUpdateRequest) -> None:
    if get_planning_event_link_method() != "many_secondary":
        # We only support changing Event schedule(s) through the main endpoint
        # if ``PLANNING_EVENT_LINK_METHOD`` is set to ``many_secondary``
        # If this is not the case, then we only update the metadata
        req.updates.pop("dates", None)

    # If this update is from assignToCalendar action
    # Then we only want to update the calendars of each Event
    only_calendars = req.original.lock_action == "assign_calendar"
    original_calendar_qcodes = [calendar.qcode for calendar in req.original.calendars or []]

    # Get the list of calendars added
    updated_calendars = [
        calendar for calendar in req.updates.get("calendars") or [] if calendar["qcode"] not in original_calendar_qcodes
    ]

    mark_completed = req.original.lock_action == "mark_completed" and req.updates.get("actioned_date")
    mark_complete_validated = False

    events_post_service = get_resource_service("events_post")
    updates_to_apply: list[tuple[str, dict]] = []
    items_service = UnifiedPlanningResource.get_service()

    async for event, new_updates in get_recurring_event_updates_iterator(req):
        event_id = event.id
        new_dates = new_updates.get("dates", None)
        new_updates.update(req.updates)

        if new_dates:
            new_updates["dates"] = new_dates
        else:
            new_updates.pop("dates", None)

        if only_calendars:
            # Get the original for this item, and add new calendars to it
            # Skipping calendars already assigned to this item
            original_event = await items_service.find_by_id(event_id)
            if not original_event:
                raise SuperdeskApiError.internalError(gettext("Event in series not found, unable to update"))

            original_qcodes = [calendar.qcode for calendar in original_event.calendars or []]

            new_updates["calendars"] = [calendar.to_dict() for calendar in original_event.calendars or []]
            new_updates["calendars"].extend(
                [calendar for calendar in updated_calendars if calendar["qcode"] not in original_qcodes]
            )
        elif mark_completed:
            await mark_event_complete(req, mark_complete_validated)
            # It is validated if the previous function did not raise an error
            mark_complete_validated = True

        # Remove ``embedded_planning`` before updating this event, as this should only be handled
        # by the event provided to this update request
        new_updates.pop("embedded_planning", None)

        # If this item is to be posted, make sure it passes validation
        # before we proceed with updating all the affected Events
        if post_on_update_required(req):
            # if post_required(req.updates, event):
            merged = event.clone_with(new_updates)
            await events_post_service.validate_item(merged.to_dict())

        updates_to_apply.append((event_id, new_updates))

    # Finally, update the affected Events
    for event_id, new_updates in updates_to_apply:
        await items_service.update(event_id, new_updates)

        # Make sure to call Eve based signals as well (is this needed?)
        app = get_current_app().as_any()
        await app.on_updated_events.call_async(new_updates, {"_id": event_id})

    # And finally push a notification to connected clients
    push_notification(
        "events:updated:recurring",
        item=req.original.id,
        recurrence_id=req.original.recurrence_id,
        user=str(req.updates.get("version_creator", "")),
    )


async def get_recurring_event_updates_iterator(
    req: ItemUpdateRequest,
) -> AsyncGenerator[tuple[UnifiedPlanningResource, dict], None]:
    """
    Generate updates for recurring events based on a specified update method.

    This asynchronous generator function determines how a recurring event is
    updated based on its timeline (historic, past, future occurrences) and an
    update method provided by the user. This includes the new event schedule, if provided in the updates.

    :param original: The original event data containing details such as dates and timezone.
    :param updates: The modifications to apply to the recurring events series, including updated dates.
    :param update_method: Specifies whether updates are applied to all events in the series or limited to future events.
    :return: An asynchronous generator that yields tuples containing the original event data and the corresponding updated event data.
    """

    historic, past, future = await get_recurring_timeline(req.original)
    update_method = req.updated.update_method

    # Determine if the selected event is the first one, if so then
    # act as if we're changing future events
    if len(historic) == 0 and len(past) == 0:
        update_method = UpdateMethods.FUTURE

    if update_method == UpdateMethods.FUTURE:
        new_series = future
    else:
        new_series = historic + past + future

    if "dates" not in req.updates:
        # If there are no dates in the updates, there is no need to calculate new schedules
        # So we provide a simple generator here
        for item in new_series:
            yield item, {"skip_on_update": True}

        return

    # Get the timezone from the original Event (as the series was created with that timezone in mind)
    timezone = req.original.dates.tz

    # First get the local date/time for both the original and the updated schedule
    original_start_local = utc_to_local(timezone, req.original.dates.start)
    updated_start_local = utc_to_local(timezone, req.updated.dates.start)

    # Then calculate the difference between the two dates (ignoring the time values)
    date_delta = updated_start_local.date() - original_start_local.date()

    # Next convert the updated start time to seconds since midnight (which gives us a timedelta instance)
    delta_since_midnight = datetime.combine(date.min, updated_start_local.time()) - datetime.min

    # And calculate the new duration of the events
    duration = req.updated.dates.end - req.updated.dates.start

    for item in new_series:
        # Calculate midnight in local time for this occurrence
        start_of_day_local = utc_to_local(timezone, item.dates.start).replace(hour=0, minute=0, second=0)

        # Shift the date if needed
        if date_delta:
            start_of_day_local += date_delta

        # Then convert midnight in local time to UTC
        start_date_time = local_to_utc(timezone, start_of_day_local)

        # Finally add the delta since midnight
        start_date_time += delta_since_midnight

        # Set the new start and end times
        new_updated = item.clone_with(
            {
                "dates": {
                    **item.dates.to_dict(),
                    "start": start_date_time,
                    "end": start_date_time + duration,
                },
                "skip_on_update": True,
            }
        )
        set_planning_schedule(new_updated)
        new_updated_dict = new_updated.to_dict()
        new_updates = {
            "dates": new_updated_dict["dates"],
            "_planning_schedule": new_updated_dict["_planning_schedule"],
            "_updates_schedule": new_updated_dict["_updates_schedule"],
            "skip_on_update": True,
        }

        if item.time_to_be_confirmed:
            new_updates[TO_BE_CONFIRMED_FIELD] = False

        yield item, new_updates


def set_recurring_mode(event: UnifiedPlanningResource):
    if event.dates.recurring_rule is None:
        return

    end_repeat_mode = event.dates.recurring_rule.end_repeat_mode
    if end_repeat_mode == RecurringEndMode.COUNT:
        event.dates.recurring_rule.until = None
    elif end_repeat_mode == RecurringEndMode.UNTIL:
        event.dates.recurring_rule.count = None


def generate_recurring_events(
    event: UnifiedPlanningResource, recurrence_id: str | None = None
) -> list[UnifiedPlanningResource]:
    if event.dates.recurring_rule is None:
        return [event]

    if recurrence_id is None:
        recurrence_id = event.recurrence_id or event.id

    event.recurrence_id = recurrence_id

    generated_events: list[UnifiedPlanningResource] = []
    set_recurring_mode(event)
    embedded_planning_added = False

    # compute the difference between start and end in the original event
    time_delta = event.dates.end - event.dates.start
    first_event_processed = False

    # for all the dates based on the recurring rules:
    for occurence_date in itertools.islice(
        generate_recurring_dates(
            start=event.dates.start,
            tz=pytz.timezone(event.dates.tz) if event.dates.tz else None,
            all_day=event.dates.all_day,
            date_only=False,
            frequency=event.dates.recurring_rule.frequency,
            interval=event.dates.recurring_rule.interval,
            until=event.dates.recurring_rule.until,
            count=event.dates.recurring_rule.count,
            byday=event.dates.recurring_rule.byday,
        ),
        0,
        get_config(int, "MAX_RECURRENT_EVENTS", 200),  # set a limit to prevent too many events to be created
    ):
        if not isinstance(occurence_date, datetime):
            occurence_date = datetime(
                occurence_date.year, occurence_date.month, occurence_date.day, tzinfo=timezone.utc
            )

        if not first_event_processed:
            first_event_processed = True

            # Make the correct changes to the provided event
            if occurence_date != event.dates.start:
                # The provided Event does not fall in the recurring rules
                # Update it's start/end date so it does
                event.dates.start = occurence_date
                event.dates.end = event.dates.start + time_delta

            continue

        # create event with the new dates
        new_event = duplicate_event_for_series(event, occurence_date, occurence_date + time_delta)
        if not embedded_planning_added:
            # If this is the first Event in the series, then keep
            # the ``embedded_planning`` field for processing later
            embedded_planning_added = True
        else:
            # Otherwise remove the ``embedded_planning`` from all other Events
            # in the series
            new_event.embedded_planning = None

        overwrite_event_expiry_date(new_event)
        set_planning_schedule(new_event)
        generated_events.append(new_event)

    return generated_events


async def _convert_to_recurring_event(req: ItemUpdateRequest) -> list[UnifiedPlanningResource]:
    """Convert a single event to a series of recurring events."""

    events_service = UnifiedPlanningResource.get_service()
    req.updates["recurrence_id"] = req.updated.recurrence_id = req.original.id

    new_event = req.updated.clone()
    # Generated new events will be draft
    new_event.state = WorkflowState.DRAFT
    generated_events = generate_recurring_events(new_event, req.updated.recurrence_id)

    # Check to see if the first generated event is different from original
    # If yes, mark original as rescheduled with generated recurrence_id
    if new_event.dates.start.date() != req.original.dates.start.date():
        # Reschedule original event
        reschedule_updates = deepcopy(req.updates)
        reschedule_updates["update_method"] = UpdateMethods.SINGLE
        reschedule_updates["dates"] = new_event.dates.to_dict()

        # Reschedule the Event
        if await reschedule_single_event(reschedule_updates, req.original.to_dict()):
            # A new Event has been created, we must revert the dates on the current request item
            req.updated.dates = req.original.dates
            req.updates["dates"] = req.original.dates.to_dict()
            req.updates["state"] = req.updated.state = reschedule_updates["state"]
            req.updates["reschedule_to"] = req.updated.reschedule_to = reschedule_updates.get("reschedule_to")
            req.updates["actioned_date"] = req.updated.actioned_date = reschedule_updates.get("actioned_date")
        else:
            # The existing Event was moved, apply the new dates here
            req.updated.dates = new_event.dates
            req.updates["dates"] = new_event.dates.to_dict()

        if req.updated.state == WorkflowState.RESCHEDULED:
            # Update the history
            await UnifiedPlanningHistoryResource.get_service().on_reschedule(req.updates, req.original.to_dict())
    else:
        # Original event falls as a part of the series
        # Remove the first element in the list (the current event being updated)
        # And update the start/end dates to be in line with the new recurring rules
        req.updated.dates.start = new_event.dates.start
        req.updated.dates.end = new_event.dates.end
        req.updated.lock_user = None
        req.updated.lock_session = None
        req.updated.lock_time = None
        req.updated.lock_action = None

    # Create the new events and generate their history
    created_items = await events_service.create(generated_events, skip_signals=True)
    await events_service.on_created(generated_events)

    app = get_current_app().as_any()
    await app.on_inserted_events.call_async([item.to_dict() for item in created_items])
    return created_items


def duplicate_event_for_series(
    event: UnifiedPlanningResource, start: datetime, end: datetime, updates: dict | None = None
) -> UnifiedPlanningResource:
    if updates is None:
        updates = dict()

    new_id = generate_guid(type=GUID_NEWSML)
    updates.update(
        dict(
            _id=new_id,
            guid=new_id,
            dates={
                **event.dates.to_dict(),
                **(updates.get("dates") or {}),
                "start": start,
                "end": end,
            },
            recurrence_id=event.recurrence_id,
            pubstatus=None,
            reschedule_from=None,
            _planning_schedule=[],
            _updates_schedule=[],
        )
    )

    # Remove fields not required by new events
    for field_name, field_info in UnifiedPlanningResource.model_fields.items():
        key = field_info.alias or field_name

        if key in {"_id", "_planning_schedule", "_updates_schedule", "embedded_planning"}:
            continue
        elif (key.startswith("_") and key != TO_BE_CONFIRMED_FIELD) or key.startswith("lock_"):
            updates[field_name] = None

    new_event = event.clone_with(updates)
    set_planning_schedule(new_event)

    return new_event


async def _update_recurring_planning_items(req: ItemUpdateRequest) -> None:
    SKIP_PLANNING_FIELDS = {
        "_id",
        "guid",
        "unique_id",
        "original_creator",
        "firstcreated",
        "lock_user",
        "lock_time",
        "lock_session",
        "lock_action",
        "revert_state",
        "ingest_provider",
        "source",
        "original_source",
        "ingest_provider_sequence",
        "ingest_firstcreated",
        "ingest_versioncreated",
        "related_events",
        "state",
        "pubstatus",
        "expiry",
        "expired",
        "featured",
        "_planning_schedule",
        "_updates_schedule",
        "planning_date",
        "state_reason",
    }
    SKIP_COVERAGE_FIELDS = {
        "coverage_id",
        "original_coverage_id",
        "guid",
        "original_creator",
        "firstcreated",
        "previous_status",
    }
    app = get_current_app().as_any()
    planning_date_diff = req.updated.dates.start - req.original.dates.start
    items_service = UnifiedPlanningResource.get_service()

    async for plan in _iter_recurring_plannings_to_update(req):
        plan_updates = deepcopy(req.updates)
        for field in SKIP_PLANNING_FIELDS:
            plan_updates.pop(field, None)

        if planning_date_diff:
            plan_updates.setdefault("dates", {})["start"] = plan.dates.start + planning_date_diff

        if len(req.updated.coverages or []) and len(plan.coverages or []):
            plan_updates["coverages"] = [coverage.to_dict() for coverage in plan.coverages]

            for coverage in plan_updates["coverages"]:
                try:
                    original_coverage_id = coverage["original_coverage_id"]
                except KeyError:
                    continue

                coverage_updates = get_coverage_by_id(req.updated, original_coverage_id, "original_coverage_id")
                if coverage_updates is None:
                    continue

                for field, value in coverage_updates.to_dict().items():
                    if field in SKIP_COVERAGE_FIELDS:
                        continue
                    elif field == "assigned_to":
                        if coverage.get("workflow_status") != WorkflowState.DRAFT:
                            # This coverage has already been added to the workflow
                            # ``assigned_to`` information should be managed from the Assignment not Coverage
                            continue

                        # Copy the ``assigned_to`` data, keeping the original ``assignment_id`` (if any)
                        original_assignment_id = coverage.get("assignment_id")
                        coverage[field] = deepcopy(value)
                        if original_assignment_id is not None:
                            coverage[field]["assignment_id"] = original_assignment_id
                    elif field == "planning":
                        original_scheduled = (coverage.get("planning") or {}).get("scheduled")
                        coverage["planning"] = deepcopy(value)
                        coverage_original = get_coverage_by_id(
                            req.original, original_coverage_id, "original_coverage_id"
                        )
                        if coverage_original is not None:
                            scheduled_diff = value["scheduled"] - coverage_original.planning.scheduled
                            coverage["planning"]["scheduled"] = original_scheduled + scheduled_diff
                        else:
                            coverage["planning"]["scheduled"] = original_scheduled
                    else:
                        coverage[field] = deepcopy(value)

            # Add new Coverages that were added during this update request
            for coverage in req.updates["coverages"]:
                if get_coverage_by_id(req.original, coverage["coverage_id"]) is not None:
                    # Skip this one, as this Coverage exists in the original
                    continue

                new_coverage = deepcopy(coverage)
                for field in SKIP_COVERAGE_FIELDS:
                    new_coverage.pop(field, None)

                # Remove the Assignment ID (if any)
                try:
                    new_coverage["assigned_to"].pop("assignment_id", None)
                except (KeyError, TypeError, AttributeError):
                    pass

                # Set the new scheduled date, relative to the planning date
                try:
                    plan_date = (plan_updates.get("dates") or {}).get("start") or plan.dates.start
                    if plan_date:
                        scheduled_diff = coverage["planning"]["scheduled"] - req.updated.dates.start
                        new_coverage["planning"]["scheduled"] = plan_date + scheduled_diff
                except (KeyError, TypeError):
                    pass

                plan_updates["coverages"].append(new_coverage)

        plan_updates.pop("update_method", None)
        await items_service.update(plan.id, plan_updates)
        await app.on_updated_planning.call_async(plan_updates, {"_id": plan.id, "type": PlanningItemType.PLANNING})


async def _iter_recurring_plannings_to_update(req: ItemUpdateRequest):
    if not req.original.planning_recurrence_id:
        return

    selected_start = req.updated.dates.start or req.original.dates.start
    lookup = {"planning_recurrence_id": req.original.planning_recurrence_id}

    async for plan in await UnifiedPlanningResource.get_service().find(lookup, use_mongo=True):
        if plan.id == req.original.id:
            # Skip this Planning item, as it is the same item provided to the update request
            continue
        elif req.updated.update_method == UpdateMethods.FUTURE and plan.dates.start < selected_start:
            continue
        yield plan
