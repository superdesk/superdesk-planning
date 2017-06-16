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


class AgendaHistoryResource(Resource):
    """Resource for keeping track of the history of a planning agenda
    """

    endpoint_name = 'agenda_history'
    resource_methods = ['GET']
    item_methods = ['GET']
    schema = {
        'agenda_id': Resource.rel('planning', True),
        'user_id': Resource.rel('users', True),
        'operation': {'type': 'string'},
        'update': {'type': 'dict', 'nullable': True}
    }


class AgendaHistoryService(HistoryService):
    """Service for keeping track of the history of a planning agenda
    """

    def _save_history(self, agenda, update, operation):
        history = {
            'agenda_id': agenda[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }
        self.post([history])
