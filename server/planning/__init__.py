# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Plugin."""

import superdesk
from .events import EventsResource, EventsService
from .planning import PlanningResource, PlanningService
from .coverage import CoverageResource, CoverageService
from .locations import LocationsResource, LocationsService


def init_app(app):
    """Initialize planning plugin.

    :param app: superdesk app
    """
    planning_search_service = PlanningService('planning', backend=superdesk.get_backend())
    PlanningResource('planning', app=app, service=planning_search_service)

    coverage_search_service = CoverageService('coverage', backend=superdesk.get_backend())
    CoverageResource('coverage', app=app, service=coverage_search_service)

    events_search_service = EventsService('events', backend=superdesk.get_backend())
    EventsResource('events', app=app, service=events_search_service)

    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    superdesk.privilege(
        name='planning',
        label='Planning',
        description='Create, update, and delete  events, planning items, and coverages'
    )
