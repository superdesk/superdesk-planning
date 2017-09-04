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
from copy import deepcopy

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
        super().on_spike(updates, original)

    def on_unspike(self, updates, original):
        super().on_unspike(updates, original)

    def on_duplicate(self, parent, duplicate):
        self._save_history(
            {config.ID_FIELD: str(parent[config.ID_FIELD])},
            {'duplicate_id': str(duplicate[config.ID_FIELD])},
            'duplicate'
        )

    def on_duplicate_from(self, item, duplicate_id):
        new_plan = deepcopy(item)
        new_plan['duplicate_id'] = duplicate_id
        self._save_history(
            {config.ID_FIELD: str(item[config.ID_FIELD])},
            new_plan,
            'duplicate_from'
        )
