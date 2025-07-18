# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .utils import expand_contact_info
from .json_base_formatter import BaseJsonFormatter


class JsonEventFormatter(BaseJsonFormatter):
    """
    Simple json output formatter a sample output formatter for events
    """

    name = "JSON Event"
    type = "json_event"
    resource_type = "event"

    remove_fields: set[str] | None = {
        "lock_time",
        "lock_action",
        "lock_session",
        "lock_user",
        "_etag",
        "_planning_schedule",
        "expiry",
        "original_creator",
        "_reschedule_from_schedule",
        "_current_version",
    }

    include_files: list[tuple[str, str]] | None = [("files", "events_files")]

    def __init__(self):
        """
        Set format type and no export or preview
        """

        super().__init__()
        self.format_type = "json_event"

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        """Format the item to json event"""
        item = await super()._format_item(item)
        item["event_contact_info"] = await expand_contact_info(item.get("event_contact_info", []))
        return item
