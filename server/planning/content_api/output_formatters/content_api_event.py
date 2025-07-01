from planning.types import PlanningSchedule
from planning.output_formatters.json_event import JsonEventFormatter
from planning.output_formatters.utils import format_base_content_api_item


class ContentApiEventFormatter(JsonEventFormatter):
    name = "Content API Event"
    type = "content_api_event"

    format_type = "json_event"
    resource_type = "event"

    remove_fields = None
    translate_names = None
    include_files = None

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        item = await super()._format_item(item)
        item.update(
            {
                "subscribers": [subscriber["_id"] for subscriber in subscribers or []],
                "planning_schedule": [PlanningSchedule(scheduled=item["dates"]["start"])],
            }
        )
        return await self._get_resource_instance(item)

    async def _get_resource_instance(self, item: dict) -> dict:
        return dict(
            **await format_base_content_api_item(item),
            definition_short=item.get("definition_short"),
            definition_long=item.get("definition_long"),
            registration_details=item.get("registration_details"),
            invitation_details=item.get("invitation_details"),
            accreditation_info=item.get("accreditation_info"),
            accreditation_deadline=item.get("accreditation_deadline"),
            reference=item.get("reference"),
            links=item.get("links"),
            dates=item.get("dates"),
            occur_status=item.get("occur_status"),
            location=item.get("location"),
            event_contact_info=item["event_contact_info"],
            calendars=item.get("calendars"),
            related_items=item.get("related_items"),
        )
