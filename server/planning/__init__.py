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
from .planning_publish import PlanningPublishService, PlanningPublishResource
from .planning_duplicate import PlanningDuplicateService, PlanningDuplicateResource
from .events_lock import EventsLockResource, EventsLockService, EventsUnlockResource, EventsUnlockService
from .agendas import AgendasResource, AgendasService
from superdesk.io.registry import register_feeding_service, register_feed_parser
from .feed_parsers.ics_2_0 import IcsTwoFeedParser
from .feed_parsers.ntb_event_xml import NTBEventXMLFeedParser
from .feeding_services.event_file_service import EventFileFeedingService
from .feeding_services.event_http_service import EventHTTPFeedingService
from .feeding_services.event_email_service import EventEmailFeedingService
from .events_duplicate import EventsDuplicateResource, EventsDuplicateService
from .events_publish import EventsPublishService, EventsPublishResource
from .events_cancel import EventsCancelService, EventsCancelResource
from .planning_cancel import PlanningCancelService, PlanningCancelResource
from .events_reschedule import EventsRescheduleService, EventsRescheduleResource
from .planning_reschedule import PlanningRescheduleService, PlanningRescheduleResource
from .events_postpone import EventsPostponeService, EventsPostponeResource
from .planning_postpone import PlanningPostponeService, PlanningPostponeResource
from planning.planning_types import PlanningTypesService, PlanningTypesResource
from .common import get_max_recurrent_events
from .planning_export import PlanningExportResource, PlanningExportService

from .commands import *  # noqa


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

    planning_publish_service = PlanningPublishService('planning_publish', backend=superdesk.get_backend())
    PlanningPublishResource('planning_publish', app=app, service=planning_publish_service)

    planning_duplicate_service = PlanningDuplicateService('planning_duplicate', backend=superdesk.get_backend())
    PlanningDuplicateResource('planning_duplicate', app=app, service=planning_duplicate_service)

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

    events_publish_service = EventsPublishService('events_publish', backend=superdesk.get_backend())
    EventsPublishResource('events_publish', app=app, service=events_publish_service)

    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    files_service = EventsFilesService('events_files', backend=superdesk.get_backend())
    EventsFilesResource('events_files', app=app, service=files_service)

    events_history_service = EventsHistoryService('events_history', backend=superdesk.get_backend())
    EventsHistoryResource('events_history', app=app, service=events_history_service)

    planning_type_service = PlanningTypesService(PlanningTypesResource.endpoint_name,
                                                 backend=superdesk.get_backend())
    PlanningTypesResource(PlanningTypesResource.endpoint_name,
                          app=app,
                          service=planning_type_service)

    events_cancel_service = EventsCancelService(EventsCancelResource.endpoint_name,
                                                backend=superdesk.get_backend())
    EventsCancelResource(EventsCancelResource.endpoint_name,
                         app=app,
                         service=events_cancel_service)

    events_reschedule_service = EventsRescheduleService(
        EventsRescheduleResource.endpoint_name,
        backend=superdesk.get_backend()
    )
    EventsRescheduleResource(
        EventsRescheduleResource.endpoint_name,
        app=app,
        service=events_reschedule_service
    )

    events_postpone_service = EventsPostponeService(EventsPostponeResource.endpoint_name,
                                                    backend=superdesk.get_backend())
    EventsPostponeResource(EventsPostponeResource.endpoint_name,
                           app=app,
                           service=events_postpone_service)

    planning_cancel_service = PlanningCancelService(PlanningCancelResource.endpoint_name,
                                                    backend=superdesk.get_backend())
    PlanningCancelResource(PlanningCancelResource.endpoint_name,
                           app=app,
                           service=planning_cancel_service)

    planning_reschedule_service = PlanningRescheduleService(
        PlanningRescheduleResource.endpoint_name,
        backend=superdesk.get_backend()
    )
    PlanningRescheduleResource(
        PlanningRescheduleResource.endpoint_name,
        app=app,
        service=planning_reschedule_service
    )

    planning_postpone_service = PlanningPostponeService(PlanningPostponeResource.endpoint_name,
                                                        backend=superdesk.get_backend())
    PlanningPostponeResource(PlanningPostponeResource.endpoint_name,
                             app=app,
                             service=planning_postpone_service)

    superdesk.register_resource(
        'planning_export',
        PlanningExportResource,
        PlanningExportService,
        privilege='planning',
        _app=app
    )

    app.on_updated_events += events_history_service.on_item_updated
    app.on_inserted_events += events_history_service.on_item_created
    app.on_deleted_item_events -= events_history_service.on_item_deleted
    app.on_deleted_item_events += events_history_service.on_item_deleted
    app.on_updated_events_spike += events_history_service.on_spike
    app.on_updated_events_unspike += events_history_service.on_unspike
    app.on_updated_events_cancel += events_history_service.on_cancel
    app.on_updated_events_reschedule += events_history_service.on_reschedule
    app.on_updated_events_postpone += events_history_service.on_postpone

    planning_history_service = PlanningHistoryService('planning_history', backend=superdesk.get_backend())
    PlanningHistoryResource('planning_history', app=app, service=planning_history_service)

    app.on_inserted_planning += planning_history_service.on_item_created
    app.on_updated_planning += planning_history_service.on_item_updated
    app.on_updated_planning_spike += planning_history_service.on_spike
    app.on_updated_planning_unspike += planning_history_service.on_unspike
    app.on_updated_planning_cancel += planning_history_service.on_cancel
    app.on_updated_planning_reschedule += planning_history_service.on_reschedule
    app.on_updated_planning_postpone += planning_history_service.on_postpone

    app.on_locked_planning += planning_search_service.on_locked_planning
    app.on_locked_events += events_search_service.on_locked_event

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

    superdesk.privilege(
        name='planning_event_publish',
        label='Planning - Publish Event Items',
        description='Ability to publish an Event'
    )

    superdesk.privilege(
        name='planning_planning_publish',
        label='Planning - Publish Planning Items',
        description='Ability to publish a Planning Item'
    )

    superdesk.intrinsic_privilege(PlanningUnlockResource.endpoint_name, method=['POST'])
    superdesk.intrinsic_privilege(EventsUnlockResource.endpoint_name, method=['POST'])

    import planning.output_formatters  # noqa

    app.client_config['max_recurrent_events'] = get_max_recurrent_events(app)


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
