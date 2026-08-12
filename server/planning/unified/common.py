from collections.abc import AsyncGenerator
import logging
from dataclasses import dataclass

from quart_babel import gettext

from superdesk.core import get_config
from superdesk.core.types import ProjectedFieldArg
from superdesk.core.resources.cursor import ResourceCursorAsync
from superdesk.utc import utcnow
from superdesk.errors import SuperdeskApiError

from planning.types import WorkflowState
from planning.types.unified import (
    UnifiedPlanningResource,
    PlanningItemType,
    RelatedEventLink,
    RelatedEventLinkType,
    ItemScheduleEntry,
    ItemUpdateScheduleEntry,
    PlanningItemType,
)


logger = logging.getLogger(__name__)


@dataclass
class ItemUpdateRequest:
    original: UnifiedPlanningResource
    updates: dict
    updated: UnifiedPlanningResource


def get_planning_schedule(
    doc: UnifiedPlanningResource,
) -> tuple[list[ItemScheduleEntry], list[ItemUpdateScheduleEntry]]:
    """This set the list of schedule based on the coverage and planning.

    Sorting currently works on two fields "dates.start" and "coverages[x].planning.scheduled" date.
    created from event or current date for adhoc planning item
    "scheduled" is stored on the coverage nested document and it is optional.
    Hence to sort and filter planning based on these two dates a
    nested documents of scheduled date is required

    :param original: The planning document
    """

    add_default_schedule = True
    add_default_updates_schedule = True
    schedule: list[ItemScheduleEntry] = []
    updates_schedule: list[ItemUpdateScheduleEntry] = []
    for coverage in doc.coverages or []:
        if coverage.planning.scheduled:
            add_default_schedule = False

        schedule.append(ItemScheduleEntry(coverage_id=coverage.coverage_id, scheduled=coverage.planning.scheduled))

        for scheduled_update in coverage.scheduled_updates or []:
            if scheduled_update.planning.scheduled:
                add_default_updates_schedule = False

            updates_schedule.append(
                ItemUpdateScheduleEntry(
                    scheduled_update_id=scheduled_update.scheduled_update_id,
                    scheduled=scheduled_update.planning.scheduled,
                )
            )

    if add_default_schedule:
        schedule.append(ItemScheduleEntry(coverage_id=None, scheduled=doc.dates.start))

    if add_default_updates_schedule:
        updates_schedule.append(ItemUpdateScheduleEntry(scheduled_update_id=None, scheduled=doc.dates.start))

    return schedule, updates_schedule


def set_planning_schedule(doc: UnifiedPlanningResource) -> None:
    schedule, updates_schedule = get_planning_schedule(doc)
    doc.planning_schedule = schedule
    doc.updates_schedule = updates_schedule


def get_related_event_links(
    doc: UnifiedPlanningResource, link_type: RelatedEventLinkType | None = None
) -> list[RelatedEventLink]:
    if not doc.related_events:
        return []

    return (
        doc.related_events
        if link_type is None
        else [related_event for related_event in doc.related_events if related_event.link_type == link_type]
    )


def get_related_event_ids(doc: UnifiedPlanningResource, link_type: RelatedEventLinkType | None = None) -> list[str]:
    return [related_event._id for related_event in get_related_event_links(doc, link_type)]


def get_first_related_event_id(
    doc: UnifiedPlanningResource, link_type: RelatedEventLinkType | None = None
) -> str | None:
    try:
        return get_related_event_links(doc, link_type)[0]._id
    except (KeyError, IndexError, TypeError):
        return None


async def get_related_events(
    doc: UnifiedPlanningResource, link_type: RelatedEventLinkType | None = None
) -> list[UnifiedPlanningResource]:
    event_ids = get_related_event_ids(doc, link_type)
    if not len(event_ids):
        return []

    events = await UnifiedPlanningResource.get_service().find_by_ids(event_ids)

    if len(events) != len(event_ids):
        logger.warning(
            "Not all Events were found for the Planning item",
            extra=dict(plan_id=doc.id, event_ids_requested=event_ids, event_ids_found=[event.id for event in events]),
        )

    return events


async def get_related_planning_for_events(
    event_ids: list[str],
    link_type: RelatedEventLinkType | None = None,
    exclude_planning_ids: list[str] | None = None,
    projection: ProjectedFieldArg | None = None,
) -> ResourceCursorAsync[UnifiedPlanningResource]:
    related_events_filters: list[dict] = [{"terms": {"related_events._id": event_ids}}]
    if link_type is not None:
        related_events_filters.append({"term": {"related_events.link_type": link_type}})

    bool_query: dict = {
        "filter": {
            "nested": {
                "path": "related_events",
                "query": {"bool": {"filter": related_events_filters}},
            },
        }
    }

    if len(exclude_planning_ids or []) > 0:
        bool_query["must_not"] = {"terms": {"_id": exclude_planning_ids}}

    service = UnifiedPlanningResource.get_service()
    return await service.search({"query": {"bool": bool_query}}, projection=projection)


async def get_series(
    query: dict, sort: str | None = None, max_results: int = 25
) -> AsyncGenerator[UnifiedPlanningResource, None]:
    service = UnifiedPlanningResource.get_service()
    page = 1

    while True:
        results = await service.find(query, sort=sort, page=page, max_results=max_results, use_mongo=True)

        docs = await results.to_list()
        if not docs:
            break

        page += 1

        # Yield the reuslt for iteration by the callee
        for doc in docs:
            yield doc


async def get_recurring_timeline(
    selected: UnifiedPlanningResource,
    spiked: bool = False,
    rescheduled: bool = False,
    cancelled: bool = False,
    postponed: bool = False,
) -> tuple[list[UnifiedPlanningResource], list[UnifiedPlanningResource], list[UnifiedPlanningResource]]:
    """Utility method to get all events in the series

    This splits up the series of events into 3 separate arrays.
    Historic: event.dates.start < utcnow()
    Past: utcnow() < event.dates.start < selected.dates.start
    Future: event.dates.start > selected.dates.start
    """

    excluded_states: list[WorkflowState] = []

    if not spiked:
        excluded_states.append(WorkflowState.SPIKED)
    if not rescheduled:
        excluded_states.append(WorkflowState.RESCHEDULED)
    if not cancelled:
        excluded_states.append(WorkflowState.CANCELLED)
    if not postponed:
        excluded_states.append(WorkflowState.POSTPONED)

    query: dict = {
        "$and": [
            {"type": PlanningItemType.EVENT.value},
            {"recurrence_id": selected.recurrence_id},
            {"_id": {"$ne": selected.id}},
        ]
    }

    if excluded_states:
        query["$and"].append({"state": {"$nin": excluded_states}})

    sort = '[("dates.start", 1)]'
    max_results = get_config(int, "MAX_RECURRENT_EVENTS", 200)

    # TODO-UNIFIED: Figure this next one out
    # # Make sure we are working with a datetime instance
    # if not isinstance(selected_start, datetime):
    #     try:
    #         selected_start = arrow.get(selected_start)
    #     except arrow.parser.ParserError:
    #         raise ValueError("Invalid date format for selected_start")
    #     tz_str = selected.get("dates", {}).get("tz")
    #     if tz_str:
    #         selected_start = selected_start.to(tz_str).datetime
    #     else:
    #         selected_start = selected_start.to("UTC").datetime

    historic: list[UnifiedPlanningResource] = []
    past: list[UnifiedPlanningResource] = []
    future: list[UnifiedPlanningResource] = []

    now = utcnow()
    async for event in get_series(query, sort, max_results):
        if event.dates.end < now:
            historic.append(event)
        elif event.dates.start < selected.dates.start:
            past.append(event)
        elif event.dates.start > selected.dates.start:
            future.append(event)

    return historic, past, future


async def get_all_items_in_relationship(
    item: UnifiedPlanningResource,
    link_type: RelatedEventLinkType = RelatedEventLinkType.PRIMARY,
) -> AsyncGenerator[UnifiedPlanningResource, None]:
    service = UnifiedPlanningResource.get_service()

    if item.item_type == PlanningItemType.PLANNING:
        event_id = get_first_related_event_id(item, link_type)
        if not event_id:
            # This Planning item is not linked to any Event (of the provided ``link_type``)
            # safely return without yielding any items
            return
        elif not item.recurrence_id:
            event = await service.find_by_id(event_id)
            if not event:
                raise SuperdeskApiError.badRequestError(gettext("Planning's related Event not found"))

            yield event
            async for item in await get_related_planning_for_events([event_id], link_type):
                yield item

    if item.recurrence_id:
        # This is a recurring series, get all Events & Planning items in the series
        async for item in await service.find({"recurrence_id": item.recurrence_id}):
            yield item
    else:
        async for item in await get_related_planning_for_events([item.id], link_type):
            yield item


def format_item_addresses(item: UnifiedPlanningResource, separator: str = " ") -> None:
    if not item.location:
        return

    for location in item.location:
        address = location.address
        if not address:
            location.formatted_address = ""
            continue

        formatted_address: list[str] = []
        if address.line:
            formatted_address.append(address.line[0])

        formatted_address.append(address.city or address.area or "")
        formatted_address.append(address.state or address.locality or "")
        formatted_address.append(address.postal_code or "")
        formatted_address.append(address.country or "")
        location.formatted_address = separator.join([a for a in formatted_address if a]).strip()
