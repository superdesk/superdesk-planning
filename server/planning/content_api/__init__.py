# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from .types import ContentAPIEventResource, ContentAPIPlanningResource

from superdesk.core.module import Module

from .resources import (
    ContentAPIEventService,
    ContentAPIPlanningService,
    content_api_event_resource_config,
    content_api_planning_resource_config,
)
from .views import event_endpoints, planning_endpoints

__all__ = [
    "ContentAPIEventService",
    "ContentAPIEventResource",
    "ContentAPIPlanningService",
    "ContentAPIPlanningResource",
    "content_api_event_resource_config",
    "content_api_planning_resource_config",
]

module = Module(
    "planning.content_api",
    resources=[content_api_event_resource_config, content_api_planning_resource_config],
    endpoints=[event_endpoints, planning_endpoints],
)
