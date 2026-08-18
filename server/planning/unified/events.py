from typing import Literal
from datetime import datetime, date, timedelta, time
import itertools
from collections.abc import Generator
import re

import pytz
from dateutil import parser
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
from quart_babel import gettext

from superdesk import get_resource_service
from superdesk.core import get_config, json
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.errors import SuperdeskApiError

from planning.types import UpdateMethods, PostStates, WorkflowState
from planning.types.unified import (
    UnifiedPlanningResource,
    RecurringEndMode,
    RecurringFrequency,
    EmbeddedPlanningItem,
    EmbeddedPlanningCoverage,
    RelatedEventLink,
    RelatedEventLinkType,
)
from planning.common import (
    TO_BE_CONFIRMED_FIELD,
    post_required,
    update_post_item,
)
from planning.utils import get_planning_event_link_method

from .common import set_planning_schedule, ItemUpdateRequest, get_related_event_ids, get_related_planning_for_events
from .notifications import send_unlock_notification
from .actions.cancel import process_cancel_planning_item


FREQUENCIES: dict[RecurringFrequency, Literal[0, 1, 2, 3]] = {
    RecurringFrequency.DAILY: DAILY,
    RecurringFrequency.WEEKLY: WEEKLY,
    RecurringFrequency.MONTHLY: MONTHLY,
    RecurringFrequency.YEARLY: YEARLY,
}

DAYS = {
    "MO": MO,
    "TU": TU,
    "WE": WE,
    "TH": TH,
    "FR": FR,
    "SA": SA,
    "SU": SU,
}


async def on_event_create(event: UnifiedPlanningResource, events: list[UnifiedPlanningResource]) -> None:
    _overwrite_event_expiry_date(event)

    # If _created_externally is true, generate_recurring_events is restricted.
    planning_item_id = event.planning_item
    generated_events: list[UnifiedPlanningResource] = []
    if event.dates.recurring_rule and not event.dates.recurring_rule.created_externally:
        recurring_events = generate_recurring_events(event)
        generated_events.extend(recurring_events)

        # Set the current Event to the first Event in the new series
        # This will make sure the ID of the Event can be used when
        # using 'event' from here on, such as when linking to a Planning item
        event = recurring_events[0]
        # And set the Planning Item from the origin
        # (generate_recurring_events removes this field)
        event.planning_item = planning_item_id

    if generated_events:
        events.extend(generated_events)


async def on_event_created(event: UnifiedPlanningResource) -> None:
    if event.planning_item:
        await _link_to_planning(event)


async def on_event_update(req: ItemUpdateRequest) -> None:
    # Validate recurring rule
    if req.original.lock_action == "convert_recurring" and req.updates.get("dates", {}).get("recurring_rule") is None:
        raise SuperdeskApiError.badRequestError(
            gettext("Event recurring rules are mandatory for convert to recurring action.")
        )
    if req.original.lock_action == "convert_recurring" and req.original.recurrence_id:
        raise SuperdeskApiError.badRequestError(gettext("Event is already converted to recurring event."))

    # Validate template
    if "template" in req.updates and req.updates["template"] != req.original.template:
        raise SuperdeskApiError.badRequestError(
            message=gettext("Request is not valid"),
            payload={"template": "Thie value can't be changed."},
        )

    # Run the specific methods based on if the original is a
    # single or a series of recurring events
    if not req.original.dates.recurring_rule or req.updated.update_method == UpdateMethods.SINGLE:
        await _update_single_event(req)
    else:
        await _update_recurring_events(req)


async def on_event_updated(updates: dict, original: UnifiedPlanningResource) -> None:
    if updates.get("recurrence_id") and not original.recurrence_id:
        # If this Event was converted to a recurring series
        # Then update all associated Planning items with the recurrence_id
        await _add_recurrence_id_to_planning(original.id, updates["recurrence_id"])

    if not updates.get("duplicate_to"):
        if await update_post_item(updates, original.to_dict()):
            new_event = await UnifiedPlanningResource.get_service().find_by_id(original.id)
            if not new_event:
                raise SuperdeskApiError.badRequestError(gettext("Failed to find updated item"))

            updates["_etag"] = new_event.etag
            updates["state_reason"] = new_event.state_reason

    if original.lock_user and "lock_user" in updates and updates.get("lock_user") is None:
        # When the event is unlocked by the patch
        send_unlock_notification(original, updates)

    if "location" not in updates and original.location:
        updates["location"] = original.to_dict().get("location")

    updates["_id"] = original.id


async def _add_recurrence_id_to_planning(event_id: str, recurrence_id: str) -> None:
    # If this Event was converted to a recurring series
    # Then update all associated Planning items with the recurrence_id
    cursor = await get_related_planning_for_events([event_id])
    async for plan in cursor:
        if plan.related_events:
            for event_link in plan.related_events:
                if event_link._id == event_id:
                    event_link.recurrence_id = recurrence_id

        await UnifiedPlanningResource.get_service().update(
            plan.id, {"recurrence_id": recurrence_id, "related_events": plan.to_dict().get("related_events")}
        )


def _overwrite_event_expiry_date(event: UnifiedPlanningResource) -> None:
    # TODO-UNIFIED: Is this needed just for Events, or can this be used for Planning as well?
    expiry_minutes = get_config(int, "PLANNING_EXPIRY_MINUTES", None)
    if event.expiry is not None and expiry_minutes is not None:
        if event.dates.end:
            event.expiry = event.dates.end + timedelta(minutes=expiry_minutes)


def set_recurring_mode(event: UnifiedPlanningResource):
    if event.dates.recurring_rule is None:
        return

    end_repeat_mode = event.dates.recurring_rule.end_repeat_mode
    if end_repeat_mode == RecurringEndMode.COUNT:
        event.dates.recurring_rule.until = None
    elif end_repeat_mode == RecurringEndMode.UNTIL:
        event.dates.recurring_rule.count = None


def generate_recurring_dates(
    start: datetime,
    frequency: RecurringFrequency,
    interval: int = 1,
    until: datetime | None = None,
    byday: str | None = None,
    count: int | None = 5,
    tz: pytz.BaseTzInfo | None = None,
    date_only: bool = False,
    all_day: bool = False,
    **_,
) -> Generator[datetime | date, None, None]:
    """
    Returns list of dates related to recurring rules

    :param start datetime: date when to start
    :param frequency FrequencyType: DAILY, WEEKLY, MONTHLY, YEARLY
    :param interval int: indicates how often the rule repeats as a positive integer
    :param until datetime: date after which the recurrence rule expires
    :param byday str or list: "MO TU"
    :param count int: number of occurrences of the rule
    :return Generator: list of datetime
    """

    # if tz is given, respect the timezone by starting from the local time
    # NOTE: rrule uses only naive datetime
    if tz:
        if all_day:
            # For all-day recurrences, keep recurrence anchored to UTC day boundaries.
            # Interpret UNTIL using the event timezone's local day, then map that to
            # the UTC end-of-day for stable cross-timezone behavior.
            if start.tzinfo:
                # start is expected to be UTC; just normalize for naive rrule usage
                start = start.replace(tzinfo=None)

            if until:
                if isinstance(until, str):
                    until = parser.isoparse(until)
                if until.tzinfo is None:
                    until = pytz.UTC.localize(until)
                until_local_date = until.astimezone(tz).date()
                until = datetime.combine(until_local_date, time(23, 59, 59, 999000))
        else:
            try:
                # start can already be localized
                start = pytz.UTC.localize(start)
            except ValueError:
                pass

            start = start.astimezone(tz).replace(tzinfo=None)
            if until:
                if isinstance(until, str):
                    until = parser.isoparse(until)
                if until.tzinfo is None:
                    until = pytz.UTC.localize(until)
                until = until.astimezone(tz).replace(tzinfo=None, hour=23, minute=59, second=59, microsecond=999000)

    if frequency == RecurringFrequency.DAILY:
        byday = None

    # check format of the recurring_rule byday value
    if byday and re.match(r"^-?[1-5]+.*", byday):
        # byday uses monthly or yearly frequency rule with day of week and
        # preceding day of month integer by day value
        # examples:
        # 1FR - first friday of the month
        # -2MON - second to last monday of the month
        if byday[:1] == "-":
            day_of_month = int(byday[:2])
            day_of_week = byday[2:]
        else:
            day_of_month = int(byday[:1])
            day_of_week = byday[1:]

        byweekday = DAYS.get(day_of_week)(day_of_month)  # type: ignore[misc]
    else:
        # byday uses DAYS constants
        byweekday = byday and [DAYS.get(d) for d in byday.split()] or None

    # convert count of repeats to count of events
    if count:
        count = count * (len(byday.split()) if byday else 1)

    dates = rrule(
        FREQUENCIES[frequency],
        dtstart=start,
        until=until,
        byweekday=byweekday,
        count=count,
        interval=interval,
    )
    # if a timezone has been applied, returns UTC
    if tz:
        if all_day:
            if date_only:
                return (dt.date() for dt in dates)
            else:
                return (dt for dt in dates)
        if date_only:
            return (tz.localize(dt).astimezone(pytz.UTC).replace(tzinfo=None).date() for dt in dates)
        else:
            return (tz.localize(dt).astimezone(pytz.UTC).replace(tzinfo=None) for dt in dates)
    else:
        if date_only:
            return (occurrence_date.date() for occurrence_date in dates)
        else:
            return (occurrence_date for occurrence_date in dates)


def generate_recurring_events(
    event: UnifiedPlanningResource, recurrence_id: str | None = None
) -> list[UnifiedPlanningResource]:
    if event.dates.recurring_rule is None:
        return [event]

    generated_events: list[UnifiedPlanningResource] = []
    set_recurring_mode(event)
    embedded_planning_added = False

    # compute the difference between start and end in the original event
    time_delta = event.dates.end - event.dates.start

    # for all the dates based on the reucrring rules:
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
        if occurence_date == event.dates.start:
            # Skipping this Event, as it's the original
            continue

        # create event with the new dates
        new_id = generate_guid(type=GUID_NEWSML)
        new_event = event.clone_with({"_id": new_id, "guid": new_id, "id": new_id})

        # Remove fields not required by new events
        for field_name, field_info in UnifiedPlanningResource.model_fields.items():
            key = field_info.alias or field_name

            # if key == "_id":
            #     new_event.id = generate_guid(type=GUID_NEWSML)
            if key in ("_planning_schedule", "_updates_schedule"):
                setattr(new_event, field_name, [])

            # for key, _value in new_event:
            elif (key.startswith("_") and key != TO_BE_CONFIRMED_FIELD) or key.startswith("lock_"):
                setattr(new_event, field_name, None)
            elif key == "embedded_planning":
                if not embedded_planning_added:
                    # If this is the first Event in the series, then keep
                    # the ``embedded_planning`` field for processing later
                    embedded_planning_added = True
                else:
                    # Otherwise remove the ``embedded_planning`` from all other Events
                    # in the series
                    setattr(new_event, key, None)

        new_event.pubstatus = None
        new_event.reschedule_from = None
        new_event.dates.start = occurence_date
        new_event.dates.end = occurence_date + time_delta

        # Set a unique guid
        # new_id = generate_guid(type=GUID_NEWSML)
        # new_event.id = new_id
        new_event.guid = new_event.id
        new_event.recurrence_id = recurrence_id or event.id
        _overwrite_event_expiry_date(new_event)
        set_planning_schedule(new_event)
        generated_events.append(new_event)

    return generated_events


async def _update_single_event(req: ItemUpdateRequest) -> None:
    if _post_on_update_required(req):
        # TODO-UNIFIED: Use newer events_post functionality when available
        await get_resource_service("events_post").validate_item(req.updated.to_dict())

    # Determine if we're to convert this single event to a recurring of events, either through
    # conversion from recurring form or from within the event editor
    if (
        req.original.lock_action in ["convert_recurring", "edit"]
        and req.updated.dates.recurring_rule != req.original.dates.recurring_rule
    ):
        generated_events = await _convert_to_recurring_event(req)

        # If the original event was "psoted" then post all the generated events
        if req.original.pubstatus in [PostStates.CANCELLED, PostStates.USABLE]:
            post = {
                "event": generated_events[0].id,
                "etag": generated_events[0].etag,
                "update_method": "all",
                "pubstatus": req.original.pubstatus,
            }
            await get_resource_service("events_post").post_async([post])
    else:
        if get_planning_event_link_method() == "many_secondary":
            set_planning_schedule(req.updated)
        else:
            req.updates.pop("dates", None)
            req.updated.dates = req.original.dates

        if req.original.lock_action == "mark_completed" and req.updates.get("actioned_date"):
            await _mark_event_complete(req, False)


def _post_on_update_required(req: ItemUpdateRequest) -> bool:
    if req.updated.pubstatus is not None:
        return True
    elif req.original.pubstatus == PostStates.USABLE:
        # From item actions
        return True

    return False


async def _update_recurring_events(req: ItemUpdateRequest) -> None:
    raise Exception("TODO-UNIFIED: to be implemented later")


async def _convert_to_recurring_event(req: ItemUpdateRequest) -> list[UnifiedPlanningResource]:
    """Convert a single event to a series of recurring events."""

    req.updated.recurrence_id = req.original.id

    new_event = req.updated.clone()
    # Generated new events will be draft
    new_event.state = WorkflowState.DRAFT
    generated_events = generate_recurring_events(new_event, req.updated.recurrence_id)
    updated_event = generated_events.pop(0)

    # Check to see if the first generated event is different from original
    # If yes, mark original as rescheduled with generated recurrence_id
    if updated_event.dates.start.date() != req.original.dates.start.date():
        # Reschedule original event
        raise Exception("TODO-UNIFIED: Reschedule original event")
    else:
        # Original event falls as a part of the series
        # Remove the first element in the list (the current event being updated)
        # And update the start/end dates to be in line with the new recurring rules
        req.updated.dates.start = updated_event.dates.start
        req.updated.dates.end = updated_event.dates.end
        # set_planning_schedule
        req.updated.lock_user = None
        req.updated.lock_session = None
        req.updated.lock_time = None
        req.updated.lock_action = None

    # Create the new events and generate their history
    await UnifiedPlanningResource.get_service().create(generated_events)
    return generated_events


async def _mark_event_complete(req: ItemUpdateRequest, mark_complete_validated: bool) -> None:
    # If the entire series is in future, raise an error
    if req.original.recurrence_id:
        if not mark_complete_validated:
            if req.original.dates.start.date() > req.updates["actioned_date"].date():
                raise SuperdeskApiError.badRequestError(gettext("Recurring series has not started."))

        # If we are marking an event as completed
        # Update only those which are behind the 'actioned_date'
        if req.original.dates.start < req.updates["actioned_date"]:
            return

    cursor = await get_related_planning_for_events([req.original.id], RelatedEventLinkType.PRIMARY)
    async for plan in cursor:
        if plan.state != WorkflowState.CANCELLED and plan.coverages:
            await process_cancel_planning_item(
                {"reason": "Event Completed"},
                plan.to_dict(),
                cancel_all_coverage=True,
            )


async def _link_to_planning(event: UnifiedPlanningResource) -> None:
    if not event.planning_item:
        return

    service = UnifiedPlanningResource.get_service()

    planning_item = await service.find_by_id(event.planning_item)
    if not planning_item:
        raise SuperdeskApiError.badRequestError(gettext("Planning item not found"))

    event_link_method = get_planning_event_link_method()
    link_type: RelatedEventLinkType = (
        RelatedEventLinkType.PRIMARY
        if not len(get_related_event_ids(planning_item, RelatedEventLinkType.PRIMARY))
        and event_link_method in ("one_primary", "one_primary_many_secondary")
        else RelatedEventLinkType.SECONDARY
    )

    updates: dict = {}
    related_planning = RelatedEventLink(_id=event.id, link_type=link_type)
    if event.recurrence_id:
        related_planning.recurrence_id = event.recurrence_id
        if not planning_item.recurrence_id and link_type == RelatedEventLinkType.PRIMARY:
            updates["recurrence_id"] = event.recurrence_id

    updates["related_events"] = [link.to_dict() for link in (planning_item.related_events or []) + [related_planning]]

    # TODO-UNIFIED: We need to use `system_update`, but also apply some further validation
    # because we need to update the Planning item, but without the `_etag` update
    await service.update(planning_item.id, updates)
