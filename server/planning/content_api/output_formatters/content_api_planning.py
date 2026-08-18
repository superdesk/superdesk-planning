from superdesk.core import get_config

from planning.output_formatters.json_planning import JsonPlanningFormatter
from planning.unified.common import convert_unified_planning_to_legacy_format

from ..utils import format_base_content_api_item


class ContentApiPlanningFormatter(JsonPlanningFormatter):
    name = "ContentAPI Planning"
    type = "content_api_planning"

    format_type = "json_planning"
    resource_type = "planning"

    remove_fields = None
    translate_names = None
    include_files = None

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        # TODO-UNIFIED: Remove once we upgrade ContentAPI to new schema
        convert_unified_planning_to_legacy_format(item)
        capi_item = await self._get_resource_instance(await super()._format_item(item), subscribers)

        if get_config(bool, "CONTENTAPI_HIDE_COVERAGE_ASSIGNEES", False):
            for coverage in capi_item.get("coverages", []):
                coverage.pop("assigned_user", None)
                coverage.pop("assigned_desk", None)

        return capi_item

    async def _get_resource_instance(self, item: dict, subscribers: list[dict] | None) -> dict:
        return dict(
            **await format_base_content_api_item(item, subscribers),
            planning_date=item.get("planning_date"),
            description_text=item.get("description_text"),
            agendas=item.get("agendas"),
            events=item.get("events"),
            coverages=item.get("coverages"),
            headline=item.get("headline"),
            urgency=item.get("urgency"),
            _planning_schedule=item.get("_planning_schedule"),
        )
