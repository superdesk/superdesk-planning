# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Resource, get_resource_service
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

        # Split an update to two actions if needed
        planning_history_service = get_resource_service('planning_history')
        cov_diff = {
            'coverage_id': original.get('coverage_item'),
            'assigned_to': {}
        }
        if 'priority' in diff.keys():
            cov_diff['assigned_to']['priority'] = diff.pop('priority')
            self._save_history(item, {'priority': cov_diff['assigned_to']['priority']},
                               ASSIGNMENT_HISTORY_ACTIONS.EDIT_PRIORITY)
            planning_history_service._save_history({'_id': original.get('planning_item')},
                                                   cov_diff, ASSIGNMENT_HISTORY_ACTIONS.EDIT_PRIORITY)

        if 'assigned_to' in diff.keys():
            cov_diff['assigned_to'] = diff['assigned_to']
            self._save_history(item, diff, ASSIGNMENT_HISTORY_ACTIONS.REASSIGNED)
            planning_history_service._save_history({'_id': original.get('planning_item')},
                                                   cov_diff, ASSIGNMENT_HISTORY_ACTIONS.REASSIGNED)

    def _update_assignment_coverage_history(self, updates, original, operation):
        self.on_item_updated(updates, original, operation)
        cov = {'coverage_id': original.get('coverage_item')}
        if operation in [
                ASSIGNMENT_HISTORY_ACTIONS.CONFIRM,
                ASSIGNMENT_HISTORY_ACTIONS.REVERT,
                ASSIGNMENT_HISTORY_ACTIONS.COMPLETE]:
            cov['assigned_to'] = updates.get('assigned_to')

        get_resource_service('planning_history')._save_history({'_id': original.get('planning_item')}, cov, operation)

    def on_item_add_to_workflow(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.ADD_TO_WORKFLOW)

    def on_item_start_working(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.START_WORKING)

    def on_item_complete(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.COMPLETE)

    def on_item_confirm_availability(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.CONFIRM)

    def on_item_revert_availability(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.REVERT)

    def on_item_content_link(self, updates, original):
        self._update_assignment_coverage_history(updates, original, ASSIGNMENT_HISTORY_ACTIONS.CONTENT_LINK)

    def on_item_content_unlink(self, updates, original, operation=None):
        self._update_assignment_coverage_history(updates, original, operation or ASSIGNMENT_HISTORY_ACTIONS.UNLINK)
