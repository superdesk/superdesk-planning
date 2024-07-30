# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any, Iterator
import logging

import superdesk
from superdesk.core import get_current_app
from superdesk.errors import SuperdeskApiError

from planning.types import PlanningRelatedEventLink, Planning
from planning.utils import get_first_related_event_id_for_planning


logger = logging.getLogger(__name__)


class ReplaceDeprecatedEventItemAttributeCommand(superdesk.Command):
    """Replace deprecated ``event_item`` attribute from Planning resource items

    The ``event_item`` attribute was replaced with a ``related_events`` attribute,
    so that a Planning item can be linked to multiple Events. This command fixes older
    items to use this newer attribute

    Usage::

        # python manage.py planning:replace_deprecated_event_item_attribute

    Options:

    -d, --dry-run Don't update just print planning ids which would be updated
    -r, --revert  Replace ``related_events`` with deprecated ``event_item``
    """

    option_list = [
        superdesk.Option("--dry-run", "-d", dest="dry_run", default=False, action="store_true"),
        superdesk.Option("--revert", "-r", dest="revert", default=False, action="store_true"),
    ]

    def run(self, dry_run: bool, revert: bool):
        print("Replacing deprecated 'event_item' attribute in Planning resource items")
        self.upgrade(dry_run) if not revert else self.downgrade(dry_run)

    def upgrade(self, dry_run: bool):
        updated = 0
        for original in self.get_items(True):
            related_event = PlanningRelatedEventLink(_id=original["event_item"], link_type="primary")
            if original.get("recurrence_id"):
                related_event["recurrence_id"] = original["recurrence_id"]

            updated += self.update_item(original, {"related_events": [related_event], "event_item": None}, dry_run)

        if not dry_run:
            print("")
        print(f"Done. Upgraded {updated} items")

    def downgrade(self, dry_run: bool):
        updated = 0

        for original in self.get_items(False):
            updates: Dict[str, Any] = {
                "event_item": get_first_related_event_id_for_planning(original),
                "related_events": [],
            }
            updated += self.update_item(original, updates, dry_run)

        if not dry_run:
            print("")
        print(f"Done. Downgraded {updated} items")

    def update_item(self, original: Planning, updates: Planning, dry_run: bool) -> int:
        if dry_run:
            print("update", original["_id"], updates)
        else:
            try:
                superdesk.get_resource_service("planning").system_update(original["_id"], updates, original)
                print(".", end="")
            except SuperdeskApiError as err:
                print("x")  # Add line break so the exception starts on its own line
                logger.exception(err)
                return 0

        return 1

    def get_items(self, for_upgrade: bool) -> Iterator[Planning]:
        last_id = None
        size = 500
        max_iterations = 10000

        # Use pymongo directly, as ``event_item`` is not in the planning resource schema anymore
        app = get_current_app()
        planning_db = app.data.mongo.pymongo("planning").db["planning"]
        lookup: Dict[str, Any] = (
            {"event_item": {"$ne": None}} if for_upgrade else {"related_events": {"$exists": True, "$nin": [None, []]}}
        )
        _lookup = lookup

        for i in range(max_iterations):
            if last_id is not None:
                _lookup = {"$and": [lookup.copy(), {"_id": {"$gt": last_id}}]}
            items = list(planning_db.find(_lookup).sort("_id").limit(size))
            if not len(items):
                break
            for item in items:
                yield item
                last_id = item["_id"]
        else:
            logger.warning("Not enough iterations for planning resource")


superdesk.command("planning:replace_deprecated_event_item_attribute", ReplaceDeprecatedEventItemAttributeCommand())
