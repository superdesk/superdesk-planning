from datetime import timedelta, datetime
from bson.objectid import ObjectId
from contextvars import ContextVar
from typing import Any, Literal

from superdesk.core import get_config
from superdesk.core.utils import str_to_date
from superdesk.commands import cli
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock
from superdesk.notification import push_notification

from planning.common import remove_lock_information
from planning.search.queries import elastic

from planning.utils import get_related_event_ids_for_planning
from planning.unified.common import get_related_planning_for_events
from planning.types.unified import UnifiedPlanningResource, RelatedEventLinkType
from .utils import iterate_expired_items


log_msg_context: ContextVar[str] = ContextVar("log_msg", default="")


@cli.command("planning:flag_expired")
async def flag_expired_items_command():
    """
    Flag expired `Events` and `Planning` items with `{'expired': True}`.

    Example:
    ::

        $ python manage.py planning:flag_expired

    .. versionchanged:: 3.1
        - Removes any lock information from the item (locks would already be too old).
        - Uses bulk update operations in batches to improve performance

    """
    return await flag_expired_items_handler()


async def flag_expired_items_handler():
    now = utcnow()
    log_msg = f"Expiry Time: {now}."
    log_msg_context.set(log_msg)

    logger.info(f"{log_msg} Starting to remove expired content at.")

    expire_interval = get_config(int, "PLANNING_EXPIRY_MINUTES", 0)
    if expire_interval == 0:
        logger.info(f"{log_msg} PLANNING_EXPIRY_MINUTES=0, not flagging items as expired")
        return

    lock_name = get_lock_id("planning", "flag_expired")
    if not lock(lock_name, expire=610):
        logger.info(f"{log_msg} Flag expired items task is already running")
        return

    expiry_datetime = now - timedelta(minutes=expire_interval)

    try:
        try:
            await flag_expired_items("event", expiry_datetime)
        except Exception as e:
            logger.exception(e)

        try:
            await flag_expired_items("planning", expiry_datetime)
        except Exception as e:
            logger.exception(e)
    finally:
        unlock(lock_name)

    logger.info(f"{log_msg} Completed flagging expired items.")
    logger.info(f"{log_msg} Starting to remove expired planning versions.")
    await remove_expired_published_planning()
    logger.info(f"{log_msg} Completed removing expired planning versions.")


async def flag_expired_items(resource_type: Literal["event", "planning"], expiry_datetime: datetime):
    """
    Flags items and related plans as `expired` if their schedules are before or equal to the provided expiry_datetime.

    - Item locks will be removed.
    - Events with schedules extending beyond expiry_datetime are considered "in use" and not flagged.
    - Expired events and their related plans are updated with {"expired": True}.
    - Notifications are pushed for expired events and plans.
    """

    log_msg = log_msg_context.get()
    logger.info(f"{log_msg} Starting to flag expired {resource_type}s")

    processing_events = resource_type == "event"
    events_in_use: set[str] = set()
    items_expired: set[str] = set()
    plans_expired: set[str] = set()

    projection: list[str] = [] if not processing_events else ["dates"]
    base_query: dict = {"must_not": [elastic.term("expired", True)]}

    if resource_type == "planning":
        # Skip Planning items with a primary link to an Event,
        # as this will be processed when processing the Event
        base_query["must_not"].append(
            elastic.nested(
                "related_events",
                elastic.term("related_events.link_type", "primary"),
            )
        )

    # We can safely remove the lock, as the lock would be too old now anyway
    updates = remove_lock_information({"expired": True})

    async for items in iterate_expired_items(resource_type, expiry_datetime, base_query, projection):
        plans: dict[str, list[dict]] = await get_event_plans(items) if processing_events else {}
        events_to_expire: set[str] = set()
        planning_to_expire: set[str] = set()

        for item in items:
            item_id = item[ID_FIELD]

            if not processing_events:
                planning_to_expire.add(item_id)
            else:
                item_plans: list[dict] = plans.get(item_id, [])
                if is_event_in_use(item, item_plans, expiry_datetime):
                    # This Event is linked to a Planning item that's not eligible for expiry yet
                    # Skipping this one
                    events_in_use.add(item_id)
                    continue

                events_to_expire.add(item_id)
                for plan in item_plans:
                    plan_id: str = plan[ID_FIELD]
                    planning_to_expire.add(plan_id)
                    plans_expired.update(plan_id)

            items_expired.add(item_id)

        ids_to_expire = events_to_expire | planning_to_expire
        if ids_to_expire:
            await UnifiedPlanningResource.get_service().bulk_update(ids_to_expire, updates.copy())

        logger.info(
            f"{log_msg} {len(events_to_expire)} Events expired, {len(planning_to_expire)} Planning items expired"
        )

    if len(events_in_use) > 0:
        logger.info(f"{log_msg} Skipping {len(events_in_use)} Events in use: {list(events_in_use)}")

    if len(items_expired) > 0:
        push_resource_name = "events" if processing_events else "planning"
        push_notification(f"{push_resource_name}:expired", items=list(items_expired))

    if len(plans_expired) > 0:
        push_notification("planning:expired", items=list(plans_expired))

    logger.info(f"{log_msg} {len(items_expired)} {resource_type}s expired")


async def get_event_plans(events: list[dict[str, Any]]) -> dict[str, list[dict]]:
    """
    Populates each event in the given dictionary with its related planning items.

    This function retrieves planning items associated with the provided events and
    adds them to each event under the `_plans` key. The relationship between events
    and plans is determined through a "primary".

    Side Effects:
        - The `events` dictionary is modified in place.
        - Each event gains a `_plans` key containing a list of related planning items.
    """

    plans: dict[str, list[dict]] = {}
    event_ids = [event[ID_FIELD] for event in events]

    projection = {"_planning_schedule": 1, "dates": 1, "related_events": 1}
    cursor = await get_related_planning_for_events(event_ids, RelatedEventLinkType.PRIMARY, projection=projection)
    for plan in await cursor.to_list_raw():
        for related_event_id in get_related_event_ids_for_planning(plan, "primary"):
            plans.setdefault(related_event_id, []).append(plan)
    return plans


def is_event_in_use(event: dict[str, Any], plans: list[dict], expiry_datetime: datetime) -> bool:
    """
    Checks if an event is considered 'in use' by comparing its latest
    scheduled date to the provided expiry_datetime.
    """
    return get_latest_scheduled_date(event, plans) > expiry_datetime


def get_latest_scheduled_date(event: dict[str, Any], plans: list[dict]) -> datetime:
    """
    Calculates the latest scheduled date for a given event, considering:
    - The event's own end date
    - The planning_date of any related plans
    - The scheduled dates of any coverages within related plans

    Returns:
        datetime: The latest scheduled datetime.
    """
    latest_scheduled = str_to_date(event["dates"]["end"])

    # Check related plans' planning dates
    for plan in plans:
        planning_date = (plan.get("dates") or {}).get("start") or latest_scheduled
        if isinstance(planning_date, str):
            planning_date = str_to_date(planning_date)

        # First check the Planning item's planning date
        # and compare to the Event's end date
        if latest_scheduled < planning_date:
            latest_scheduled = planning_date

        # Next go through all the coverage's scheduled dates
        # and compare to the latest scheduled date
        for planning_schedule in plan.get("_planning_schedule", []):
            scheduled = planning_schedule.get("scheduled")
            if scheduled and isinstance(scheduled, str):
                scheduled = str_to_date(scheduled)

            if scheduled and (latest_scheduled < scheduled):
                latest_scheduled = scheduled

    return latest_scheduled


async def remove_expired_published_planning():
    """Expire planning versions

    Expiry of the planning versions mirrors the expiry of items within the publish queue in Superdesk so it uses the
    same configuration value
    """
    expire_interval = get_config(int, "PUBLISH_QUEUE_EXPIRY_MINUTES", 0)
    if expire_interval:
        expire_time = utcnow() - timedelta(minutes=expire_interval)
        logger.info(f"Removing published_planning items created before {expire_time}")

        await get_resource_service("published_planning").delete_async(
            {"_id": {"$lte": ObjectId.from_datetime(expire_time)}}
        )
