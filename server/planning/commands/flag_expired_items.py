from datetime import timedelta, datetime
from bson.objectid import ObjectId
from contextvars import ContextVar
from typing import Any

from planning.events import EventsAsyncService
from planning.planning import PlanningAsyncService
from superdesk.core import get_app_config
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock, remove_locks
from superdesk.notification import push_notification
from .async_cli import planning_cli

from planning.utils import get_related_planning_for_events, get_related_event_ids_for_planning


log_msg_context: ContextVar[str] = ContextVar("log_msg", default="")


@planning_cli.command("planning:flag_expired")
async def flag_expired_items_command():
    """
    Flag expired `Events` and `Planning` items with `{'expired': True}`.

    Example:
    ::

        $ python manage.py planning:flag_expired

    """
    return await flag_expired_items_handler()


async def flag_expired_items_handler():
    now = utcnow()
    log_msg = f"Expiry Time: {now}."
    log_msg_context.set(log_msg)

    logger.info(f"{log_msg} Starting to remove expired content at.")

    expire_interval = get_app_config("PLANNING_EXPIRY_MINUTES", 0)
    if expire_interval == 0:
        logger.info(f"{log_msg} PLANNING_EXPIRY_MINUTES=0, not flagging items as expired")
        return

    lock_name = get_lock_id("planning", "flag_expired")
    if not lock(lock_name, expire=610):
        logger.info(f"{log_msg} Flag expired items task is already running")
        return

    expiry_datetime = now - timedelta(minutes=expire_interval)

    try:
        await flag_expired_events(expiry_datetime)
    except Exception as e:
        logger.exception(e)

    try:
        await flag_expired_planning(expiry_datetime)
    except Exception as e:
        logger.exception(e)

    unlock(lock_name)

    logger.info(f"{log_msg} Completed flagging expired items.")
    remove_locks()
    logger.info(f"{log_msg} Starting to remove expired planning versions.")
    remove_expired_published_planning()
    logger.info(f"{log_msg} Completed removing expired planning versions.")


async def flag_expired_events(expiry_datetime: datetime):
    """
    Flags events and related plans as `expired` if their schedules are before or equal to the provided expiry_datetime.

    - Events locked by users are skipped.
    - Events with schedules extending beyond expiry_datetime are considered "in use" and not flagged.
    - Expired events and their related plans are updated with {"expired": True}.
    - Notifications are pushed for expired events and plans.
    """
    log_msg = log_msg_context.get()
    logger.info(f"{log_msg} Starting to flag expired events")
    events_service = EventsAsyncService()
    planning_service = PlanningAsyncService()

    locked_events = set()
    events_in_use = set()
    events_expired = set()
    plans_expired = set()

    # Obtain the full list of Events that we're to process first
    # As subsequent queries will change the list of returned items
    events = dict()
    async for items in events_service.get_expired_items(expiry_datetime):
        events.update({item[ID_FIELD]: item for item in items})

    set_event_plans(events)

    for event_id, event in events.items():
        if event.get("lock_user"):
            locked_events.add(event_id)
        elif is_event_in_use(event, expiry_datetime):
            events_in_use.add(event_id)
        else:
            events_expired.add(event_id)
            await events_service.system_update(event_id, {"expired": True})
            for plan in event.get("_plans", []):
                plan_id = plan[ID_FIELD]
                await planning_service.system_update(plan_id, {"expired": True})
                plans_expired.add(plan_id)

    if len(locked_events) > 0:
        logger.info(f"{log_msg} Skipping {len(locked_events)} locked Events: {list(locked_events)}")

    if len(events_in_use) > 0:
        logger.info(f"{log_msg} Skipping {len(events_in_use)} Events in use: {list(events_in_use)}")

    if len(events_expired) > 0:
        push_notification("events:expired", items=list(events_expired))

    if len(plans_expired) > 0:
        push_notification("planning:expired", items=list(plans_expired))

    logger.info(f"{log_msg} {len(events_expired)} Events expired: {list(events_expired)}")


async def flag_expired_planning(expiry_datetime: datetime):
    """
    Flags planning items as expired if their schedule has passed the provided expiry_datetime.

    - It skips planning items that are locked by users.
    - All other planning items are marked as expired by setting the `expired` field to `True`.
    - A notification is pushed with the items' ids that have been flagged as expired.
    """

    log_msg = log_msg_context.get()
    logger.info(f"{log_msg} Starting to flag expired planning items")
    planning_service = PlanningAsyncService()

    # Obtain the full list of Planning items that we're to process first
    # As subsequent queries will change the list of returned items
    plans = dict()
    async for items in planning_service.get_expired_items(expiry_datetime):
        plans.update({item[ID_FIELD]: item for item in items})

    locked_plans = set()
    plans_expired = set()

    for plan_id, plan in plans.items():
        if plan.get("lock_user"):
            locked_plans.add(plan_id)
        else:
            await planning_service.system_update(plan[ID_FIELD], {"expired": True})
            plans_expired.add(plan_id)

    if len(locked_plans) > 0:
        logger.info(f"{log_msg} Skipping {len(locked_plans)} locked Planning items: {list(locked_plans)}")

    if len(plans_expired) > 0:
        push_notification("planning:expired", items=list(plans_expired))

    logger.info(f"{log_msg} {len(plans_expired)} Planning items expired: {list(plans_expired)}")


def set_event_plans(events: dict[str, dict[str, Any]]) -> None:
    """
    Populates each event in the given dictionary with its related planning items.

    This function retrieves planning items associated with the provided events and
    adds them to each event under the `_plans` key. The relationship between events
    and plans is determined through a "primary".

    Side Effects:
        - The `events` dictionary is modified in place.
        - Each event gains a `_plans` key containing a list of related planning items.
    """
    for plan in get_related_planning_for_events(list(events.keys()), "primary"):
        for related_event_id in get_related_event_ids_for_planning(plan, "primary"):
            event = events[related_event_id]
            if "_plans" not in event:
                event["_plans"] = []
            event["_plans"].append(plan)


def is_event_in_use(event: dict[str, Any], expiry_datetime: datetime) -> bool:
    """
    Checks if an event is considered 'in use' by comparing its latest
    scheduled date to the provided expiry_datetime.
    """
    return get_latest_scheduled_date(event) > expiry_datetime


def get_latest_scheduled_date(event: dict[str, Any]) -> datetime:
    """
    Calculates the latest scheduled date for a given event, considering:
    - The event's own end date
    - The planning_date of any related plans
    - The scheduled dates of any coverages within related plans

    Returns:
        datetime: The latest scheduled datetime.
    """
    latest_scheduled = datetime.strptime(event["dates"]["end"], "%Y-%m-%dT%H:%M:%S%z")

    # Check related plans' planning dates
    for plan in event.get("_plans", []):
        planning_date = plan.get("planning_date", latest_scheduled)

        # First check the Planning item's planning date
        # and compare to the Event's end date
        if latest_scheduled < planning_date:
            latest_scheduled = planning_date

        # Next go through all the coverage's scheduled dates
        # and compare to the latest scheduled date
        for planning_schedule in plan.get("_planning_schedule", []):
            scheduled = planning_schedule.get("scheduled")
            if scheduled and isinstance(scheduled, str):
                scheduled = datetime.strptime(scheduled, "%Y-%m-%dT%H:%M:%S%z")

            if scheduled and (latest_scheduled < scheduled):
                latest_scheduled = scheduled

    return latest_scheduled


def remove_expired_published_planning():
    """Expire planning versions

    Expiry of the planning versions mirrors the expiry of items within the publish queue in Superdesk so it uses the
    same configuration value
    """
    expire_interval = get_app_config("PUBLISH_QUEUE_EXPIRY_MINUTES", 0)
    if expire_interval:
        expire_time = utcnow() - timedelta(minutes=expire_interval)
        logger.info("Removing planning history items created before {}".format(str(expire_time)))

        get_resource_service("published_planning").delete({"_id": {"$lte": ObjectId.from_datetime(expire_time)}})
