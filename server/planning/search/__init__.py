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
from flask_babel import lazy_gettext
from .planning_search import PlanningSearchResource, PlanningSearchService
from .eventsplanning_search import EventsPlanningResource, EventsPlanningService
from .eventsplanning_filters import (
    EventPlanningFiltersResource,
    EventPlanningFiltersService,
)


def init_app(app):
    superdesk.register_resource(
        PlanningSearchResource.endpoint_name,
        PlanningSearchResource,
        PlanningSearchService,
        _app=app,
    )

    superdesk.register_resource(
        EventsPlanningResource.endpoint_name,
        EventsPlanningResource,
        EventsPlanningService,
        _app=app,
    )

    superdesk.register_resource(
        EventPlanningFiltersResource.endpoint_name,
        EventPlanningFiltersResource,
        EventPlanningFiltersService,
        _app=app,
    )

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
