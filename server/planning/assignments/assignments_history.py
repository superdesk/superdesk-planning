# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource
from copy import deepcopy
from planning.history import HistoryService
import logging
from eve.utils import config
from collections import namedtuple

logger = logging.getLogger(__name__)

assignment_history_actions = ['add_to_workflow', 'edit_priority', 'reassigned', 'content_link', 'complete',
                              'confirm', 'revert', 'submitted', 'cancelled', 'spike_unlink', 'unlink', 'start_working']
ASSIGNMENT_HISTORY_ACTIONS = namedtuple('ASSIGNMENT_HISTORY_ACTIONS',
                                        ['ADD_TO_WORKFLOW', 'EDIT_PRIORITY', 'REASSIGNED', 'CONTENT_LINK',
                                         'COMPLETE', 'CONFIRM', 'REVERT', 'SUBMITTED', 'CANCELLED',
                                         'SPIKE_UNLINK', 'UNLINK', 'START_WORKING'])(*assignment_history_actions)


class AssignmentsHistoryResource(Resource):
    endpoint_name = 'assignments_history'
    resource_methods = ['GET']
    item_methods = ['GET']
    schema = {
        'assignment_id': {'type': 'string'},
        'user_id': Resource.rel('users', True),
        'operation': {'type': 'string'},
        'update': {'type': 'dict', 'nullable': True}
    }


class AssignmentsHistoryService(HistoryService):

    def _save_history(self, assignment, update, operation):
        history = {
            'assignment_id': assignment[config.ID_FIELD],
            'user_id': self.get_user_id(),
            'operation': operation,
            'update': update
        }

        self.post([history])

    def on_item_updated(self, updates, original, operation=None):
        item = deepcopy(original)
        if updates:
            item.update(updates)

        diff = self._changes(original, updates)
        if operation:
            self._save_history(item, diff, operation)
            return

        # Spilt an update to two actions if needed
        if 'priority' in diff.keys():
            self._save_history(item, {'priority': diff.pop('priority')}, ASSIGNMENT_HISTORY_ACTIONS.EDIT_PRIORITY)

        if 'assigned_to' in diff.keys():
            self._save_history(item, diff, ASSIGNMENT_HISTORY_ACTIONS.REASSIGNED)
