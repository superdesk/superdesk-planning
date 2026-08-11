# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import click
from typing import Dict, Any, AsyncGenerator

from superdesk.commands import cli
from superdesk.errors import SuperdeskApiError

from planning.types import PlanningRelatedEventLink, Planning
from planning.types.unified import UnifiedPlanningResource
from planning.utils import get_first_related_event_id_for_planning


logger = logging.getLogger(__name__)


@cli.command("planning:replace_deprecated_event_item_attribute")
@click.option("--dry-run", "-d", default=False)
@click.option("--revert", "-r", default=False)
async def replace_deprecated_event_item_attribute_command(dry_run: bool, revert: bool):
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
    await ReplaceDeprecatedEventItemAttributeCommand().run(dry_run, revert)


class ReplaceDeprecatedEventItemAttributeCommand:
    async def run(self, dry_run: bool, revert: bool):
        print("Replacing deprecated 'event_item' attribute in Planning resource items")
        await self.upgrade(dry_run) if not revert else await self.downgrade(dry_run)

    async def upgrade(self, dry_run: bool):
        updated = 0
        async for original in self.get_items(True):
            related_event = PlanningRelatedEventLink(_id=original["event_item"], link_type="primary")
            if original.get("recurrence_id"):
                related_event["recurrence_id"] = original["recurrence_id"]

            updated += await self.update_item(
                original, {"related_events": [related_event], "event_item": None}, dry_run
            )

        if not dry_run:
            print("")
        print(f"Done. Upgraded {updated} items")

    async def downgrade(self, dry_run: bool):
        updated = 0

        async for original in self.get_items(False):
            updates: Dict[str, Any] = {
                "event_item": get_first_related_event_id_for_planning(original),
                "related_events": [],
            }
            updated += await self.update_item(original, updates, dry_run)

        if not dry_run:
            print("")
        print(f"Done. Downgraded {updated} items")

    async def update_item(self, original: Planning, updates: Planning, dry_run: bool) -> int:
        if dry_run:
            print("update", original["_id"], updates)
        else:
            try:
                await UnifiedPlanningResource.get_service().system_update(original["_id"], updates)
                print(".", end="")
            except SuperdeskApiError as err:
                print("x")  # Add line break so the exception starts on its own line
                logger.exception(err)
                return 0

        return 1

    async def get_items(self, for_upgrade: bool) -> AsyncGenerator[Planning, None]:
        last_id = None
        size = 500
        max_iterations = 10000

        # Query mongo directly, as ``event_item`` is not in the unified resource schema anymore
        collection = UnifiedPlanningResource.get_service().mongo_async
        lookup: Dict[str, Any] = (
            {"type": "planning", "event_item": {"$ne": None}}
            if for_upgrade
            else {"type": "planning", "related_events": {"$exists": True, "$nin": [None, []]}}
        )

        for i in range(max_iterations):
            _lookup = lookup if last_id is None else {"$and": [lookup, {"_id": {"$gt": last_id}}]}
            items = await collection.find(_lookup).sort("_id").limit(size).to_list(length=size)
            if not len(items):
                break
            for item in items:
                yield item
                last_id = item["_id"]
        else:
            logger.warning("Not enough iterations for planning resource")
