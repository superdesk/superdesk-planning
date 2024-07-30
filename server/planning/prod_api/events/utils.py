# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Union

from superdesk.resource_fields import LINKS
from planning.types import ArchiveItem, Planning, Assignment
from planning.utils import get_related_event_links_for_planning
from .resource import EventsResource


def construct_event_link(event_id: str):
    return {
        "title": EventsResource.resource_title,
        "href": f"{EventsResource.url}/{event_id}",
    }


def add_related_event_links(item: Union[ArchiveItem, Assignment, Planning], planning: Planning):
    for related_event in get_related_event_links_for_planning(planning):
        event_link = construct_event_link(related_event["_id"])
        if related_event["link_type"] == "primary" and not item[LINKS]["event"]:
            item[LINKS]["event"] = event_link
        else:
            item[LINKS].setdefault("related_events", []).append(event_link)
