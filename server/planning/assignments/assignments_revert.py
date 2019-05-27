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
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth
from eve.utils import config
from copy import deepcopy
from superdesk import get_resource_service
from .assignments import AssignmentsResource, assignments_schema
from planning.common import ASSIGNMENT_WORKFLOW_STATE, remove_lock_information


assignments_revert_schema = deepcopy(assignments_schema)


class AssignmentsRevertResource(AssignmentsResource):
    url = 'assignments/revert'
    resource_title = endpoint_name = 'assignments_revert'

    datasource = {'source': 'assignments'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'archive'}

    schema = assignments_revert_schema


class AssignmentsRevertService(BaseService):
    def on_update(self, updates, original):
        assignment_state = original.get('assigned_to').get('state')
        assignments_service = get_resource_service('assignments')
        assignments_service.validate_assignment_action(original)

        if assignments_service.is_text_assignment(original):
            raise SuperdeskApiError.forbiddenError('Cannot revert text assignments.')

        if assignment_state != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
            raise SuperdeskApiError.forbiddenError('Cannot revert an assignment which is not yet confirmed.')

        updates['assigned_to'] = deepcopy(original).get('assigned_to')
        updates['assigned_to']['state'] = updates['assigned_to'].get('revert_state', ASSIGNMENT_WORKFLOW_STATE.ASSIGNED)
        updates['assigned_to']['revert_state'] = None

        remove_lock_information(updates)

    def on_updated(self, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        # Save history
        get_resource_service('assignments_history').on_item_revert_availability(updates, original)

        push_notification(
            'assignments:reverted',
            item=str(original[config.ID_FIELD]),
            planning=original.get('planning_item'),
            assigned_user=(original.get('assigned_to') or {}).get('user'),
            assigned_desk=(original.get('assigned_to') or {}).get('desk'),
            assignment_state=updates.get('assigned_to', {})['state'],
            user=str(user),
            session=str(session),
            coverage=original.get('coverage_item')
        )

        # publish the planning item
        get_resource_service('assignments').publish_planning(original.get('planning_item'))

        # External (slack/browser pop-up) notifications
        assignments_service = get_resource_service('assignments')
        assignments_service.send_assignment_notification(updates, original, True)
