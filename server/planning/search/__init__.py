# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from quart_babel import lazy_gettext
from superdesk.core.resources import ResourceConfig, RestEndpointConfig
from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules
from superdesk.core.privileges import Privilege

from planning.types import EventPlanningFilter
from .eventsplanning_search import EventsPlanningResource, EventsPlanningService
from .eventsplanning_filters_service import EventsPlanningFiltersAsyncService, connect_signals_listeners

__all__ = [
    "events_planning_filters_resource_config",
    "connect_signals_listeners",
    "events_planning_filters_privileges",
]

events_planning_filters_privileges = [
    Privilege(
        name="planning_eventsplanning_filters_management",
        label=lazy_gettext("Planning - Events & Planning View Filters Management"),
        description=lazy_gettext("Create/Update/Delete Events & Planning View Filters"),
    ),
]

events_planning_filters_resource_config: ResourceConfig = ResourceConfig(
    name="events_planning_filters",
    data_class=EventPlanningFilter,
    service=EventsPlanningFiltersAsyncService,
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PATCH", "PUT", "DELETE"],
        auth=http_method_privilege_based_rules(
            {
                "POST": "planning_eventsplanning_filters_management",
                "PATCH": "planning_eventsplanning_filters_management",
                "DELETE": "planning_eventsplanning_filters_management",
            }
        ),
    ),
)


def init_app(app):
    superdesk.register_resource(
        EventsPlanningResource.endpoint_name,
        EventsPlanningResource,
        EventsPlanningService,
        _app=app,
    )

    # TODO-ASYNC: migrate to new async privileges and adjust functionality
    # at the moment if we remove this, the management of filters won't be visible in the UI
    superdesk.privilege(
        name="planning_eventsplanning_filters_management",
        label=lazy_gettext("Planning - Events & Planning View Filters Management"),
        description=lazy_gettext("Create/Update/Delete Events & Planning View Filters"),
    )

    superdesk.privilege(
        name="planning_global_filters",
        label=lazy_gettext("Planning - Global Filters"),
        description=lazy_gettext("Ability to view global Events/Planning items"),
    )
