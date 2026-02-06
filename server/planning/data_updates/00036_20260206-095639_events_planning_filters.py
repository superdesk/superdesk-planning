# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2026-02-06 09:56

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from superdesk.commands.data_updates import BaseDataUpdate


class DataUpdate(BaseDataUpdate):
    """Update ``events_planning_filters`` to use ObjectId instead of string for IDs"""

    resource = "events_planning_filters"
    use_async_resources = True

    async def forwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase) -> None:
        async for search_filter in collection.find({}):
            original_id = search_filter["_id"]
            if ObjectId.is_valid(original_id):
                # This is a valid ObjectId, no need to update
                continue

            # As we cannot modify the ``_id`` of an existing document (as it is an immutable primary key),
            # we must first create a new document with the new ID, then delete the old one.
            search_filter["_id"] = ObjectId()
            await collection.insert_one(search_filter)
            await collection.delete_one({"_id": original_id})

    async def backwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase) -> None:
        pass
