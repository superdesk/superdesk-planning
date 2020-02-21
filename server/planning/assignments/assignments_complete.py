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
from .assignments import AssignmentsResource, assignments_schema, AssignmentsService
from planning.common import ASSIGNMENT_WORKFLOW_STATE, remove_lock_information, get_coverage_type_name,\
    get_next_assignment_status, get_coverage_for_assignment
from planning.planning_notifications import PlanningNotifications


assignments_complete_schema = deepcopy(assignments_schema)

# allow an external application to pass a user
assignments_complete_schema['proxy_user'] = {'type': 'objectid', 'nullable': True}


class AssignmentsCompleteResource(AssignmentsResource):
    url = 'assignments/complete'
    resource_title = endpoint_name = 'assignments_complete'

    datasource = {'source': 'assignments'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'archive'}

    schema = assignments_complete_schema


class AssignmentsCompleteService(BaseService):
    def on_update(self, updates, original):
        assignment_state = original.get('assigned_to').get('state')
        AssignmentsService.set_type(updates, original)
        assignments_service = get_resource_service('assignments')
        assignments_service.validate_assignment_action(original)
        text_assignment = assignments_service.is_text_assignment(original)

        if text_assignment:
            if original.get('scheduled_update_id'):
                coverage = get_coverage_for_assignment(original)
                cov_assigned_to = coverage.get('assigned_to')
                if cov_assigned_to['state'] != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                    raise SuperdeskApiError.forbiddenError('Cannot complete a scheduled update unless parent coverage '
                                                           'is completed.')
                for s in coverage.get('scheduled_updates'):
                    if s.get('scheduled_update_id') == original.get('scheduled_update_id'):
                        break

                    if (s.get('assigned_to') or {}).get('state') != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                        raise SuperdeskApiError.forbiddenError('Cannot complete a scheduled update unless all '
                                                               'previous scheduled updates are completed.')
                if assignment_state not in [ASSIGNMENT_WORKFLOW_STATE.ASSIGNED, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
                                            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS]:
                    raise SuperdeskApiError.forbiddenError('Update Assignment not in correct state.')
            elif not original.get('scheduled_update_id') and assignment_state != ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
                raise SuperdeskApiError.forbiddenError('Assignment not in progress.')
        elif assignment_state not in [ASSIGNMENT_WORKFLOW_STATE.ASSIGNED, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
                                      ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS]:
            raise SuperdeskApiError.forbiddenError(
                'Cannot confirm availability. Assignment should be assigned, submitted or in progress.')

    def update(self, id, updates, original):
        # if the completion is being done by an external application then ensure that it is not locked
        if 'proxy_user' in updates:
            if original.get('lock_user'):
                raise SuperdeskApiError.forbiddenError(
                    'Assignment is locked')
            user = updates.pop('proxy_user', None)
            proxy_user = True
        else:
            user = get_user(required=True).get(config.ID_FIELD, '')
            proxy_user = False
        session = get_auth().get(config.ID_FIELD, '')

        original_assigned_to = deepcopy(original).get('assigned_to')
        if not updates.get('assigned_to'):
            updates['assigned_to'] = {}
        original_assigned_to.update(updates['assigned_to'])
        updates['assigned_to'] = original_assigned_to

        assignments_service = get_resource_service('assignments')
        # If we are confirming availability, save the revert state for revert action
        text_assignment = assignments_service.is_text_assignment(original)
        if not text_assignment:
            updates['assigned_to']['revert_state'] = updates['assigned_to']['state']

        updates['assigned_to']['state'] = get_next_assignment_status(updates, ASSIGNMENT_WORKFLOW_STATE.COMPLETED)

        remove_lock_information(updates)

        item = self.backend.update(self.datasource, id, updates, original)

        # publish the planning item
        assignments_service.publish_planning(original['planning_item'])

        # Save history if user initiates complete
        if text_assignment:
            get_resource_service('assignments_history').on_item_complete(updates, original)
        else:
            if proxy_user:
                updates['proxy_user'] = user
            get_resource_service('assignments_history').on_item_confirm_availability(updates, original)

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
        target_user = original.get('assigned_to', {}).get('assignor_user')
        if target_user is None:
            target_user = original.get('assigned_to', {}).get('assignor_desk')
        PlanningNotifications().notify_assignment(target_user=target_user,
                                                  message='assignment_fulfilled_msg',
                                                  assignee=assignee,
                                                  coverage_type=get_coverage_type_name(
                                                      original.get('planning', {}).get('g2_content_type', '')),
                                                  slugline=original.get('planning', {}).get('slugline'),
                                                  omit_user=True,
                                                  assignment_id=original[config.ID_FIELD],
                                                  is_link=True,
                                                  no_email=True)

        return item
