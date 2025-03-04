from typing import Any

from planning.core.service import BasePlanningAsyncService
from planning.events.events_service import EventsAsyncService
from planning.types import LocationResourceModel

from superdesk.core.types import SearchRequest
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.resource_fields import ID_FIELD


class LocationsAsyncService(BasePlanningAsyncService[LocationResourceModel]):
    async def on_create(self, docs: list[LocationResourceModel]) -> None:
        await super().on_create(docs)

        for doc in docs:
            if not doc.guid:
                doc.guid = generate_guid(type=GUID_NEWSML)

    async def delete_many(self, lookup: dict[str, Any]) -> list[str]:
        """
        If the document to be deleted is reference in an event then flag it as inactive otherwise just delete it.
        """
        if lookup:
            location = await self.find_by_id(lookup.get(ID_FIELD, ""))
            if location:
                search_request = SearchRequest(where={"location.qcode": str(location.guid)})
                events = await EventsAsyncService().find(search_request)
                if await events.count() > 0:
                    # Update the unique name in case the location get recreated
                    await self.update(
                        location.id,
                        {
                            "is_active": False,
                            "unique_name": str(location.id),
                        },
                    )
                    return []

        return await super().delete_many(lookup)
