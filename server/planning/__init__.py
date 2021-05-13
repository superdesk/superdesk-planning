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
from flask_babel import lazy_gettext
from .agendas import AgendasResource, AgendasService
from .planning_export_templates import PlanningExportTemplatesResource, PlanningExportTemplatesService
from .planning_article_export import PlanningArticleExportResource, PlanningArticleExportService
from .common import (
    get_max_recurrent_events,
    get_street_map_url,
    get_event_max_multi_day_duration,
    planning_auto_assign_to_workflow,
    get_long_event_duration_threshold,
    get_planning_allow_scheduled_updates,
    event_templates_enabled,
    planning_link_updates_to_coverage,
    get_planning_use_xmp_for_pic_assignments,
    get_planning_use_xmp_for_pic_slugline,
    get_planning_allowed_coverage_link_types,
    get_planning_auto_close_popup_editor)
from apps.common.components.utils import register_component
from .item_lock import LockService
from .planning_notifications import PlanningNotifications
from planning.events import init_app as init_events_app
from planning.planning import init_app as init_planning_app
from planning.assignments import init_app as init_assignments_app
from planning.search import init_app as init_search_app
from planning.validate import init_app as init_validator_app
from planning.locations import init_app as init_locations_app
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

from .commands import FlagExpiredItems, DeleteSpikedItems, DeleteMarkedAssignments, ExportScheduledFilters
import planning.commands  # noqa
import planning.feeding_services # noqa
import planning.feed_parsers  # noqa
import planning.output_formatters  # noqa
from planning.planning_download import init_app as init_planning_download_app

__version__ = '2.2.0'

_SERVER_PATH = os.path.dirname(os.path.realpath(__file__))


def init_app(app):
    """Initialize planning plugin.

    :param app: superdesk app
    """
    agendas_service = AgendasService('agenda', backend=superdesk.get_backend())
    AgendasResource('agenda', app=app, service=agendas_service)

    export_template_service = PlanningExportTemplatesService(PlanningExportTemplatesResource.endpoint_name,
                                                             backend=superdesk.get_backend())
    PlanningExportTemplatesResource(PlanningExportTemplatesResource.endpoint_name,
                                    app=app,
                                    service=export_template_service)

    register_component(LockService(app))

    init_locations_app(app)
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
        label=lazy_gettext('Planning'),
        description=lazy_gettext('Create, update, and delete  events, planning items, and coverages'),
    )

    superdesk.privilege(
        name='planning_agenda_management',
        label=lazy_gettext('Planning - Agenda Management'),
        description=lazy_gettext('Ability to create and modify Agendas'),
    )

    superdesk.privilege(
        name='planning_agenda_delete',
        label=lazy_gettext('Planning - Delete Agendas'),
        description=lazy_gettext('Ability to delete an Agenda'),
    )

    superdesk.privilege(
        name='planning_edit_expired',
        label=lazy_gettext('Planning - Edit Expired Items'),
        description=lazy_gettext('Ability to edit expired Event and Planning items'),
    )

    superdesk.privilege(
        name='planning_create_past',
        label=lazy_gettext('Planning - Create Event/Planning in the past'),
        description=lazy_gettext('Ability to create an Event or Planning item in the past'),
    )

    superdesk.privilege(
        name='planning_assignments_view',
        label=lazy_gettext('Planning - Assignments'),
        description=lazy_gettext('User can access assignments view and see their own assignments'),
    )

    superdesk.privilege(
        name='planning_assignments_desk',
        label=lazy_gettext('Planning - Assignments desk'),
        description=lazy_gettext('User can see desk assignments'),
    )

    app.on_update_users += PlanningNotifications().user_update

    superdesk.register_default_user_preference('slack:notification', {
        'type': 'bool',
        'enabled': True,
        'default': False,
    },
        label=lazy_gettext('Allow Notifications To Slack'),
        category=lazy_gettext('Notifications'),
    )

    superdesk.register_default_user_preference('planning:calendar', {
        'type': 'dict',
        'calendar': {}
    },
        label=lazy_gettext('Default Calendar'),
        category=lazy_gettext('Planning'),
    )

    superdesk.register_default_user_preference('planning:agenda', {
        'type': 'dict',
        'agenda': {},
        'default': None
    },
        label=lazy_gettext('Default Agenda'),
        category=lazy_gettext('Planning'),
    )

    superdesk.register_default_user_preference('planning:events_planning_filter', {
        'type': 'dict',
        'filter': {},
        'default': None
    },
        label=lazy_gettext('Default Events Planning Filter'),
        category=lazy_gettext('Planning'),
    )

    superdesk.register_default_user_preference('planning:default_coverage_desks', {
        'type': 'dict',
        'desks': {},
        'default': None
    },
        label=lazy_gettext('Default desk for coverage types'),
        category=lazy_gettext('Planning'),
    )

    superdesk.register_default_user_preference('planning:add_coverage_advanced_mode', {
        'type': 'bool',
        'enabled': False,
        'default': False,
    },
        label=lazy_gettext('Open advanced mode when adding coverages'),
        category=lazy_gettext('Planning'),
    )

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
    app.client_config['planning_auto_close_popup_editor'] = get_planning_auto_close_popup_editor(app)

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

    init_scheduled_exports_task(app)

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
            os.path.join(_SERVER_PATH, 'templates'))])
        app.jinja_loader = custom_loaders

        register_jinja_filter('formatted_address', get_formatted_address)

    # add planning translations directory
    app.config['BABEL_TRANSLATION_DIRECTORIES'] += ";" + os.path.join(_SERVER_PATH, "translations")

    app.config.setdefault('APPS_DATA_UPDATES_PATHS', [])
    app.config['APPS_DATA_UPDATES_PATHS'].append(os.path.join(_SERVER_PATH, 'data_updates'))


def init_scheduled_exports_task(app):
    # If the celery task is not configured, then set the default now
    if not app.config['CELERY_BEAT_SCHEDULE'].get('planning.export_scheduled_filters'):
        app.config['CELERY_TASK_ROUTES']['planning.export_scheduled_filters'] = {
            'queue': celery_queue('default'),
            'routing_key': 'planning.exports'
        }

    # If the celery schedule is not configured, then set the default now
    if not app.config['CELERY_BEAT_SCHEDULE'].get('planning:export_scheduled_filters'):
        app.config['CELERY_BEAT_SCHEDULE']['planning:export_scheduled_filters'] = {
            'task': 'planning.export_scheduled_filters',
            'schedule': crontab(minute=0)
        }


@celery.task(soft_time_limit=600)
def flag_expired():
    FlagExpiredItems().run()


@celery.task(soft_time_limit=600)
def delete_spiked():
    DeleteSpikedItems().run()


@celery.task(soft_time_limit=600)
def delete_assignments():
    DeleteMarkedAssignments().run()


@celery.task(soft_time_limit=600)
def export_scheduled_filters():
    ExportScheduledFilters().run()
