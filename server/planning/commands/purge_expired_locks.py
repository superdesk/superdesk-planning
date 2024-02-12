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

from flask import current_app as app
from eve.utils import date_to_str

from superdesk import Command, command, get_resource_service, Option
from superdesk.utc import utcnow
from superdesk.lock import lock, unlock
from superdesk.celery_task_utils import get_lock_id
from planning.item_lock import LOCK_ACTION, LOCK_SESSION, LOCK_TIME, LOCK_USER

logger = logging.getLogger(__name__)


class PurgeExpiredLocks(Command):
    """
    Purge item locks that are linked to a non-existing session

    resource: The name of the resource to purge item locks for

    Example:
    ::

        $ python manage.py planning:purge_expired_locks -r events
        $ python manage.py planning:purge_expired_locks -r planning
        $ python manage.py planning:purge_expired_locks -r assignments
    """

    option_list = [Option("--resource", "-r", required=True)]

    def run(self, resource: str):
        logger.info("Starting to purge expired item locks")

        lock_name = get_lock_id("purge_expired_locks", resource)
        if not lock(lock_name, expire=600):
            logger.info("purge expired locks task is already running")
            return

        try:
            self._purge_item_locks(resource)
        except Exception as err:
            logger.exception(f"Failed to purge item locks ({err})")
        finally:
            unlock(lock_name)

        logger.info("Completed purging expired item locks")

    def _purge_item_locks(self, resource: str):
        resource_service = get_resource_service(resource)
        try:
            autosave_service = get_resource_service(
                "event_autosave" if resource == "events" else f"{resource}_autosave"
            )
        except KeyError:
            autosave_service = None

        for items in self.get_locked_items(resource):
            failed_ids = []
            for item in items:
                try:
                    item_id = item["_id"]
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
                logger.warning(f"{num_success}/{num_items} item locks purged. Failed IDs: {failed_ids}")
            else:
                logger.info(f"{num_items} item locks purged")

    def get_locked_items(self, resource: str):
        now = utcnow()
        active_sessions = [str(session["_id"]) for session in get_resource_service("auth").get(req=None, lookup={})]
        service = get_resource_service(resource)
        total_received = 0
        query = {
            "query": {
                "bool": {
                    "filter": [
                        {"exists": {"field": LOCK_SESSION}},
                        # Use a range filter for lock time, so if this task takes a while
                        # it will exclude any newer item locks and/or sessions
                        {"range": {LOCK_TIME: {"lt": date_to_str(now)}}},
                    ],
                    "must_not": [
                        {"terms": {LOCK_SESSION: active_sessions}},
                    ],
                },
            },
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
