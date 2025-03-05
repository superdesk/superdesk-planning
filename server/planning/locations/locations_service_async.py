from typing import Any

from planning.core.service import BasePlanningAsyncService
from planning.events.events_service import EventsAsyncService
from planning.types import LocationResourceModel

from superdesk.resource_fields import ID_FIELD


class LocationsAsyncService(BasePlanningAsyncService[LocationResourceModel]):
    async def delete_many(self, lookup: dict[str, Any]) -> list[str]:
        """
        If the document to be deleted is referenced in an event, flag it as inactive otherwise just delete it.
        """
        if lookup:
            location = await self.find_by_id(lookup[ID_FIELD])
            if location:
                events_count = await EventsAsyncService().count({"location.qcode": str(location.guid)})
                if events_count > 0:
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
