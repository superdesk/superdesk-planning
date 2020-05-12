# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from eve.utils import config
from copy import deepcopy
from .planning import PlanningResource, planning_schema
from planning.common import WORKFLOW_STATE, ITEM_STATE, get_coverage_type_name
from superdesk import get_resource_service
from planning.planning_notifications import PlanningNotifications


planning_reschedule_schema = deepcopy(planning_schema)
planning_reschedule_schema['reason'] = {
    'type': 'string',
    'nullable': True,
    'planning_reason': True
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

    merge_nested_documents = True


class PlanningRescheduleService(BaseService):
    def update(self, id, updates, original):
        reason = updates.pop('reason', None)
        self._reschedule_plan(updates, original, reason)

        updates['coverages'] = deepcopy(original.get('coverages'))
        coverages = updates.get('coverages') or []

        for coverage in coverages:
            self._reschedule_coverage(coverage, reason)

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

    def _reschedule_plan(self, updates, original, reason):
        updates['state_reason'] = reason

        if updates.get(ITEM_STATE) == WORKFLOW_STATE.DRAFT and original.get('pubstatus'):
            updates[ITEM_STATE] = WORKFLOW_STATE.SCHEDULED
        else:
            updates[ITEM_STATE] = updates.get(ITEM_STATE) or WORKFLOW_STATE.RESCHEDULED

    def _reschedule_coverage(self, coverage, reason):
        if coverage.get('workflow_status') != WORKFLOW_STATE.CANCELLED:
            coverage['planning']['workflow_status_reason'] = reason
            coverage['workflow_status'] = WORKFLOW_STATE.CANCELLED

        assigned_to = coverage.get('assigned_to')
        if assigned_to:
            assignment_service = get_resource_service('assignments')
            assignment = assignment_service.find_one(req=None, _id=assigned_to.get('assignment_id'))
            slugline = assignment.get('planning').get('slugline', '')
            coverage_type = assignment.get('planning').get('g2_content_type', '')
            PlanningNotifications().notify_assignment(coverage_status=coverage.get('workflow_status'),
                                                      target_user=assignment.get('assigned_to').get('user'),
                                                      target_desk=assignment.get('assigned_to').get(
                                                          'desk') if not assignment.get('assigned_to').get(
                                                          'user') else None,
                                                      message='assignment_rescheduled_msg',
                                                      slugline=slugline,
                                                      coverage_type=get_coverage_type_name(coverage_type))
