# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta
from contextvars import ContextVar

from superdesk.core import get_app_config
from superdesk.resource_fields import ID_FIELD
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock, remove_locks
from planning.common import WORKFLOW_STATE
from planning.events import EventsAsyncService
from planning.events.events_utils import get_recurring_timeline
from planning.planning import PlanningAsyncService
from planning.assignments import AssignmentsAsyncService
from .async_cli import planning_cli


log_msg_context: ContextVar[str] = ContextVar("log_msg", default="")


@planning_cli.command("planning:delete_spiked")
async def delete_spiked_items_command():
    """
    Delete expired spiked `Events` and `Planning` items.

    Example:
    ::

        $ python manage.py planning:delete_spiked

    """
    return await delete_spiked_items_handler()


async def delete_spiked_items_handler():
    now = utcnow()
    log_msg = f"Delete Spiked Items Time: {now}."
    log_msg_context.set(log_msg)

    logger.info(f"{log_msg} Starting to delete spiked items at.")

    expire_interval = get_app_config("PLANNING_DELETE_SPIKED_MINUTES", 0)
    if expire_interval == 0:
        logger.info(f"{log_msg} PLANNING_DELETE_SPIKED_MINUTES=0, not spiking any items")
        return

    lock_name = get_lock_id("planning", "delete_spiked")
    if not lock(lock_name, expire=610):
        logger.info(f"{log_msg} Delete spiked items task is already running")
        return

    expiry_datetime = now - timedelta(minutes=expire_interval)

    try:
        await delete_spiked_events(expiry_datetime)
    except Exception as e:
        logger.exception(e)

    try:
        await delete_spiked_planning(expiry_datetime)
    except Exception as e:
        logger.exception(e)

    unlock(lock_name)

    logger.info(f"{log_msg} Completed deleting spiked items.")
    remove_locks()


async def delete_spiked_events(expiry_datetime):
    log_msg = log_msg_context.get()
    logger.info(f"{log_msg} Starting to delete spiked events")
    events_service = EventsAsyncService()

    events_deleted = set()
    series_to_delete = dict()

    # Obtain the full list of Events that we're to process first
    # As subsequent queries will change the list of returned items
    events = dict()
    async for items in events_service.get_expired_items(expiry_datetime, spiked_events_only=True):
        events.update({item[ID_FIELD]: item for item in items})

    for event_id, event in events.items():
        if event.get("recurrence_id") and event["recurrence_id"] not in series_to_delete:
            spiked, events = await is_series_expired_and_spiked(event, expiry_datetime)
            if spiked:
                series_to_delete[event["recurrence_id"]] = events
        else:
            await events_service.delete_many(lookup={"_id": event_id})
            events_deleted.add(event_id)

    # Delete recurring series
    for recurrence_id, events in series_to_delete.items():
        await events_service.delete_many(lookup={"recurrence_id": recurrence_id})
        events_deleted.add([event["_id"] for event in events])

    logger.info(f"{log_msg} {len(events_deleted)} Events deleted: {list(events_deleted)}")


async def is_series_expired_and_spiked(event, expiry_datetime):
    historic, past, future = await get_recurring_timeline(event, spiked=True, postponed=True)

    # There are future events, so the entire series is not expired.
    if len(future) > 0:
        return False, []

    def check_series_expired_and_spiked(series):
        for event in series:
            if event.get("state") != WORKFLOW_STATE.SPIKED or event["dates"]["end"] > expiry_datetime:
                return False

        return True

    if check_series_expired_and_spiked(historic) and check_series_expired_and_spiked(past):
        return True, [historic + past]

    return False, []


async def delete_spiked_planning(expiry_datetime):
    log_msg = log_msg_context.get()
    logger.info(f"{log_msg} Starting to delete spiked planning items")
    planning_service = PlanningAsyncService()

    # Obtain the full list of Planning items that we're to process first
    # As subsequent queries will change the list of returnd items
    plans = dict()
    async for items in planning_service.get_expired_items(expiry_datetime, spiked_planning_only=True):
        plans.update({item[ID_FIELD]: item for item in items})

    plans_deleted = set()
    assignments_deleted = set()
    assignments_to_delete = []

    for plan_id, plan in plans.items():
        for coverage in plan.get("coverages") or []:
            assignment_id = (coverage.get("assigned_to") or {}).get("assignment_id")
            if assignment_id:
                assignments_to_delete.append(assignment_id)

        # Now, delete the planning item
        await planning_service.delete_many(lookup={"_id": plan_id})
        plans_deleted.add(plan_id)

    # Delete assignments
    assignment_service = AssignmentsAsyncService()
    for assign_id in assignments_to_delete:
        await assignment_service.delete_many(lookup={"_id": assign_id})
        assignments_deleted.add(assign_id)

    logger.info(f"{log_msg} {len(assignments_deleted)} Assignments deleted: {list(assignments_deleted)}")
    logger.info(f"{log_msg} {len(plans_deleted)} Planning items deleted: {list(plans_deleted)}")
