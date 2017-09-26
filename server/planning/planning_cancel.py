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
from .common import WORKFLOW_STATE, ITEM_STATE


planning_cancel_schema = deepcopy(planning_schema)
planning_cancel_schema['reason'] = {
    'type': 'string',
    'nullable': True
}
planning_cancel_schema['event_cancellation'] = {
    'type': 'boolean',
    'nullable': True
}
planning_cancel_schema['coverage_cancellation_only'] = {
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
        coverage_service = get_resource_service('coverage')
        coverage_states = get_resource_service('vocabularies').find_one(
            req=None,
            _id='newscoveragestatus'
        )

        event_cancellation = updates.get('event_cancellation', False)
        coverage_cancellation_only = updates.get('coverage_cancellation_only', False)

        coverage_cancel_state = None
        if coverage_states:
            coverage_cancel_state = [x for x in coverage_states.get('items', []) if
                                     x['qcode'] == 'ncostat:notint'][0]
            coverage_cancel_state.pop('is_active', None)

        # Formulate the right 'note' for the scenario
        note = '''------------------------------------------------------------
Planning cancelled
'''
        if event_cancellation:
            note = '''------------------------------------------------------------
Event cancelled
'''
            del updates['event_cancellation']

        elif coverage_cancellation_only:
            note = '''------------------------------------------------------------
Coverage cancelled
'''
            del updates['coverage_cancellation_only']

        coverages = list(coverage_service.find(
            where={'planning_item': original[config.ID_FIELD]}
        ))

        ids = []
        for coverage in coverages:
            if coverage_cancel_state and coverage.get('news_coverage_status')['qcode'] !=\
                    coverage_cancel_state['qcode']:
                ids.append(coverage.get(config.ID_FIELD))
                self._cancel_coverage(updates, coverage, coverage_service, coverage_cancel_state, note)

        reason = updates.get('reason', None)

        if coverage_cancellation_only:
            push_notification(
                'coverage:cancelled',
                planning_item=str(original[config.ID_FIELD]),
                user=str(user),
                session=str(session),
                reason=reason,
                coverage_state=coverage_cancel_state,
                ids=ids
            )
            return
        else:
            self._cancel_plan(updates, original, note)

        if reason:
            del updates['reason']

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

    def _cancel_plan(self, updates, original, ednote):
        if updates.get('reason', None) is not None:
            ednote += 'Reason: {}\n'.format(updates['reason'])

        if 'ednote' in original:
            ednote = original['ednote'] + '\n\n' + ednote

        updates['ednote'] = ednote
        updates[ITEM_STATE] = WORKFLOW_STATE.CANCELLED

    def _cancel_coverage(self, updates, coverage, coverage_service, coverage_cancel_state, note):
        if updates.get('reason', None) is not None:
            note += 'Reason: {}\n'.format(updates['reason'])

        if 'internal_note' in coverage.get('planning', {}):
            note = coverage['planning']['internal_note'] + '\n\n' + note

        updates = {
            'planning': deepcopy(coverage.get('planning', {})),
            'news_coverage_status': coverage_cancel_state
        }

        updates['planning']['internal_note'] = note

        coverage_service.update(
            coverage[config.ID_FIELD],
            updates,
            coverage
        )
