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
from .locations import LocationsResource, LocationsService
from .agendas import AgendasResource, AgendasService
from .common import get_max_recurrent_events, get_street_map_url
from apps.common.components.utils import register_component
from .item_lock import LockService
from .planning_notifications import PlanningNotifications
from planning.events import init_app as init_events_app
from planning.planning import init_app as init_planning_app
from planning.assignments import init_app as init_assignments_app
from planning.search import init_app as init_search_app
from planning.validate import init_app as init_validator_app

import planning.commands  # noqa
import planning.feeding_services # noqa
import planning.feed_parsers  # noqa
import planning.output_formatters  # noqa


def init_app(app):
    """Initialize planning plugin.

    :param app: superdesk app
    """
    agendas_service = AgendasService('agenda', backend=superdesk.get_backend())
    AgendasResource('agenda', app=app, service=agendas_service)

    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    register_component(LockService(app))

    init_events_app(app)
    init_planning_app(app)
    init_assignments_app(app)
    init_search_app(app)
    init_validator_app(app)

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
        name='planning_agenda_spike',
        label='Planning - Spike Agendas',
        description='Ability to spike an Agenda'
    )

    superdesk.privilege(
        name='planning_agenda_unspike',
        label='Planning - Unspike Agendas',
        description='Ability to unspike an Agenda'
    )

    app.on_update_users += PlanningNotifications().user_update

    superdesk.register_default_user_preference('slack:notification', {
        'type': 'bool',
        'enabled': True,
        'default': False,
        'label': 'Allow Notifications To Slack',
        'category': 'notifications'
    })

    app.client_config['max_recurrent_events'] = get_max_recurrent_events(app)
    app.client_config['street_map_url'] = get_street_map_url(app)
