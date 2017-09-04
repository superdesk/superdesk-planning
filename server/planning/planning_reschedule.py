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


planning_reschedule_schema = deepcopy(planning_schema)
planning_reschedule_schema['reason'] = {
    'type': 'string',
    'nullable': True
}


class PlanningRescheduleResource(PlanningResource):
    url = 'planning/reschedule'
    resource_title = endpoint_name = 'planning_reschedule'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_management'}
    internal_resource = True

    schema = planning_reschedule_schema


class PlanningRescheduleService(BaseService):
    def update(self, id, updates, original):
        coverage_service = get_resource_service('coverage')

        self._reschedule_plan(updates, original)

        coverages = list(coverage_service.find(
            where={'planning_item': original[config.ID_FIELD]}
        ))

        for coverage in coverages:
            self._reschedule_coverage(updates, coverage, coverage_service)

        updates.pop('reason', None)
        return self.backend.update(self.datasource, id, updates, original)

    def on_updated(self, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        push_notification(
            'planning:rescheduled',
            item=str(original[config.ID_FIELD]),
            user=str(user),
            session=str(session)
        )

    def _reschedule_plan(self, updates, original):
        ednote = '''------------------------------------------------------------
Event Rescheduled
'''
        if updates.get('reason', None) is not None:
            ednote += 'Reason: {}\n'.format(updates['reason'])

        if 'ednote' in original:
            ednote = original['ednote'] + '\n\n' + ednote

        updates['ednote'] = ednote
        updates[ITEM_STATE] = WORKFLOW_STATE.RESCHEDULED

    def _reschedule_coverage(self, updates, coverage, coverage_service):
        note = '''------------------------------------------------------------
Event has been rescheduled
'''
        if updates.get('reason', None) is not None:
            note += 'Reason: {}\n'.format(updates['reason'])

        if 'internal_note' in coverage.get('planning', {}):
            note = coverage['planning']['internal_note'] + '\n\n' + note

        updates = {
            'planning': deepcopy(coverage.get('planning', {}))
        }

        updates['planning']['internal_note'] = note

        coverage_service.update(
            coverage[config.ID_FIELD],
            updates,
            coverage
        )
