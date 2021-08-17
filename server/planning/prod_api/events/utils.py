# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .resource import EventsResource


def construct_event_link(event_id: str):
    return {
        "title": EventsResource.resource_title,
        "href": f"{EventsResource.url}/{event_id}",
    }
