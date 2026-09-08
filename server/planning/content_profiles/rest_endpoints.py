from superdesk.core.types import Request, RestGetResponse
from superdesk.core.resources import ResourceRestEndpoints

from planning.types import DEFAULT_PROFILE_ID


class PlanningProfilesRestEndpoints(ResourceRestEndpoints):
    async def on_fetched_item(self, request: Request, doc: dict) -> None:
        self._strip_fields_not_required(doc)

    async def on_fetched(self, request: Request, doc: RestGetResponse) -> None:
        for item in doc["_items"]:
            self._strip_fields_not_required(item)

    def _strip_fields_not_required(self, item: dict):
        if str(item["_id"]) == str(DEFAULT_PROFILE_ID):
            # Remove the `_id` so the front-end knows this is a default profile
            # and not one that exists in the DB
            del item["_id"]
            item.pop("content_type", None)

        if not (item.get("content_type") or "").strip():
            # If the `content_type` doesn't have a value, then remove it
            item.pop("content_type", None)
