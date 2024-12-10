import re
import pytz

from datetime import date, datetime
from typing import AsyncGenerator, Any, Generator, Tuple, Literal, cast

from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU

from superdesk.utc import utcnow
from superdesk.resource_fields import ID_FIELD
from superdesk.metadata.item import GUID_NEWSML
from superdesk.metadata.utils import generate_guid
from superdesk.core.types import SortParam, SortListParam

from planning.types import EventResourceModel, UpdateMethods
from planning.types.event import EmbeddedPlanning, EmbeddedPlanningCoverage
from planning.common import TEMP_ID_PREFIX, WORKFLOW_STATE, get_max_recurrent_events


FrequencyType = Literal["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]

FREQUENCIES = {
    "DAILY": DAILY,
    "WEEKLY": WEEKLY,
    "MONTHLY": MONTHLY,
    "YEARLY": YEARLY,
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


def generate_recurring_dates(
    start: datetime,
    frequency: FrequencyType,
    interval: int = 1,
    until: datetime | None = None,
    byday: str | None = None,
    count: int = 5,
    tz: pytz.BaseTzInfo | None = None,
    date_only: bool = False,
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
        try:
            # start can already be localized
            start = pytz.UTC.localize(start)
        except ValueError:
            pass
        start = start.astimezone(tz).replace(tzinfo=None)
        if until:
            until = until.astimezone(tz).replace(tzinfo=None)

    if frequency == "DAILY":
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

    # TODO: use dateutil.rrule.rruleset to incude ex_date and ex_rule
    dates = rrule(
        FREQUENCIES.get(frequency),
        dtstart=start,
        until=until,
        byweekday=byweekday,
        count=count,
        interval=interval,
    )
    # if a timezone has been applied, returns UTC
    if tz:
        if date_only:
            return (tz.localize(dt).astimezone(pytz.UTC).replace(tzinfo=None).date() for dt in dates)
        else:
            return (tz.localize(dt).astimezone(pytz.UTC).replace(tzinfo=None) for dt in dates)
    else:
        if date_only:
            return (date.date() for date in dates)
        else:
            return (date for date in dates)


def get_events_embedded_planning(event: dict[str, Any] | EventResourceModel) -> list[EmbeddedPlanning]:
    if isinstance(event, dict):
        event = EventResourceModel.from_dict(event)
        event = cast(EventResourceModel, event)

    def _get_coverage_id(coverage: EmbeddedPlanningCoverage) -> str:
        if not coverage.coverage_id:
            coverage.coverage_id = TEMP_ID_PREFIX + "-" + generate_guid(type=GUID_NEWSML)
        return coverage.coverage_id

    return [
        EmbeddedPlanning(
            planning_id=planning.planning_id,
            update_method=planning.update_method or UpdateMethods.SINGLE,
            coverages={_get_coverage_id(coverage): coverage for coverage in planning.coverages},
        )
        for planning in event.embedded_planning
    ]


async def get_series(
    query: dict, sort: SortParam | None = None, max_results: int = 25
) -> AsyncGenerator[EventResourceModel, None]:
    events_service = EventResourceModel.get_service()
    page = 1

    while True:
        # Get the results from mongo
        results = await events_service.find(req=query, page=page, max_results=max_results, sort=sort, use_mongo=True)

        docs = await results.to_list()
        if not docs:
            break

        page += 1

        # Yield the results for iteration by the callee
        for doc in docs:
            yield doc


async def get_recurring_timeline(
    selected: dict[str, Any],
    spiked: bool = False,
    rescheduled: bool = False,
    cancelled: bool = False,
    postponed: bool = False,
) -> Tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Utility method to get all events in the series

    This splits up the series of events into 3 separate arrays.
    Historic: event.dates.start < utcnow()
    Past: utcnow() < event.dates.start < selected.dates.start
    Future: event.dates.start > selected.dates.start
    """
    excluded_states = []

    if not spiked:
        excluded_states.append(WORKFLOW_STATE.SPIKED)
    if not rescheduled:
        excluded_states.append(WORKFLOW_STATE.RESCHEDULED)
    if not cancelled:
        excluded_states.append(WORKFLOW_STATE.CANCELLED)
    if not postponed:
        excluded_states.append(WORKFLOW_STATE.POSTPONED)

    query = {
        "$and": [
            {"recurrence_id": selected["recurrence_id"]},
            {"_id": {"$ne": selected[ID_FIELD]}},
        ]
    }

    if excluded_states:
        query["$and"].append({"state": {"$nin": excluded_states}})

    sort: SortListParam = [("dates.start", 1)]
    max_results = get_max_recurrent_events()
    selected_start = selected.get("dates", {}).get("start", utcnow())

    # Make sure we are working with a datetime instance
    if not isinstance(selected_start, datetime):
        selected_start = datetime.strptime(selected_start, "%Y-%m-%dT%H:%M:%S%z")

    historic = []
    past = []
    future = []

    async for event in get_series(query, sort, max_results):
        end = event.dates.end if event.dates else None
        start = event.dates.start if event.dates else None
        if end and end < utcnow():
            historic.append(event.to_dict())
        elif start and start < selected_start:
            past.append(event.to_dict())
        elif start and start > selected_start:
            future.append(event.to_dict())

    return historic, past, future
