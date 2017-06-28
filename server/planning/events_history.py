# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource
from .history import HistoryService
import logging
from eve.utils import config

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

    def on_item_deleted(self, doc):
        lookup = {'event_id': doc[config.ID_FIELD]}
        self.delete(lookup=lookup)

    def _save_history(self, event, update, operation):
        history = {
            'event_id': event[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }
        self.post([history])
