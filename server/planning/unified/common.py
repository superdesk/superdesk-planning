from typing import Literal, cast
from collections.abc import AsyncGenerator, Generator
import logging
from dataclasses import dataclass
from datetime import timedelta, datetime, time, date, timezone
import re

from quart_babel import gettext
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
import pytz

from superdesk.core import get_config
from superdesk.core.types import ProjectedFieldArg, SortParam
from superdesk.core.resources.cursor import ResourceCursorAsync
from superdesk.core.utils import str_to_date
from superdesk.utc import utcnow
from superdesk.errors import SuperdeskApiError

from planning.types import WorkflowState, PostStates, CoverageItem
from planning.types.unified import (
    UnifiedPlanningResource,
    PlanningItemType,
    RelatedEventLink,
    RelatedEventLinkType,
    ItemScheduleEntry,
    ItemUpdateScheduleEntry,
    RecurringFrequency,
)
from planning.common import get_max_recurrent_events


logger = logging.getLogger(__name__)

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
    max_results: int | None = None,
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

    query: dict = {"query": {"bool": bool_query}}
    if max_results is not None:
        query["size"] = max_results

    service = UnifiedPlanningResource.get_service()
    return await service.search(query, projection=projection)


async def event_has_planning_items(
    event_id: str, link_type: RelatedEventLinkType | None = RelatedEventLinkType.PRIMARY
) -> bool:
    """Whether an Event has related Planning items, querying the unified index.

    Uses an Elasticsearch ``count`` (no document retrieval) rather than fetching
    the matched items. Replaces the legacy ``planning.utils.event_has_planning_items``
    which reads the (now empty) legacy ``planning`` elastic index.
    """
    related_events_filters: list[dict] = [{"terms": {"related_events._id": [event_id]}}]
    if link_type is not None:
        related_events_filters.append({"term": {"related_events.link_type": link_type}})

    query = {
        "query": {
            "bool": {
                "filter": {
                    "nested": {
                        "path": "related_events",
                        "query": {"bool": {"filter": related_events_filters}},
                    },
                }
            }
        }
    }
    return await UnifiedPlanningResource.get_service().count(query) > 0


def _items_by_agenda_query(agenda_id) -> dict:
    return {
        "query": {
            "bool": {
                "filter": [
                    {"term": {"agendas": str(agenda_id)}},
                ]
            }
        }
    }


async def get_items_by_agenda_id(agenda_id) -> ResourceCursorAsync[UnifiedPlanningResource]:
    """Get the items referencing the given Agenda, from the unified index."""
    return await UnifiedPlanningResource.get_service().search(_items_by_agenda_query(agenda_id))


async def agenda_has_items(agenda_id) -> bool:
    """Whether any item references the given Agenda, using an ES count."""
    return await UnifiedPlanningResource.get_service().count(_items_by_agenda_query(agenda_id)) > 0


async def get_series(
    recurrence_id: str,
    item_type: PlanningItemType | None = PlanningItemType.EVENT,
    sort: SortParam | None = None,
    max_results: int | None = None,
    exclude_ids: list[str] | str | None = None,
    exclude_states: list[WorkflowState] | None = None,
) -> AsyncGenerator[UnifiedPlanningResource, None]:
    service = UnifiedPlanningResource.get_service()

    query: dict = {"recurrence_id": recurrence_id}
    if item_type is not None:
        query["type"] = item_type.value

    if exclude_ids:
        if not isinstance(exclude_ids, list):
            exclude_ids = [exclude_ids]

        if len(exclude_ids) == 1:
            query["_id"] = {"$ne": exclude_ids[0]}
        else:
            query["_id"] = {"$nin": exclude_ids}

    if exclude_states:
        query["state"] = {"$nin": exclude_states}

    if sort is None:
        sort = [("dates.start", 1)]

    if max_results is None:
        max_results = get_max_recurrent_events()

    page = 1

    while True:
        results = await service.find(query, sort=sort, page=page, max_results=max_results, use_mongo=True)

        docs = await results.to_list()
        if not docs:
            break

        page += 1

        # Yield the results for iteration by the callee
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

    if not selected.recurrence_id:
        return [], [], []

    excluded_states: list[WorkflowState] = []

    if not spiked:
        excluded_states.append(WorkflowState.SPIKED)
    if not rescheduled:
        excluded_states.append(WorkflowState.RESCHEDULED)
    if not cancelled:
        excluded_states.append(WorkflowState.CANCELLED)
    if not postponed:
        excluded_states.append(WorkflowState.POSTPONED)

    historic: list[UnifiedPlanningResource] = []
    past: list[UnifiedPlanningResource] = []
    future: list[UnifiedPlanningResource] = []

    now = utcnow()
    async for event in get_series(selected.recurrence_id, exclude_ids=selected.id, exclude_states=excluded_states):
        if event.dates.end < now:
            historic.append(event)
        elif event.dates.start < selected.dates.start:
            past.append(event)
        elif event.dates.start > selected.dates.start:
            future.append(event)

    return historic, past, future


def _get_until_datetime(until: datetime | str | None, tz: pytz.BaseTzInfo | None, all_day: bool) -> datetime | None:
    if not until:
        # No value provided, simply return here
        return None
    elif isinstance(until, str):
        # A string value was provided, attempt to convert it to a `datetime` instance
        until = cast(datetime | None, str_to_date(until))
        if not until:
            raise SuperdeskApiError.badRequestError(gettext("Failed to parse recurring_rule.until param"))

    if until.tzinfo is None:

        until = pytz.UTC.localize(until)
    if tz:
        until = until.astimezone(tz)
    if all_day:
        return datetime.combine(until.date(), time(23, 59, 59, 999000))
    return until.replace(tzinfo=None, hour=23, minute=59, second=59, microsecond=999000)


def _get_start_date(start: datetime, tz: pytz.BaseTzInfo | None, all_day: bool) -> datetime:
    if not tz:
        # If not timezone provided,
        return start
    elif all_day:
        # For all-day recurrences, keep recurrence anchored to UTC day boundaries.
        # Interpret UNTIL using the event timezone's local day, then map that to
        # the UTC end-of-day for stable cross-timezone behavior.
        if start.tzinfo:
            # start is expected to be UTC; just normalize for naive rrule usage
            start = start.replace(tzinfo=None)
    else:
        try:
            # start can already be localized
            start = pytz.UTC.localize(start)
        except ValueError:
            pass

        start = start.astimezone(tz).replace(tzinfo=None)

    return start


def generate_recurring_dates(
    start: datetime,
    frequency: RecurringFrequency,
    interval: int = 1,
    until: datetime | str | None = None,
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
    until = _get_until_datetime(until, tz, all_day)
    start = _get_start_date(start, tz, all_day)

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
            return (tz.localize(dt).astimezone(pytz.UTC).date() for dt in dates)
        else:
            return (tz.localize(dt).astimezone(pytz.UTC) for dt in dates)
    else:
        if date_only:
            return (occurrence_date.date() for occurrence_date in dates)
        else:
            return (occurrence_date.replace(tzinfo=timezone.utc) for occurrence_date in dates)


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
            async for related_item in await get_related_planning_for_events([event_id], link_type):
                yield related_item
            return

    if item.recurrence_id:
        # This is a recurring series, get all Events & Planning items in the series
        async for related_item in await service.find({"recurrence_id": item.recurrence_id}):
            yield related_item
    else:
        async for related_item in await get_related_planning_for_events([item.id], link_type):
            yield related_item


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


def convert_unified_planning_to_legacy_format(item: dict) -> None:
    def set_description_text(doc: dict):
        description = doc.get("definition_long", None) or doc.get("definition_short", None)
        if description:
            doc["description_text"] = description

    if item.get("type") == PlanningItemType.PLANNING.value:
        dates = item.pop("dates", {})
        if not item.get("planning_date"):
            item["planning_date"] = dates.get("start")
        item["all_day"] = dates.get("all_day") is True
        set_description_text(item)

    if item.get("coverages"):
        for coverage in item["coverages"]:
            set_description_text(coverage.get("planning") or {})

            coverage_planning = coverage.get("planning") or {}
            if keyword := coverage_planning.get("keywords", None):
                coverage["planning"]["keyword"] = keyword


def convert_legacy_planning_to_unified_format(item: dict) -> None:
    if item.get("type") == PlanningItemType.PLANNING.value:
        item.setdefault("dates", {})
        if not item["dates"].get("start"):
            item["dates"]["start"] = item.pop("planning_date", None)
        if "all_day" not in item["dates"]:
            item["dates"]["all_day"] = item.get("all_day") is True
        if description_text := item.get("description_text", None):
            item["definition_long"] = description_text

    if item.get("coverages"):
        for coverage in item["coverages"]:
            coverage_planning = coverage.get("planning") or {}
            if description_text := coverage_planning.get("description_text", None):
                coverage_planning["definition_long"] = description_text

            coverage_planning = coverage.get("planning") or {}
            if keywords := coverage_planning.get("keyword"):
                coverage["planning"]["keywords"] = keywords


def overwrite_event_expiry_date(event: UnifiedPlanningResource) -> None:
    # TODO-UNIFIED: Is this needed just for Events, or can this be used for Planning as well?
    expiry_minutes = get_config(int, "PLANNING_EXPIRY_MINUTES", None)
    if event.expiry is not None and expiry_minutes is not None:
        if event.dates.end:
            event.expiry = event.dates.end + timedelta(minutes=expiry_minutes)


def post_on_update_required(req: ItemUpdateRequest) -> bool:
    if req.updated.pubstatus is not None:
        return True
    elif req.original.pubstatus == PostStates.USABLE:
        # From item actions
        return True

    return False


def get_coverage_by_id(
    item: UnifiedPlanningResource,
    coverage_id: str,
    field: str = "coverage_id",
) -> CoverageItem | None:
    if not item.coverages:
        return None

    for coverage in item.coverages:
        if getattr(coverage, field, None) == coverage_id:
            return coverage

    return None
