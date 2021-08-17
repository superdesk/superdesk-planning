# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any

from superdesk.publish import register_transmitter_file_provider, TransmitterFileEntry
from superdesk.publish.transmitters.ftp import FTPPublishService


def get_event_planning_files_for_transmission(
    transmitter_name: str, item: Dict[str, Any]
) -> Dict[str, TransmitterFileEntry]:
    if item.get("type") not in ["event", "planning"]:
        # We only want this provider to run for Events/Planning items
        return {}
    elif transmitter_name == FTPPublishService.NAME:
        # We currently do not support sending Event/Planning files via FTP
        return {}

    return {
        file["media"]: TransmitterFileEntry(
            media=file["media"],
            mimetype=file["mimetype"],
            resource="events_files" if item["type"] == "event" else "planning_files",
        )
        for file in item.get("files") or []
    }


register_transmitter_file_provider(get_event_planning_files_for_transmission)
