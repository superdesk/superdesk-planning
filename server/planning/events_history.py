# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource, Service
import logging
from copy import deepcopy
from flask import g
from eve.utils import config

logger = logging.getLogger(__name__)

fields_to_remove = ['_id', '_etag', '_current_version', '_updated', '_created']


class EventsHistoryResource(Resource):
    endpoint_name = 'events_history'
    resource_methods = ['GET']
    item_methods = ['GET']
    schema = {
        'event_id': {'type': 'string'},
        'user_id': Resource.rel('users', True),
        'operation': {'type': 'string'},
        'update': {'type': 'dict', 'nullable': True}
    }


class EventsHistoryService(Service):

    def on_item_updated(self, updates, original, operation=None):
        event = deepcopy(original)
        if updates:
            event.update(updates)
        self._save_history(event, updates, operation or 'update')

    def on_item_deleted(self, doc):
        lookup = {'event_id': doc[config.ID_FIELD]}
        self.delete(lookup=lookup)

    def on_item_created(self, events):
        for event in events:
            self._save_history({config.ID_FIELD: event[config.ID_FIELD]}, deepcopy(event), 'create')

    def get_user_id(self):
        user = getattr(g, 'user', None)
        if user:
            return user.get('_id')

    def _save_history(self, event, update, operation):
        history = {
            'event_id': event[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': self._remove_unwanted_fields(update)
        }
        self.post([history])

    def _remove_unwanted_fields(self, update):
        if update:
            update_copy = deepcopy(update)
            for field in fields_to_remove:
                update_copy.pop(field, None)

            return update_copy
