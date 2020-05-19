# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""EventsPlanning Filters are allows users to define filters for combined search based on calendars and agenda.

"""

from copy import deepcopy
from eve.utils import config
import logging
import superdesk
from superdesk import Resource
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from apps.auth import get_user_id
from planning.common import set_original_creator


logger = logging.getLogger(__name__)
endpoint = 'events_planning_filters'

filters_schema = {
    'name': {
        'type': 'string',
        'iunique': True,
        'required': True
    },
    'agendas': {
        'type': 'list',
    },
    'calendars': {
        'type': 'list',
    },
    'places': {
        'type': 'list',
    },
    # Audit Information
    'original_creator': Resource.rel('users'),
    'version_creator': Resource.rel('users')
}


class EventPlanningFiltersResource(superdesk.Resource):
    """Resource for Event and Planning Filters"""

    endpoint_name = endpoint
    url = endpoint
    schema = filters_schema
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'planning_eventsplanning_filters_management',
                  'PATCH': 'planning_eventsplanning_filters_management',
                  'DELETE': 'planning_eventsplanning_filters_management'}


class EventPlanningFiltersService(superdesk.Service):
    """Service for Event and Planning Filters"""

    def on_create(self, docs):
        for doc in docs:
            self.is_valid(doc)
            set_original_creator(doc)

    def on_created(self, docs):
        for doc in docs:
            self._push_notification(
                doc.get(config.ID_FIELD),
                'event_planning_filters:created'
            )

    def is_valid(self, doc):
        """Check if the filter is valid"""
        if not doc.get('calendars') and not doc.get('agendas') and not doc.get('places'):
            raise SuperdeskApiError(message="Either a Calendar, Agenda or Place is required.")

    def _push_notification(self, _id, event_name):
        """Push socket notifiction"""
        push_notification(
            event_name,
            item=str(_id),
            user=str(get_user_id())
        )

    def on_update(self, updates, original):
        updated = deepcopy(original)
        updated.update(updates)
        self.is_valid(updated)
        user_id = get_user_id()
        if user_id:
            updates['version_creator'] = user_id

    def on_updated(self, updates, original):
        self._push_notification(
            original.get(config.ID_FIELD),
            'event_planning_filters:updated'
        )

    def on_deleted(self, doc):
        self._push_notification(
            doc.get(config.ID_FIELD),
            'event_planning_filters:deleted'
        )
