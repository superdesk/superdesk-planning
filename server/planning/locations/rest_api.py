from planning.common import format_address

from superdesk.core.types import Request, RestGetResponse
from superdesk.core.resources import ResourceRestEndpoints


class LocationsRestEndpoints(ResourceRestEndpoints):
    async def on_fetched(self, request: Request, doc: RestGetResponse) -> None:
        """
        Overriding to format location address for multi-item response
        """
        for item in doc.get("_items", []):
            format_address(item)

    async def on_fetched_item(self, request: Request, doc: dict) -> None:
        """
        Overriding to format location address for single item response
        """
        format_address(doc)
