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
from superdesk import get_resource_service
from .assignments import AssignmentsResource, assignments_schema, AssignmentsService
from planning.common import ASSIGNMENT_WORKFLOW_STATE, remove_lock_information
from planning.planning_notifications import PlanningNotifications


assignments_complete_schema = deepcopy(assignments_schema)


class AssignmentsCompleteResource(AssignmentsResource):
    url = 'assignments/complete'
    resource_title = endpoint_name = 'assignments_complete'

    datasource = {'source': 'assignments'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_management'}

    schema = assignments_complete_schema


class AssignmentsCompleteService(BaseService):
    def on_update(self, updates, original):
        coverage_type = original.get('planning', {}).get('g2_content_type')
        assignment_state = original.get('assigned_to').get('state')
        AssignmentsService.set_type(updates, original)

        if coverage_type == 'text' and assignment_state != ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
            raise SuperdeskApiError.forbiddenError('Cannot complete. Assignment not in progress.')
        elif coverage_type != 'text' and \
                assignment_state not in [ASSIGNMENT_WORKFLOW_STATE.ASSIGNED, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED]:
            raise SuperdeskApiError.forbiddenError(
                'Cannot confirm availability. Assignment should be assigned or submitted.')

    def update(self, id, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        updates['assigned_to'] = deepcopy(original).get('assigned_to')

        # If we are confirming availability, save the revert state for revert action
        coverage_type = original.get('planning', {}).get('g2_content_type')
        if coverage_type != 'text':
            updates['assigned_to']['revert_state'] = updates['assigned_to']['state']

        updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED

        remove_lock_information(updates)

        item = self.backend.update(self.datasource, id, updates, original)

        # Save history if user initiates complete
        if original.get('lock_action') == 'complete':
            get_resource_service('assignments_history').on_item_updated(updates, original, 'complete')

        push_notification(
            'assignments:completed',
            item=str(original[config.ID_FIELD]),
            planning=original.get('planning_item'),
            assigned_user=(original.get('assigned_to') or {}).get('user'),
            assigned_desk=(original.get('assigned_to') or {}).get('desk'),
            assignment_state=ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
            user=str(user),
            session=str(session),
            coverage=original.get('coverage_item')
        )

        # Send notification that the work has been completed
        # Determine the display name of the assignee
        assigned_to_user = get_resource_service('users').find_one(req=None, _id=user)
        assignee = assigned_to_user.get('display_name') if assigned_to_user else 'Unknown'
        PlanningNotifications().notify_assignment(target_user=str(original.get('assigned_to', {}).get('assignor_user')),
                                                  message='{{coverage_type}} coverage \"{{slugline}}\" has been '
                                                          'completed by {{assignee}}',
                                                  assignee=assignee,
                                                  coverage_type=original.get('planning', {}).get('g2_content_type', ''),
                                                  slugline=original.get('planning', {}).get('slugline'),
                                                  omit_user=True)

        return item
