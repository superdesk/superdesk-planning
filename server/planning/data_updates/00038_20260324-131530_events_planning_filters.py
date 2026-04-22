# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2026-03-24 13:15

from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from superdesk.commands.data_updates import BaseDataUpdate
from planning.search import EventsPlanningFiltersAsyncService


class DataUpdate(BaseDataUpdate):
    """Update ``events_planning_filters`` to fix invalid schedule attributes"""

    resource = "events_planning_filters"
    use_async_resources = True

    async def forwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase) -> None:
        service = EventsPlanningFiltersAsyncService()
        async for search_filter in collection.find({}):
            if not search_filter.get("schedules"):
                continue

            service.set_schedule(search_filter)
            await collection.find_one_and_update(
                {"_id": search_filter["_id"]}, {"$set": {"schedules": search_filter["schedules"]}}
            )

    async def backwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase) -> None:
        pass
