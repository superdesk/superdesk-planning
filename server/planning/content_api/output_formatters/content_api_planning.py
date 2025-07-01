from superdesk import get_resource_service

from planning.output_formatters.json_planning import JsonPlanningFormatter
from planning.output_formatters.utils import format_base_content_api_item


class ContentApiPlanningFormatter(JsonPlanningFormatter):
    name = "ContentAPI Planning"
    type = "content_api_planning"

    format_type = "json_planning"
    resource_type = "planning"

    remove_fields = None
    translate_names = None
    include_files = None

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        get_resource_service("planning").set_planning_schedule(item)
        item = await super()._format_item(item)
        item["subscribers"] = [subscriber["_id"] for subscriber in subscribers or []]
        return await self._get_resource_instance(item)

    async def _get_resource_instance(self, item: dict) -> dict:
        return dict(
            **await format_base_content_api_item(item),
            planning_date=item.get("planning_date"),
            description_text=item.get("description_text"),
            agendas=item.get("agendas"),
            events=item.get("events"),
            coverages=item.get("coverages"),
            headline=item.get("headline"),
            urgency=item.get("urgency"),
        )
