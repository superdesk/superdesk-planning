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
from .events_files import EventsFilesResource, EventsFilesService
from .coverage import CoverageResource, CoverageService
from .locations import LocationsResource, LocationsService
from superdesk.io.registry import register_feeding_service, register_feed_parser
from .feed_parsers.ics_2_0 import IcsTwoFeedParser
from .feed_parsers.ntb_event_xml import NTBEventXMLFeedParser
from .feeding_services.event_file_service import EventFileFeedingService
from .feeding_services.event_http_service import EventHTTPFeedingService
from .feeding_services.event_email_service import EventEmailFeedingService


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

    files_service = EventsFilesService('events_files', backend=superdesk.get_backend())
    EventsFilesResource('events_files', app=app, service=files_service)

    superdesk.privilege(
        name='planning',
        label='Planning',
        description='Create, update, and delete  events, planning items, and coverages'
    )


register_feeding_service(
    EventFileFeedingService.NAME,
    EventFileFeedingService(),
    EventFileFeedingService.ERRORS
)
register_feeding_service(
    EventHTTPFeedingService.NAME,
    EventHTTPFeedingService(),
    EventHTTPFeedingService.ERRORS
)
register_feeding_service(
    EventEmailFeedingService.NAME,
    EventEmailFeedingService(),
    EventEmailFeedingService.ERRORS
)

register_feed_parser(IcsTwoFeedParser.NAME, IcsTwoFeedParser())
register_feed_parser(NTBEventXMLFeedParser.NAME, NTBEventXMLFeedParser())
