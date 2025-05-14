import arrow
import re
import pytz

from datetime import date, datetime
from dateutil.rrule import rrule, DAILY, WEEKLY, MONTHLY, YEARLY, MO, TU, WE, TH, FR, SA, SU
from typing import AsyncGenerator, Any, Generator, Tuple, Literal, cast
from eve.utils import ParsedRequest

from apps.archive.common import get_auth
from apps.auth import get_user_id

from superdesk import get_resource_service, json
from superdesk.core.types import SortParam, SortListParam
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.utc import utcnow
from superdesk.resource_fields import ID_FIELD
from superdesk.metadata.item import GUID_NEWSML
from superdesk.metadata.utils import generate_guid

from planning.common import (
    TEMP_ID_PREFIX,
    UPDATE_SINGLE,
    WORKFLOW_STATE,
    get_max_recurrent_events,
    is_valid_event_planning_reason,
    set_ingested_event_state,
    update_post_item,
)
from planning.types import EventResourceModel, UpdateMethods
from planning.types.event import EmbeddedPlanning, EmbeddedPlanningCoverage
from planning.item_lock import LOCK_USER, LOCK_SESSION, LOCK_ACTION


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
            coverages={_get_coverage_id(coverage): coverage for coverage in planning.coverages.values()},
        )
        for planning in event.embedded_planning or []
        if planning.coverages
    ]


async def get_series(query: dict, sort: str | None = None, max_results: int = 25) -> AsyncGenerator[dict, None]:
    events_service = get_resource_service("events")
    page = 1

    while True:
        # Get the results from mongo
        req = ParsedRequest()
        req.sort = sort
        req.where = json.dumps(query)
        req.max_results = max_results
        req.page = page
        results = await events_service.get_from_mongo_async(req=req, lookup=None)

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

    sort = '[("dates.start", 1)]'
    max_results = get_max_recurrent_events()
    selected_start = selected.get("dates", {}).get("start", utcnow())

    # Make sure we are working with a datetime instance
    if not isinstance(selected_start, datetime):
        try:
            selected_start = arrow.get(selected_start)
        except arrow.parser.ParserError:
            raise ValueError("Invalid date format for selected_start")
        tz_str = selected.get("dates", {}).get("tz")
        if tz_str:
            selected_start = selected_start.to(tz_str).datetime
        else:
            selected_start = selected_start.to("UTC").datetime

    historic = []
    past = []
    future = []

    async for event in get_series(query, sort, max_results):
        event["dates"]["end"] = event["dates"]["end"]
        event["dates"]["start"] = event["dates"]["start"]
        for sched in event.get("_planning_schedule", []):
            sched["scheduled"] = sched["scheduled"]
        end = event["dates"]["end"]
        start = event["dates"]["start"]
        if end < utcnow():
            historic.append(event)
        elif start < selected_start:
            past.append(event)
        elif start > selected_start:
            future.append(event)

    return historic, past, future


async def pre_update_event_actions(
    updates: dict[str, Any], original: dict[str, Any], ACTION: str = "", require_lock: bool = True
):
    # Set version_creator and update ingested state
    user_id = get_user_id()
    if user_id:
        updates["version_creator"] = user_id
        set_ingested_event_state(updates, original)

    # Perform additional validation for event action
    await validate_event_action(updates, original, ACTION, require_lock)


def get_update_method(updates: dict[str, Any], original: dict[str, Any]) -> str:
    """
    Get update method for event actions that can be called outside normal resource/service model
    Based off get_update_method() from old event_base_service
    """
    update_method = updates.pop("update_method", UPDATE_SINGLE)
    if not original.get("dates", {}).get("recurring_rule"):
        return UPDATE_SINGLE
    return update_method


async def validate_event_action(
    updates: dict[str, Any],
    original: dict[str, Any],
    ACTION: str = "",
    require_lock: bool = True,
):
    """
    Generic validation for event actions that can be called outside normal resource/service model
    Based off validate() from old event_base_service
    """
    event_service = get_resource_service("events")

    if not original:
        raise SuperdeskApiError.notFoundError()

    if not await is_valid_event_planning_reason(updates, original):
        raise SuperdeskApiError.badRequestError(message="Reason is required field.")

    if original.get("state") == WORKFLOW_STATE.CANCELLED:
        raise SuperdeskApiError.forbiddenError(message="Aborted. Event is already cancelled")

    if require_lock:
        user_id = get_user_id()
        session_id = get_auth().get(ID_FIELD, None)

        lock_user = original.get(LOCK_USER, None)
        lock_session = original.get(LOCK_SESSION, None)
        lock_action = original.get(LOCK_ACTION, None)

        if not lock_user:
            raise SuperdeskApiError.forbiddenError(message="The event must be locked")
        elif str(lock_user) != str(user_id):
            raise SuperdeskApiError.forbiddenError(message="The event is locked by another user")
        elif str(lock_session) != str(session_id):
            raise SuperdeskApiError.forbiddenError(message="The event is locked by you in another session")
        elif str(lock_action) != ACTION:
            raise SuperdeskApiError.forbiddenError(
                message="The lock must be for the `{}` action".format(ACTION.lower().replace("_", " "))
            )

    event_service.validate_event(updates, original)


async def post_update_event_actions(
    updates: dict[str, Any],
    original: dict[str, Any],
    ACTION: str = "",
    update_post: bool = True,
):
    """
    Generic post update function for event actions that can be called outside normal resource/service model
    Based off on_updated() from old event_base_service
    """
    # Send a notification if the LOCK has been removed as a result of the update
    if original.get("lock_user") and "lock_user" in updates and updates.get("lock_user") is None:
        push_notification(
            "events:unlock",
            item=str(original.get(ID_FIELD)),
            user=str(get_user_id()),
            lock_session=str(get_auth().get("_id")),
            etag=updates.get("_etag"),
            recurrence_id=original.get("recurrence_id") or None,
            type=original.get("type"),
        )

    push_event_notification(ACTION, updates, original)

    if update_post:
        await update_post_item(updates, original)


def push_event_notification(name: str, updates: dict[str, Any], original: dict[str, Any]):
    """
    Generic push event notification function
    Based off push_notification() from old event_base_service
    """
    session = get_auth().get(ID_FIELD, "")

    data = {
        "item": str(original.get(ID_FIELD)),
        "user": str(updates.get("version_creator", "")),
        "session": str(session),
    }

    if original.get("dates", {}).get("recurring_rule", None):
        data["recurrence_id"] = str(updates.get("recurrence_id", original.get("recurrence_id", "")))
        name += ":recurring"

    push_notification("events:" + name, **data)


def remove_fields(new_event: dict[str, Any], extra_fields=None):
    """
    Generic function to remove fields not required by new event
    Based off remove_fields() from old event_base_service
    """
    for f in {
        "_id",
        "guid",
        "unique_name",
        "unique_id",
        "lock_user",
        "lock_time",
        "lock_session",
        "lock_action",
        "_created",
        "_updated",
        "_etag",
        "pubstatus",
        "reason",
        "duplicate_to",
        "duplicate_from",
        "reschedule_to",
        "actioned_date",
    }:
        new_event.pop(f, None)

    if extra_fields:
        for f in extra_fields:
            new_event.pop(f, None)


def set_planning_schedule(event: dict[str, Any]):
    """
    Generic function to set planning schedule
    Based off remove_fields() from old event_base_service
    """
    if event and event.get("dates") and event["dates"].get("start"):
        event["_planning_schedule"] = [{"scheduled": event["dates"]["start"]}]
