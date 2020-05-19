# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from flask import request
from superdesk import Resource, get_resource_service
from planning.history import HistoryService
import logging
from eve.utils import config
from copy import deepcopy
from planning.common import WORKFLOW_STATE, ITEM_ACTIONS, ASSIGNMENT_WORKFLOW_STATE
from planning.item_lock import LOCK_ACTION
from planning.assignments.assignments_history import ASSIGNMENT_HISTORY_ACTIONS
from superdesk.default_settings import strtobool

logger = logging.getLogger(__name__)
update_item_actions = ['assign_agenda', 'add_featured', 'remove_featured']


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

    def on_item_created(self, items):
        add_to_planning = strtobool(request.args.get('add_to_planning', 'false'))
        super().on_item_created(items, 'add_to_planning' if add_to_planning else None)

    def _save_history(self, planning, update, operation):
        user = self.get_user_id()
        # confirmation could be from external fulfillment, so set the user to the assignor
        if operation == ASSIGNMENT_HISTORY_ACTIONS.CONFIRM and self.get_user_id() is None:
            assigned_to = update.get('assigned_to')
            user = update.get('proxy_user', assigned_to.get('assignor_user', assigned_to.get('assignor_desk')))
        history = {
            'planning_id': planning[config.ID_FIELD],
            'user_id': user,
            'operation': operation,
            'update': update
        }
        self.post([history])

    def on_item_updated(self, updates, original, operation=None):
        item = deepcopy(original)
        if list(item.keys()) == ['_id']:
            diff = self._remove_unwanted_fields(updates)
        else:
            diff = self._changes(original, updates)
            diff.pop('coverages', None)
            if updates:
                item.update(updates)

        if len(diff.keys()) > 0:
            operation = operation or 'edited'
            if original.get(LOCK_ACTION) in update_item_actions:
                operation = original.get(LOCK_ACTION)
                if original.get(LOCK_ACTION) == 'assign_agenda':
                    diff['agendas'] = [a for a in diff.get('agendas', []) if a not in original.get('agendas', [])]

            if diff.get('event_item'):
                operation = 'create_event'

            self._save_history(item, diff, operation)

        self._save_coverage_history(updates, original)

    def on_cancel(self, updates, original):
        self.on_item_updated(updates, original,
                             'planning_cancel' if original.get('lock_action') in ['planning_cancel', 'edit']
                             else 'events_cancel')

    def _get_coverage_diff(self, updates, original):
        diff = {'coverage_id': original.get('coverage_id')}
        cov_plan_diff = self._changes(original.get('planning'),
                                      updates.get('planning'))

        if cov_plan_diff:
            diff['planning'] = cov_plan_diff

        if original.get('news_coverage_status') != updates.get('news_coverage_status'):
            diff['news_coverage_status'] = updates.get('news_coverage_status')

        return diff

    def _save_coverage_history(self, updates, original):
        """Save the coverage history for the planning item"""
        item = deepcopy(original)
        original_coverages = {c.get('coverage_id'): c for c in (original or {}).get('coverages') or []}
        updates_coverages = {c.get('coverage_id'): c for c in (updates or {}).get('coverages') or []}
        added, deleted, updated = [], [], []
        planning_service = get_resource_service('planning')
        add_to_planning = strtobool(request.args.get('add_to_planning', 'false'))

        for coverage_id, coverage in updates_coverages.items():
            original_coverage = original_coverages.get(coverage_id)
            if not original_coverage:
                added.append(coverage)
            elif planning_service.is_coverage_planning_modified(coverage, original_coverage) or \
                    planning_service.is_coverage_assignment_modified(coverage, original_coverage):
                updated.append(coverage)

        deleted = [coverage for cid, coverage in original_coverages.items() if cid not in updates_coverages]

        for cov in added:
            if cov.get('assigned_to', {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
                diff = {'coverage_id': cov.get('coverage_id')}
                diff.update(cov)
                self._save_history(item, diff, 'coverage_created_content' if add_to_planning else 'coverage_created')
                self._save_history(item, diff, 'reassigned')
                self._save_history(item, diff, 'add_to_workflow')
            else:
                self._save_history(item, cov, 'coverage_created')

        for cov in updated:
            original_coverage = original_coverages.get(cov.get('coverage_id'))
            diff = self._get_coverage_diff(cov, original_coverage)
            if len(diff.keys()) > 1:
                self._save_history(item, diff, 'coverage_edited')

            if cov.get('workflow_status') == WORKFLOW_STATE.CANCELLED and \
                    original_coverage.get('workflow_status') != WORKFLOW_STATE.CANCELLED:
                operation = 'coverage_cancelled'
                diff = {
                    'coverage_id': cov.get('coverage_id'),
                    'workflow_status': cov['workflow_status']
                }
                if not original.get(LOCK_ACTION):
                    operation = 'events_cancel'
                elif original.get(LOCK_ACTION) == ITEM_ACTIONS.PLANNING_CANCEL or \
                        updates.get('state') == WORKFLOW_STATE.CANCELLED:
                    # If cancelled through item action or through editor
                    operation = 'planning_cancel'

                self._save_history(item, diff, operation)

            # If assignment was added in an update
            if cov.get('assigned_to', {}).get('assignment_id') and\
                    not (original_coverage.get('assigned_to') or {}).get('assignment_id'):
                diff = {
                    'coverage_id': cov.get('coverage_id'),
                    'assigned_to': cov['assigned_to']
                }
                self._save_history(item, diff, 'coverage_assigned')

        for cov in deleted:
            self._save_history(item, {'coverage_id': cov.get('coverage_id')}, 'coverage_deleted')

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
