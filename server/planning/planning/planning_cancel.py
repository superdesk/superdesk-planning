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
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth
from eve.utils import config
from copy import deepcopy
from .planning import PlanningResource, planning_schema
from planning.common import WORKFLOW_STATE, ITEM_STATE, update_post_item, ITEM_ACTIONS, \
    is_valid_event_planning_reason, ASSIGNMENT_WORKFLOW_STATE
from flask import request


planning_cancel_schema = deepcopy(planning_schema)
planning_cancel_schema['reason'] = {
    'type': 'string',
    'nullable': True,
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

    merge_nested_documents = True


class PlanningCancelService(BaseService):

    def on_update(self, updates, original):
        if not is_valid_event_planning_reason(updates, original):
            raise SuperdeskApiError.badRequestError(message='Reason is required field.')

    def update(self, id, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')
        coverage_states = get_resource_service('vocabularies').find_one(
            req=None,
            _id='newscoveragestatus'
        )

        event_cancellation = request.view_args.get('event_cancellation')
        cancel_all_coverage = updates.pop('cancel_all_coverage', False)
        event_reschedule = updates.pop('event_reschedule', False)

        coverage_cancel_state = None
        if coverage_states:
            coverage_cancel_state = next((x for x in coverage_states.get('items', [])
                                          if x['qcode'] == 'ncostat:notint'), None)
            coverage_cancel_state.pop('is_active', None)

        ids = []
        updates['coverages'] = deepcopy(original.get('coverages'))
        coverages = updates.get('coverages') or []
        reason = updates.pop('reason', None)

        planning_service = get_resource_service('planning')
        for coverage in coverages:
            if coverage['workflow_status'] not in [WORKFLOW_STATE.CANCELLED, ASSIGNMENT_WORKFLOW_STATE.COMPLETED]:
                ids.append(coverage.get('coverage_id'))
                planning_service.cancel_coverage(coverage, coverage_cancel_state,
                                                 coverage.get('workflow_status'), None, reason,
                                                 event_cancellation, event_reschedule)

        if cancel_all_coverage:
            item = None
            if len(ids) > 0:
                item = self.backend.update(self.datasource, id, updates, original)
                push_notification(
                    'coverage:cancelled',
                    planning_item=str(original[config.ID_FIELD]),
                    user=str(user),
                    session=str(session),
                    reason=reason,
                    coverage_state=coverage_cancel_state,
                    etag=item.get('_etag'),
                    ids=ids
                )
            return item if item else self.find_one(req=None, _id=id)

        self._cancel_plan(updates, reason)

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

    def _cancel_plan(self, updates, reason):
        updates['state_reason'] = reason
        updates[ITEM_STATE] = WORKFLOW_STATE.CANCELLED

    def on_updated(self, updates, original):
        lock_action = original.get('lock_action')
        allowed_actions = [ITEM_ACTIONS.EDIT, ITEM_ACTIONS.PLANNING_CANCEL, ITEM_ACTIONS.CANCEL_ALL_COVERAGE]
        if request.view_args.get('event_cancellation') or lock_action in allowed_actions or \
                self.is_related_event_completed(updates, original):
            update_post_item(updates, original)

    def is_related_event_completed(self, updates, original):
        if len(original.get('coverages')) > 0 and len(updates.get('coverages') or []) > 0 and \
                not original['coverages'][0]['planning'].get('workflow_status_reason') and \
                updates['coverages'][0]['planning'].get('workflow_status_reason') == 'Event Completed':
            return True

        return False
