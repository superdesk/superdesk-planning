# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource, get_resource_service
from .history import HistoryService
import logging
from eve.utils import config

logger = logging.getLogger(__name__)


class PlanningHistoryResource(Resource):
    """Resource for keeping track of the history of planning entries
    """

    endpoint_name = 'planning_history'
    resource_methods = ['GET']
    item_methods = ['GET']
    schema = {
        'planning_id': Resource.rel('planning', True),
        'user_id': Resource.rel('users', True),
        'operation': {'type': 'string'},
        'update': {'type': 'dict', 'nullable': True}
    }


class PlanningHistoryService(HistoryService):
    """Service for keeping track of the history of a planning entries
    """

    def _save_history(self, planning, update, operation):
        history = {
            'planning_id': planning[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }
        self.post([history])

    def on_spike(self, updates, original):
        """Spike event

        On spike of a planning item the history of any agendas that the item belongs to will have an entry added to
        their history as effectively the scope of what the agenda contains has changed.
        :param updates:
        :param original:
        :return:
        """
        agenda_service = get_resource_service('agenda')
        for agenda in agenda_service.find(where={'planning_items': original['_id']}):
            get_resource_service('agenda_history').on_item_updated({'planning_items': original['_id']}, agenda,
                                                                   operation='item spiked')
        super().on_spike(updates, original)

    def on_unspike(self, updates, original):
        agenda_service = get_resource_service('agenda')
        for agenda in agenda_service.find(where={'planning_items': original['_id']}):
            get_resource_service('agenda_history').on_item_updated({'planning_items': original['_id']}, agenda,
                                                                   operation='item unspiked')
        super().on_unspike(updates, original)
