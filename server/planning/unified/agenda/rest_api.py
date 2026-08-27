from superdesk.core.types import Request, RestGetResponse
from superdesk.core.resources import ResourceRestEndpoints
from superdesk.resource_fields import ITEMS

from .service import generate_planning_info


class AgendasRestEndpoints(ResourceRestEndpoints):
    async def on_fetched(self, request: Request, docs: RestGetResponse) -> None:
        await generate_planning_info(docs.get(ITEMS) or [])

    async def on_fetched_item(self, request: Request, doc: dict) -> None:
        await generate_planning_info([doc])
