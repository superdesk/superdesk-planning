# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2026-02-16 14:30

from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from superdesk.core.resources import AsyncResourceService
from superdesk.commands.data_updates import BaseDataUpdate

from planning.types import EventResourceModel, PlanningResourceModel, AssignmentResourceModel


class DataUpdate(BaseDataUpdate):
    """Remove ``anpa_category.scheme`` from the database"""

    resource = "events"
    use_async_resources = True

    async def forwards(self, _collection: AsyncIOMotorCollection, _database: AsyncIOMotorDatabase) -> None:
        await self._fix_events()
        await self._fix_planning()
        await self._fix_assignments()

    async def _fix_events(self) -> None:
        service = EventResourceModel.get_service()
        async for item in self.iterate_items(service):
            if self._remove_scheme(item):
                await service.system_update(item["_id"], {"anpa_category": item["anpa_category"]})

    async def _fix_planning(self) -> None:
        service = PlanningResourceModel.get_service()
        async for item in self.iterate_items(service):
            updates: dict = {}
            if self._remove_scheme(item):
                updates["anpa_category"] = item["anpa_category"]

            coverages_updated = False
            coverages: list[dict] = item.get("coverages", [])
            for coverage in coverages:
                if self._remove_scheme(coverage.get("planning") or {}):
                    coverages_updated = True

            if coverages_updated:
                updates["coverages"] = coverages

            if updates:
                await service.system_update(item["_id"], updates)

    async def _fix_assignments(self) -> None:
        service = AssignmentResourceModel.get_service()
        async for item in self.iterate_items(service):
            if self._remove_scheme(item.get("planning") or {}):
                await service.system_update(item["_id"], {"planning": item["planning"]})

    async def iterate_items(self, service: AsyncResourceService) -> AsyncGenerator[dict, None]:
        def _get_query(field_prefix: str = "") -> dict:
            return {"exists": {"field": f"{field_prefix}anpa_category.scheme"}}

        query: dict
        if service.resource_name == "events":
            query = {"query": {"bool": {"must": _get_query()}}}
        elif service.resource_name == "assignments":
            query = {"query": {"bool": {"must": _get_query("planning.")}}}
        elif service.resource_name == "planning":
            query = {
                "query": {
                    "bool": {
                        "should": [
                            _get_query(),
                            {
                                "nested": {
                                    "path": "coverages",
                                    "query": {"bool": {"must": [_get_query("coverages.planning.")]}},
                                }
                            },
                        ],
                        "minimum_should_match": 1,
                    }
                }
            }
        else:
            print(f"Unknown datasource: {service.resource_name}")
            return

        cursor = service.get_all_batch_elastic_raw(query)

        item = await anext(cursor, None)
        if item is None:
            print(f"No {service.resource_name} documents with `anpa_category.scheme` found")
            return

        yield item
        async for item in cursor:
            yield item

    def _remove_scheme(self, item: dict) -> bool:
        categories: list[dict] = item.get("anpa_category", [])
        if not categories:
            return False

        categories_updated = False
        for category in categories:
            if category.get("scheme"):
                category["scheme"] = None
                categories_updated = True

        return categories_updated

    async def backwards(self, _collection: AsyncIOMotorCollection, _database: AsyncIOMotorDatabase) -> None:
        pass
