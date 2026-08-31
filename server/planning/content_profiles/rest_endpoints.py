from superdesk.core.types import Request, RestGetResponse
from superdesk.core.resources import ResourceRestEndpoints

from planning.types import DEFAULT_PROFILE_ID


class PlanningProfilesRestEndpoints(ResourceRestEndpoints):
    async def on_fetched_item(self, request: Request, doc: dict) -> None:
        if str(doc["_id"]) == str(DEFAULT_PROFILE_ID):
            del doc["_id"]

    async def on_fetched(self, request: Request, doc: RestGetResponse) -> None:
        for item in doc["_items"]:
            if str(item["_id"]) == str(DEFAULT_PROFILE_ID):
                del item["_id"]
