# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2024 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import click
import logging
from datetime import timedelta, datetime
from typing import AsyncGenerator, Any

from superdesk import get_resource_service
from superdesk.core import get_app_config
from superdesk.core.utils import date_to_str
from superdesk.utc import utcnow
from superdesk.lock import lock, unlock
from superdesk.celery_task_utils import get_lock_id
from planning.item_lock import LOCK_ACTION, LOCK_SESSION, LOCK_TIME, LOCK_USER
from planning.utils import get_service, try_cast_object_id
from .async_cli import planning_cli

logger = logging.getLogger(__name__)


@planning_cli.command("planning:purge_expired_locks")
@click.option(
    "--resource",
    "-r",
    required=True,
    help="The name of the resource to purge item locks for (e.g., events, planning, assignments, all)",
)
@click.option(
    "--expire-hours",
    "-e",
    required=False,
    type=int,
    default=24,
    help="Purges locks that are older than this many hours (default: 24 hours)",
)
async def purge_expired_locks_command(resource: str, expire_hours: int = 24):
    """
    Purge item locks that are linked to a non-existing session

    --resource, -r: The name of the resource to purge item locks for
    --expire-hours, -e: Purges locks that are older than this many hours

    Example:
    ::

        $ python manage.py planning:purge_expired_locks -r events
        $ python manage.py planning:purge_expired_locks -r planning
        $ python manage.py planning:purge_expired_locks -r assignments
        $ python manage.py planning:purge_expired_locks -r all
        $ python manage.py planning:purge_expired_locks -r all -e 48
    """
    return await purge_expired_locks_handler(resource, expire_hours)


async def purge_expired_locks_handler(resource: str, expire_hours: int = 24):
    logger.info("Starting to purge expired item locks")

    if resource == "all":
        resources = ["events", "planning", "assignments"]
    elif resource not in ["events", "planning", "assignments"]:
        raise ValueError(f"Invalid resource: {resource}")
    else:
        resources = [resource]

    lock_name = get_lock_id("purge_expired_locks", resource)
    if not lock(lock_name, expire=600):
        logger.info("purge expired locks task is already running")
        return

    expiry_datetime = utcnow() - timedelta(hours=expire_hours)
    for resource_name in resources:
        try:
            await purge_item_locks(resource_name, expiry_datetime)
        except Exception as err:
            logger.exception(f"Failed to purge item locks ({err})")

    unlock(lock_name)
    logger.info("Completed purging expired item locks")


async def purge_item_locks(resource: str, expiry_datetime: datetime):
    logger.info(f"Purging expired locks for {resource}")
    resource_service = get_service(resource)
    try:
        autosave_service = get_resource_service("event_autosave" if resource == "events" else f"{resource}_autosave")
    except KeyError:
        autosave_service = None

    async for items in get_locked_items(resource, expiry_datetime):
        failed_ids = []
        for item in items:
            try:
                item_id = try_cast_object_id(item["_id"])
            except KeyError:
                logger.exception("Item ID not found, unable to purge its lock")
                continue

            try:
                # Remove all lock information from this item
                await resource_service.system_update(
                    item_id,
                    {
                        LOCK_USER: None,
                        LOCK_ACTION: None,
                        LOCK_SESSION: None,
                        LOCK_TIME: None,
                    },
                )
            except Exception as err:
                logger.exception(f"Failed to purge item lock ({err})")
                failed_ids.append(item_id)
                continue

            if autosave_service is None:
                continue

            try:
                # Delete any autosave items associated with this item
                autosave_service.delete_action(lookup={"_id": item_id})
            except Exception as err:
                logger.exception(f"Failed to delete autosave item(s) ({err})")

        num_items = len(items)
        num_success = num_items - len(failed_ids)
        if num_success != num_items:
            logger.warning(f"{num_success}/{num_items} {resource} locks purged. Failed IDs: {failed_ids}")
        else:
            logger.info(f"{num_items} {resource} locks purged")


async def get_locked_items(resource: str, expiry_datetime: datetime) -> AsyncGenerator[list[dict[str, Any]], None]:
    resource_service = get_service(resource)
    total_received = 0
    query: dict[str, Any] = {
        "query": {
            "bool": {
                "filter": {"range": {LOCK_TIME: {"lt": date_to_str(expiry_datetime)}}},
            },
        },
        "size": get_app_config("MAX_EXPIRY_QUERY_LIMIT"),
        "sort": [{LOCK_TIME: "asc"}],
    }

    for i in range(get_app_config("MAX_EXPIRY_LOOPS")):
        query["from"] = total_received
        results = await resource_service.search(query)
        items = await results.to_list_raw()

        num_results = len(items)

        if not num_results:
            break

        total_received += num_results

        yield items
