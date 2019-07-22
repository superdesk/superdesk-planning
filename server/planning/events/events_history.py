# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource, get_resource_service
from planning.history import HistoryService
import logging
from eve.utils import config
from copy import deepcopy
from planning.item_lock import LOCK_ACTION

logger = logging.getLogger(__name__)


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


class EventsHistoryService(HistoryService):
    def on_item_created(self, items, operation=None):
        created_from_planning = []
        regular_events = []
        for item in items:
            planning_items = get_resource_service('events').get_plannings_for_event(item)
            if planning_items.count() > 0:
                item['created_from_planning'] = planning_items[0].get('_id')
                created_from_planning.append(item)
            else:
                regular_events.append((item))

        super().on_item_created(created_from_planning, 'created_from_planning')
        super().on_item_created(regular_events)

    def on_item_deleted(self, doc):
        lookup = {'event_id': doc[config.ID_FIELD]}
        self.delete(lookup=lookup)

    def on_item_updated(self, updates, original, operation=None):
        item = deepcopy(original)
        if list(item.keys()) == ['_id']:
            diff = self._remove_unwanted_fields(updates)
        else:
            diff = self._changes(original, updates)
            if updates:
                item.update(updates)

        if not operation:
            operation = 'convert_recurring' if original.get(LOCK_ACTION) == 'convert_recurring' else 'edited'

        self._save_history(item, diff, operation)

    def _save_history(self, event, update, operation):
        history = {
            'event_id': event[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }
        # a post action is recorded as a special case
        if operation == 'update':
            if 'scheduled' == update.get('state', ''):
                history['operation'] = 'post'
            elif 'canceled' == update.get('state', ''):
                history['operation'] = 'unpost'
        elif operation == 'create' and 'ingested' == update.get('state', ''):
            history['operation'] = 'ingested'
        self.post([history])

    def on_update_repetitions(self, updates, event_id, operation):
        self.on_item_updated(updates, {'_id': event_id}, operation or 'update_repetitions')

    def on_update_time(self, updates, original):
        self.on_item_updated(updates, original, 'update_time')
