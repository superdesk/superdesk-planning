from copy import deepcopy

from superdesk.core import json, get_current_app
from superdesk import get_resource_service
from superdesk.utils import json_serialize_datetime_objectId

from superdesk.publish.formatters import Formatter
from superdesk.publish_async.utils import generate_sequence_number

from .utils import get_matching_products
from .json_utils import translate_names


class BaseJsonFormatter(Formatter):
    name = "JSON"
    type = "json"
    format_type = "json"
    resource_type = "event"
    remove_fields: set[str] | None = None
    translate_names: set[str] | None = {"subject", "anpa_category", "calendars"}

    # TODO-PR: Do we use None or bool as secondary type???
    include_files: list[tuple[str, str]] | None = None
    include_products: bool = True

    def __init__(self):
        self.can_preview = False
        self.can_export = False

    def can_format(self, format_type, article):
        if article.get("flags", {}).get("marked_for_not_publication", False):
            return False
        return format_type == self.format_type and article.get("type") == self.resource_type

    async def format(self, item, subscriber, codes=None):
        output_item = await self._format_item(deepcopy(item))
        await self._enhance_item(item)

        return [
            (
                await generate_sequence_number(subscriber),
                json.dumps(output_item, default=json_serialize_datetime_objectId),
            )
        ]

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        """Format the item to json planning"""
        if self.include_products:
            item["products"] = await get_matching_products(item)

        await self._format_files(item)
        return item

    async def _enhance_item(self, item: dict) -> None:
        if self.translate_names:
            translate_names(item, self.translate_names)

        if self.remove_fields is not None:
            for f in self.remove_fields:
                item.pop(f, None)

    async def _format_files(self, item: dict) -> None:
        if not self.include_files:
            return

        for field, resource in self.include_files:
            if item.get(field):
                try:
                    item[field] = await self._get_files_for_publish(item, resource)
                except NotImplementedError:
                    #  Current http_push transmitters only support media publish
                    pass

    async def _get_files_for_publish(self, item: dict, resource: str):
        async def format_file_entry(file_id):
            file_resource = await get_resource_service(resource).find_one_async(req=None, _id=file_id)
            app = get_current_app()
            media = app.media.get(file_resource["media"], resource=resource)
            return {
                "media": str(file_resource["media"]),
                "name": media.name,
                "length": media.length,
                "mimetype": media.content_type,
            }

        return [await format_file_entry(file_id) for file_id in item["files"]]
