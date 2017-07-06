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


class CoverageHistoryResource(Resource):
    endpoint_name = 'coverage_history'
    resource_methods = ['GET']
    item_methods = ['GET']
    schema = {
        'coverage_id': {'type': 'string'},
        'user_id': Resource.rel('users', True),
        'operation': {'type': 'string'},
        'update': {'type': 'dict', 'nullable': True}
    }


class CoverageHistoryService(HistoryService):

    def on_item_created(self, items):
        super().on_item_created(items)
        for item in items:
            self._save_planning_history(item['planning_item'], item.get('_id'), 'coverage created')

    def on_item_updated(self, updates, original, operation=None):
        super().on_item_updated(updates, original, operation)
        self._save_planning_history(original['planning_item'], original.get('_id'), 'coverage updated')

    def on_item_deleted(self, doc):
        lookup = {'coverage_id': doc[config.ID_FIELD]}
        self.delete(lookup=lookup)
        # find the planning item that this coverage belongs to and updates it's history with a coverage deleted
        self._save_planning_history(doc['planning_item'], doc.get('_id'), 'coverage deleted')

    def _save_history(self, event, update, operation):
        history = {
            'coverage_id': event[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }
        self.post([history])

    def _save_planning_history(self, planning_id, coverage_id, operation):
        """Changes to the coverage are reported in the planning history

        :param planning_id:
        :param coverage_id:
        :param operation:
        :return:
        """
        planning = get_resource_service('planning').find_one(req=None, _id=planning_id)
        get_resource_service('planning_history').on_item_updated({'coverage_id': coverage_id}, planning, operation)
