# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from .types.events import ContentAPIEventResource
from .types.planning import ContentAPIPlanningResource

from .events.event import ContentAPIEventService, content_api_event_resource_config
from .planning.planning import ContentAPIPlanningService, content_api_planning_resource_config


__all__ = [
    "ContentAPIEventService",
    "ContentAPIEventResource",
    "ContentAPIPlanningService",
    "ContentAPIPlanningResource",
    "content_api_event_resource_config",
    "content_api_planning_resource_config",
]
