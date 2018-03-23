# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from eve.utils import config
from copy import deepcopy
from .planning import PlanningResource, planning_schema
from planning.common import WORKFLOW_STATE, ITEM_STATE, update_published_item, ITEM_ACTIONS


planning_cancel_schema = deepcopy(planning_schema)
planning_cancel_schema['reason'] = {
    'type': 'string',
    'nullable': True
}
planning_cancel_schema['event_cancellation'] = {
    'type': 'boolean',
    'nullable': True
}
planning_cancel_schema['cancel_all_coverage'] = {
    'type': 'boolean',
    'nullable': True
}


class PlanningCancelResource(PlanningResource):
    url = 'planning/cancel'
    resource_title = endpoint_name = 'planning_cancel'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_management'}

    schema = planning_cancel_schema


class PlanningCancelService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')
        coverage_states = get_resource_service('vocabularies').find_one(
            req=None,
            _id='newscoveragestatus'
        )

        event_cancellation = updates.pop('event_cancellation', False)
        cancel_all_coverage = updates.pop('cancel_all_coverage', False)

        coverage_cancel_state = None
        if coverage_states:
            coverage_cancel_state = next((x for x in coverage_states.get('items', [])
                                          if x['qcode'] == 'ncostat:notint'), None)
            coverage_cancel_state.pop('is_active', None)

        # Formulate the right 'note' for the scenario
        note = '''------------------------------------------------------------
Planning cancelled
'''
        if event_cancellation:
            note = '''------------------------------------------------------------
Event cancelled
'''
        elif cancel_all_coverage:
            note = '''------------------------------------------------------------
Coverage cancelled
'''
        ids = []
        updates['coverages'] = deepcopy(original.get('coverages'))
        coverages = updates.get('coverages') or []
        reason = updates.pop('reason', None)

        planning_service = get_resource_service('planning')
        for coverage in coverages:
            if coverage_cancel_state and coverage.get('news_coverage_status')['qcode'] !=\
                    coverage_cancel_state['qcode']:
                ids.append(coverage.get('coverage_id'))
                planning_service.cancel_coverage(coverage, coverage_cancel_state, None, note,
                                                 reason, event_cancellation)

        if cancel_all_coverage:
            push_notification(
                'coverage:cancelled',
                planning_item=str(original[config.ID_FIELD]),
                user=str(user),
                session=str(session),
                reason=reason,
                coverage_state=coverage_cancel_state,
                ids=ids
            )

            item = self.backend.update(self.datasource, id, updates, original)
            return item

        self._cancel_plan(updates, original, note, reason)

        item = self.backend.update(self.datasource, id, updates, original)

        push_notification(
            'planning:cancelled',
            item=str(original[config.ID_FIELD]),
            user=str(user),
            session=str(session),
            reason=reason,
            coverage_state=coverage_cancel_state,
            event_cancellation=event_cancellation
        )

        return item

    def _cancel_plan(self, updates, original, ednote, reason):
        if reason:
            ednote += 'Reason: {}\n'.format(reason)

        if 'ednote' in original:
            ednote = original['ednote'] + '\n\n' + ednote

        updates['ednote'] = ednote
        updates[ITEM_STATE] = WORKFLOW_STATE.CANCELLED

    def on_updated(self, updates, original):
        if original.get('lock_action') in [ITEM_ACTIONS.EDIT,
                                           ITEM_ACTIONS.PLANNING_CANCEL,
                                           ITEM_ACTIONS.CANCEL_ALL_COVERAGE]:
            update_published_item(updates, original)
