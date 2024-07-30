# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from eve import Eve
from flask_babel import lazy_gettext

import superdesk

from .resource import PlanningTypesResource
from .service import PlanningTypesService
from planning.common import get_config_event_related_item_search_provider_name


def init_app(app: Eve):
    superdesk.privilege(
        name="planning_manage_content_profiles",
        label=lazy_gettext("Planning - Manage Content Profiles"),
        description=lazy_gettext("Ability to edit Event/Planning Content Profiles"),
    )

    planning_type_service = PlanningTypesService(PlanningTypesResource.endpoint_name, backend=superdesk.get_backend())
    PlanningTypesResource(PlanningTypesResource.endpoint_name, app=app, service=planning_type_service)

    event_related_item_search_provider_name = get_config_event_related_item_search_provider_name()
    if event_related_item_search_provider_name:
        app.client_config.setdefault("planning", {})[
            "event_related_item_search_provider_name"
        ] = event_related_item_search_provider_name
