# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2024 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from datetime import timedelta

from flask import current_app as app
from eve.utils import date_to_str

from superdesk import Command, command, get_resource_service, Option
from superdesk.utc import utcnow
from superdesk.lock import lock, unlock
from superdesk.celery_task_utils import get_lock_id
from planning.item_lock import LOCK_ACTION, LOCK_SESSION, LOCK_TIME, LOCK_USER
from planning.utils import try_cast_object_id

logger = logging.getLogger(__name__)


class PurgeExpiredLocks(Command):
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

    option_list = [
        Option("--resource", "-r", required=True),
        Option("--expire-hours", "-e", dest="expire_hours", required=False, type=int, default=24),
    ]

    def run(self, resource: str, expire_hours: int = 24) -> None:
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

        expiry_datetime = date_to_str(utcnow() - timedelta(hours=expire_hours))
        for resource_name in resources:
            try:
                self._purge_item_locks(resource_name, expiry_datetime)
            except Exception as err:
                logger.exception(f"Failed to purge item locks ({err})")

        unlock(lock_name)
        logger.info("Completed purging expired item locks")

    def _purge_item_locks(self, resource: str, expiry_datetime: str):
        logger.info(f"Purging expired locks for {resource}")
        resource_service = get_resource_service(resource)
        try:
            autosave_service = get_resource_service(
                "event_autosave" if resource == "events" else f"{resource}_autosave"
            )
        except KeyError:
            autosave_service = None

        for items in self.get_locked_items(resource, expiry_datetime):
            failed_ids = []
            for item in items:
                try:
                    item_id = try_cast_object_id(item["_id"])
                except KeyError:
                    logger.exception("Item ID not found, unable to purge its lock")
                    continue

                try:
                    # Remove all lock information from this item
                    resource_service.system_update(
                        item_id,
                        {
                            LOCK_USER: None,
                            LOCK_ACTION: None,
                            LOCK_SESSION: None,
                            LOCK_TIME: None,
                        },
                        item,
                        push_notification=False,
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

    def get_locked_items(self, resource: str, expiry_datetime: str):
        service = get_resource_service(resource)
        total_received = 0
        query = {
            "query": {"bool": {"filter": [{"range": {LOCK_TIME: {"lt": expiry_datetime}}}]}},
            "size": app.config["MAX_EXPIRY_QUERY_LIMIT"],
            "sort": [{LOCK_TIME: "asc"}],
        }

        for i in range(app.config["MAX_EXPIRY_LOOPS"]):
            query["from"] = total_received
            results = list(service.search(query))
            num_results = len(results)

            if not num_results:
                break

            total_received += num_results
            yield results


command("planning:purge_expired_locks", PurgeExpiredLocks())
