from datetime import datetime, time, timezone
from zoneinfo import ZoneInfo

from quart_babel import gettext

from superdesk.errors import SuperdeskApiError

from planning.types import WorkflowState
from planning.types.unified import UnifiedPlanningResource, RelatedEventLink, RelatedEventLinkType
from planning.common import update_post_item
from planning.utils import get_planning_event_link_method
from planning.publish.common import validate_item_for_publish

from .common import (
    set_planning_schedule,
    ItemUpdateRequest,
    get_related_event_ids,
    get_related_planning_for_events,
    overwrite_event_expiry_date,
    post_on_update_required,
)
from .notifications import send_unlock_notification
from .actions.cancel import process_cancel_planning_item


async def on_event_create(event: UnifiedPlanningResource) -> None:
    overwrite_event_expiry_date(event)


async def on_event_created(event: UnifiedPlanningResource) -> None:
    if event.planning_item:
        await _link_to_planning(event)


async def on_event_update(req: ItemUpdateRequest) -> None:
    # Validate template
    if "template" in req.updates and req.updates["template"] != req.original.template:
        raise SuperdeskApiError.badRequestError(
            message=gettext("Request is not valid"),
            payload={"template": "This value can't be changed."},
        )

    if post_on_update_required(req):
        await validate_item_for_publish(req.updated.to_dict())

    # Determine if we need to keep the "dates" around
    link_method = get_planning_event_link_method()
    recurring_rules_changed = req.updated.dates.recurring_rule != req.original.dates.recurring_rule
    if link_method == "many_secondary" or recurring_rules_changed:
        # Modifying `dates` field supported
        # make sure to update the scheduled fields
        set_planning_schedule(req.updated)
    else:
        # Modifying `dates` field is not supported
        # remove them from the request
        req.updates.pop("dates", None)
        req.updated.dates = req.original.dates

    if req.updated.lock_action == "mark_completed" and not req.original.recurrence_id:
        validate_mark_event_complete(req, req.original, req.original)
        await cancel_related_planning_coverages(req.original.id)


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


def validate_mark_event_complete(
    req: ItemUpdateRequest, first_event: UnifiedPlanningResource, last_event: UnifiedPlanningResource
) -> None:
    """
    Validates and assigns the `actioned_date` for marking a single event or a series of recurring events
    as complete. Ensures that the completion date is within the bounds of the event's start and end dates.

    :param req: Instance of `ItemUpdateRequest` containing the updated request data.
    :param first_event: Instance of `UnifiedPlanningResource` representing the first event in the series.
    :param last_event: Instance of `UnifiedPlanningResource` representing the last event in the series.
    """

    event_tz = ZoneInfo(req.updated.dates.tz) if req.updated.dates.tz else timezone.utc
    today_in_event_tz = datetime.now(event_tz).date()
    start_date = (
        first_event.dates.start.date()
        if first_event.dates.all_day
        else first_event.dates.start.astimezone(event_tz).date()
    )
    end = last_event.dates.end or last_event.dates.start
    end_date = (
        end.date()
        if last_event.dates.all_day or (last_event.dates.no_end_time and last_event.dates.end is not None)
        else end.astimezone(event_tz).date()
    )

    if not req.updated.actioned_date:
        # ``actioned_date`` was not provided, assign one now (defaults to today in the Event's timezone)
        req.updated.actioned_date = datetime.combine(today_in_event_tz, time.min, tzinfo=event_tz)

    actioned_date = req.updated.actioned_date.astimezone(event_tz).date()

    # If the Event or Recurring Event is in future, raise an error
    if start_date > today_in_event_tz:
        if not req.original.recurrence_id:
            raise SuperdeskApiError.badRequestError(gettext("Event has not started."))
        else:
            raise SuperdeskApiError.badRequestError(gettext("Recurring series has not started."))
    elif end_date < today_in_event_tz:
        if not req.original.recurrence_id:
            raise SuperdeskApiError.badRequestError(gettext("Event has already finished."))
        else:
            raise SuperdeskApiError.badRequestError(gettext("Recurring series has already finished."))
    elif start_date > actioned_date:
        if not req.original.recurrence_id:
            raise SuperdeskApiError.badRequestError(gettext("Completed date is before Event start date."))
        else:
            raise SuperdeskApiError.badRequestError(gettext("Completed date is before Recurring series start date."))
    elif actioned_date > end_date:
        if not req.original.recurrence_id:
            raise SuperdeskApiError.badRequestError(gettext("Completed date is after Event end date."))
        else:
            raise SuperdeskApiError.badRequestError(gettext("Completed date is after Recurring series end date."))


async def cancel_related_planning_coverages(event_id: str) -> None:
    """
    Cancels all related planning coverages for a given event.

    This function retrieves all related planning items linked to an event
    using the specified event ID. For each related planning item, if its
    state is not already set to "CANCELLED" and it contains coverages, the
    planning item is processed to cancel all associated coverages with a
    specific cancellation reason.

    :param event_id: ID of the event for which the related planning coverages need to be cancelled.
    """

    cursor = await get_related_planning_for_events([event_id], RelatedEventLinkType.PRIMARY)
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
