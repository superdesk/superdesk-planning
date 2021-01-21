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
from eve.utils import config
from .locations import LocationsResource, LocationsService
from .agendas import AgendasResource, AgendasService
from .planning_export_templates import PlanningExportTemplatesResource, PlanningExportTemplatesService
from .planning_article_export import PlanningArticleExportResource, PlanningArticleExportService
from .common import get_max_recurrent_events, get_street_map_url, get_event_max_multi_day_duration,\
    planning_auto_assign_to_workflow, get_long_event_duration_threshold, get_planning_allow_scheduled_updates,\
    event_templates_enabled, planning_link_updates_to_coverage, get_planning_use_xmp_for_pic_assignments, \
    get_planning_use_xmp_for_pic_slugline, get_planning_allowed_coverage_link_types
from apps.common.components.utils import register_component
from .item_lock import LockService
from .planning_notifications import PlanningNotifications
from planning.events import init_app as init_events_app
from planning.planning import init_app as init_planning_app
from planning.assignments import init_app as init_assignments_app
from planning.search import init_app as init_search_app
from planning.validate import init_app as init_validator_app
from superdesk.celery_app import celery
from .published_planning import PublishedPlanningResource, PublishedPlanningService
from superdesk.default_settings import celery_queue, CELERY_TASK_ROUTES as CTR, \
    CELERY_BEAT_SCHEDULE as CBS
from celery.schedules import crontab
import jinja2
import os
from datetime import timedelta
from superdesk import register_jinja_filter
from .common import get_formatted_address

from .commands import FlagExpiredItems, DeleteSpikedItems, DeleteMarkedAssignments
import planning.commands  # noqa
import planning.feeding_services # noqa
import planning.feed_parsers  # noqa
import planning.output_formatters  # noqa
from planning.planning_download import init_app as init_planning_download_app

__version__ = '2.0.1'


def init_app(app):
    """Initialize planning plugin.

    :param app: superdesk app
    """
    agendas_service = AgendasService('agenda', backend=superdesk.get_backend())
    AgendasResource('agenda', app=app, service=agendas_service)

    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    export_template_service = PlanningExportTemplatesService(PlanningExportTemplatesResource.endpoint_name,
                                                             backend=superdesk.get_backend())
    PlanningExportTemplatesResource(PlanningExportTemplatesResource.endpoint_name,
                                    app=app,
                                    service=export_template_service)

    register_component(LockService(app))

    init_events_app(app)
    init_planning_app(app)
    init_assignments_app(app)
    init_search_app(app)
    init_validator_app(app)
    init_planning_download_app(app)

    superdesk.register_resource(
        'planning_article_export',
        PlanningArticleExportResource,
        PlanningArticleExportService,
        privilege='planning',
        _app=app
    )

    endpoint_name = 'published_planning'
    planning_published_service = PublishedPlanningService(endpoint_name, backend=superdesk.get_backend())
    PublishedPlanningResource(endpoint_name, app=app, service=planning_published_service)

    superdesk.privilege(
        name='planning',
        label='Planning',
        description='Create, update, and delete  events, planning items, and coverages'
    )

    superdesk.privilege(
        name='planning_agenda_management',
        label='Planning - Agenda Management',
        description='Ability to create and modify Agendas'
    )

    superdesk.privilege(
        name='planning_agenda_delete',
        label='Planning - Delete Agendas',
        description='Ability to delete an Agenda'
    )

    superdesk.privilege(
        name='planning_edit_expired',
        label='Planning - Edit Expired Items',
        description='Ability to edit expired Event and Planning items'
    )

    superdesk.privilege(
        name='planning_create_past',
        label='Planning - Create Event/Planning in the past',
        description='Ability to create an Event or Planning item in the past'
    )

    superdesk.privilege(
        name='planning_locations_management',
        label='Planning - Manage locations',
        decsription='Ability to create, edit and delete locations'
    )

    superdesk.privilege(
        name='planning_assignments_view',
        label='Planning - Assignments view',
        decsription='Ability to access assignments view'
    )

    app.on_update_users += PlanningNotifications().user_update

    superdesk.register_default_user_preference('slack:notification', {
        'type': 'bool',
        'enabled': True,
        'default': False,
        'label': 'Allow Notifications To Slack',
        'category': 'notifications'
    })

    superdesk.register_default_user_preference('planning:calendar', {
        'type': 'dict',
        'label': 'Default Calendar',
        'category': 'planning',
        'calendar': {}
    })

    superdesk.register_default_user_preference('planning:agenda', {
        'type': 'dict',
        'label': 'Default Agenda',
        'category': 'planning',
        'agenda': {},
        'default': None
    })

    superdesk.register_default_user_preference('planning:events_planning_filter', {
        'type': 'dict',
        'label': 'Default Events Planning Filter',
        'category': 'planning',
        'filter': {},
        'default': None
    })

    superdesk.register_default_user_preference('planning:default_coverage_desks', {
        'type': 'dict',
        'label': 'Default desk for coverage types',
        'category': 'planning',
        'desks': {},
        'default': None
    })

    superdesk.register_default_user_preference('planning:add_coverage_advanced_mode', {
        'type': 'bool',
        'enabled': False,
        'default': False,
        'label': 'Open advanced mode when adding coverages',
        'category': 'planning',
    })

    app.client_config['max_recurrent_events'] = get_max_recurrent_events(app)
    app.client_config['street_map_url'] = get_street_map_url(app)
    app.client_config['max_multi_day_event_duration'] = get_event_max_multi_day_duration(app)
    app.client_config['planning_auto_assign_to_workflow'] = planning_auto_assign_to_workflow(app)
    app.client_config['long_event_duration_threshold'] = get_long_event_duration_threshold(app)
    app.client_config['event_templates_enabled'] = event_templates_enabled(app)
    app.client_config['planning_allow_scheduled_updates'] = get_planning_allow_scheduled_updates(app)
    app.client_config['planning_link_updates_to_coverage'] = planning_link_updates_to_coverage(app)
    app.client_config['planning_use_xmp_for_pic_assignments'] = get_planning_use_xmp_for_pic_assignments(app)
    app.client_config['planning_use_xmp_for_pic_slugline'] = get_planning_use_xmp_for_pic_slugline(app)

    app.client_config.setdefault('planning', {})
    app.client_config['planning']['allowed_coverage_link_types'] = get_planning_allowed_coverage_link_types(app)

    # Set up Celery task options
    if not app.config.get('CELERY_TASK_ROUTES'):
        app.config['CELERY_TASK_ROUTES'] = CTR

    if not app.config.get('CELERY_TASK_ROUTES').get('planning.flag_expired'):
        app.config['CELERY_TASK_ROUTES']['planning.flag_expired'] = {
            'queue': celery_queue('expiry'),
            'routing_key': 'expiry.planning'
        }

    if not app.config.get('CELERY_TASK_ROUTES').get('planning.delete_spiked'):
        app.config['CELERY_TASK_ROUTES']['planning.delete_spiked'] = {
            'queue': celery_queue('expiry'),
            'routing_key': 'expiry.delete'
        }

    if not app.config.get('CELERY_TASK_ROUTES').get('planning.delete_assignments'):
        app.config['CELERY_TASK_ROUTES']['planning.delete_assignments'] = {
            'queue': celery_queue('expiry'),
            'routing_key': 'expiry.delete_assignments'
        }

    if not app.config.get('CELERY_BEAT_SCHEDULE'):
        app.config['CELERY_BEAT_SCHEDULE'] = CBS

    if app.config.get('PLANNING_EXPIRY_MINUTES', 0) != 0 and \
            not app.config.get('CELERY_BEAT_SCHEDULE').get('planning:expiry'):
        app.config['CELERY_BEAT_SCHEDULE']['planning:expiry'] = {
            'task': 'planning.flag_expired',
            'schedule': crontab(minute='0')  # Runs once every hour
        }

    if app.config.get('PLANNING_DELETE_SPIKED_MINUTES', 0) != 0 and \
            not app.config.get('CELERY_BEAT_SCHEDULE').get('planning:delete'):
        app.config['CELERY_BEAT_SCHEDULE']['planning:delete'] = {
            'task': 'planning.delete_spiked',
            'schedule': crontab(minute='0')  # Runs once every hour
        }

    if not app.config['CELERY_BEAT_SCHEDULE'].get('planning:delete_assignments'):
        app.config['CELERY_BEAT_SCHEDULE']['planning:delete_assignments'] = {
            'task': 'planning.delete_assignments',
            'schedule': timedelta(seconds=60)  # Runs once every minute
        }

    # Create 'type' required for planning module if not already preset
    with app.app_context():
        vocabulary_service = superdesk.get_resource_service('vocabularies')
        types = vocabulary_service.find_one(req=None, _id='type')
        if types:
            items = types.get('items') or []
            added_types = []
            type_names = [t['qcode'] for t in items]

            planning_type_list = [
                {"is_active": True, "name": "Planning item", "qcode": "planning"},
                {"is_active": True, "name": "Event", "qcode": "event"},
                {"is_active": True, "name": "Featured Stories", "qcode": "planning_featured"}
            ]

            for item in planning_type_list:
                if item['qcode'] not in type_names:
                    added_types.append(item)

            if len(added_types) > 0:
                vocabulary_service.patch(types.get(config.ID_FIELD), {
                    "items": (items + added_types)
                })

        custom_loaders = jinja2.ChoiceLoader(app.jinja_loader.loaders + [jinja2.FileSystemLoader(
            os.path.join(os.path.dirname(os.path.realpath(__file__)), 'templates'))])
        app.jinja_loader = custom_loaders

        register_jinja_filter('formatted_address', get_formatted_address)


@celery.task(soft_time_limit=600)
def flag_expired():
    FlagExpiredItems().run()


@celery.task(soft_time_limit=600)
def delete_spiked():
    DeleteSpikedItems().run()


@celery.task(soft_time_limit=600)
def delete_assignments():
    DeleteMarkedAssignments().run()
