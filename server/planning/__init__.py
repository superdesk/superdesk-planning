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
from .events_spike import EventsSpikeResource, EventsSpikeService, EventsUnspikeResource, EventsUnspikeService
from .planning import PlanningResource, PlanningService
from .planning_spike import PlanningSpikeResource, PlanningSpikeService, PlanningUnspikeResource, PlanningUnspikeService
from .events_files import EventsFilesResource, EventsFilesService
from .coverage import CoverageResource, CoverageService
from .coverage_history import CoverageHistoryResource, CoverageHistoryService
from .locations import LocationsResource, LocationsService
from .events_history import EventsHistoryResource, EventsHistoryService
from .planning_history import PlanningHistoryResource, PlanningHistoryService
from .planning_lock import PlanningLockResource, PlanningLockService, PlanningUnlockResource, PlanningUnlockService
from .events_lock import EventsLockResource, EventsLockService, EventsUnlockResource, EventsUnlockService
from .agendas import AgendasResource, AgendasService
from superdesk.io.registry import register_feeding_service, register_feed_parser
from .feed_parsers.ics_2_0 import IcsTwoFeedParser
from .feed_parsers.ntb_event_xml import NTBEventXMLFeedParser
from .feeding_services.event_file_service import EventFileFeedingService
from .feeding_services.event_http_service import EventHTTPFeedingService
from .feeding_services.event_email_service import EventEmailFeedingService
from .events_duplicate import EventsDuplicateResource, EventsDuplicateService


def init_app(app):
    """Initialize planning plugin.

    :param app: superdesk app
    """
    planning_search_service = PlanningService('planning', backend=superdesk.get_backend())
    PlanningResource('planning', app=app, service=planning_search_service)

    planning_lock_service = PlanningLockService('planning_lock', backend=superdesk.get_backend())
    PlanningLockResource('planning_lock', app=app, service=planning_lock_service)

    events_lock_service = EventsLockService('events_lock', backend=superdesk.get_backend())
    EventsLockResource('events_lock', app=app, service=events_lock_service)

    planning_unlock_service = PlanningUnlockService('planning_unlock', backend=superdesk.get_backend())
    PlanningUnlockResource('planning_unlock', app=app, service=planning_unlock_service)

    events_unlock_service = EventsUnlockService('events_unlock', backend=superdesk.get_backend())
    EventsUnlockResource('events_unlock', app=app, service=events_unlock_service)

    planning_spike_service = PlanningSpikeService('planning_spike', backend=superdesk.get_backend())
    PlanningSpikeResource('planning_spike', app=app, service=planning_spike_service)

    planning_unspike_service = PlanningUnspikeService('planning_unspike', backend=superdesk.get_backend())
    PlanningUnspikeResource('planning_unspike', app=app, service=planning_unspike_service)

    agendas_service = AgendasService('agenda', backend=superdesk.get_backend())
    AgendasResource('agenda', app=app, service=agendas_service)

    coverage_search_service = CoverageService('coverage', backend=superdesk.get_backend())
    CoverageResource('coverage', app=app, service=coverage_search_service)

    events_search_service = EventsService('events', backend=superdesk.get_backend())
    EventsResource('events', app=app, service=events_search_service)

    events_spike_service = EventsSpikeService('events_spike', backend=superdesk.get_backend())
    EventsSpikeResource('events_spike', app=app, service=events_spike_service)

    events_unspike_service = EventsUnspikeService('events_unspike', backend=superdesk.get_backend())
    EventsUnspikeResource('events_unspike', app=app, service=events_unspike_service)

    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    files_service = EventsFilesService('events_files', backend=superdesk.get_backend())
    EventsFilesResource('events_files', app=app, service=files_service)

    events_history_service = EventsHistoryService('events_history', backend=superdesk.get_backend())
    EventsHistoryResource('events_history', app=app, service=events_history_service)

    app.on_updated_events += events_history_service.on_item_updated
    app.on_inserted_events += events_history_service.on_item_created
    app.on_deleted_item_events -= events_history_service.on_item_deleted
    app.on_deleted_item_events += events_history_service.on_item_deleted
    app.on_updated_events_spike += events_history_service.on_spike
    app.on_updated_events_unspike += events_history_service.on_unspike

    planning_history_service = PlanningHistoryService('planning_history', backend=superdesk.get_backend())
    PlanningHistoryResource('planning_history', app=app, service=planning_history_service)

    app.on_inserted_planning += planning_history_service.on_item_created
    app.on_updated_planning += planning_history_service.on_item_updated
    app.on_updated_planning_spike += planning_history_service.on_spike
    app.on_updated_planning_unspike += planning_history_service.on_unspike

    app.on_locked_planning += planning_search_service.on_locked_planning

    coverage_history_service = CoverageHistoryService('coverage_history', backend=superdesk.get_backend())
    CoverageHistoryResource('coverage_history', app=app, service=coverage_history_service)

    app.on_updated_coverage += coverage_history_service.on_item_updated
    app.on_inserted_coverage += coverage_history_service.on_item_created
    app.on_deleted_item_coverage -= coverage_history_service.on_item_deleted
    app.on_deleted_item_coverage += coverage_history_service.on_item_deleted

    events_duplicate_service = EventsDuplicateService('events_duplicate', backend=superdesk.get_backend())
    EventsDuplicateResource('events_duplicate', app=app, service=events_duplicate_service)

    superdesk.privilege(
        name='planning',
        label='Planning',
        description='Create, update, and delete  events, planning items, and coverages'
    )

    superdesk.privilege(
        name='planning_unlock',
        label='Planning - Unlock events and planning items',
        description='Ability to unlock Events and Planning Items'
    )

    superdesk.privilege(
        name='planning_agenda_management',
        label='Planning - Agenda Management',
        description='Ability to create and modify Agendas'
    )

    superdesk.privilege(
        name='planning_agenda_spike',
        label='Planning - Spike Agendas',
        description='Ability to spike an Agenda'
    )

    superdesk.privilege(
        name='planning_agenda_unspike',
        label='Planning - Unspike Agendas',
        description='Ability to unspike an Agenda'
    )

    superdesk.privilege(
        name='planning_planning_management',
        label='Planning - Planning Item Management',
        description='Ability to create and modify Planning items'
    )

    superdesk.privilege(
        name='planning_planning_spike',
        label='Planning - Spike Planning Items',
        description='Ability to spike a Planning Item'
    )

    superdesk.privilege(
        name='planning_planning_unspike',
        label='Planning - Unspike Planning Items',
        description='Ability to unspike a Planning Item'
    )

    superdesk.privilege(
        name='planning_event_management',
        label='Planning - Event Management',
        description='Ability to create and modify Events'
    )

    superdesk.privilege(
        name='planning_event_spike',
        label='Planning - Spike Event Items',
        description='Ability to spike an Event'
    )

    superdesk.privilege(
        name='planning_event_unspike',
        label='Planning - Unspike Event Items',
        description='Ability to unspike an Event'
    )

    superdesk.intrinsic_privilege(PlanningUnlockResource.endpoint_name, method=['POST'])
    superdesk.intrinsic_privilege(EventsUnlockResource.endpoint_name, method=['POST'])


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
