# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning.types import UnifiedPlanningResource
from planning.utils import get_first_related_event_id_for_planning, get_related_event_links_for_planning

from .json_base_formatter import BaseJsonFormatter


class JsonPlanningFormatter(BaseJsonFormatter):
    """
    Simple json output formatter a sample output formatter for planning items
    """

    name = "JSON Planning"
    type = "json_planning"
    resource_type = "planning"
    include_files = None

    def __init__(self):
        """
        Set format type and no export or preview
        """
        super().__init__()
        self.format_type = "json_planning"

    async def _format_item(self, item, subscribers: list[dict] | None = None):
        """Format the item to json planning"""
        await super()._format_item(item)

        first_primary_event_id = get_first_related_event_id_for_planning(item, "primary")
        if first_primary_event_id:
            item["event_item"] = first_primary_event_id

        events = []
        event_service = UnifiedPlanningResource.get_service()
        for event_ref in get_related_event_links_for_planning(item):
            event = await event_service.find_by_id_raw(event_ref["_id"], projection=["name"])
            events.append(
                {
                    "rel": event_ref["link_type"],
                    "uri": f"urn:event:{event_ref['_id']}",
                    "literal": event_ref["_id"],
                    "name": (event.get("name") or "") if event else "",
                }
            )
        item["events"] = events

        return item
