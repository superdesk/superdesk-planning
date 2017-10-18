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
from .assignments import AssignmentsResource, assignments_schema
from .common import ASSIGNMENT_WORKFLOW_STATE


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
    def update(self, id, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        if original.get('assigned_to').get('state') != ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
            raise SuperdeskApiError.forbiddenError('Cannot complete. Assignment not in progress.')

        updates['assigned_to'] = deepcopy(original).get('assigned_to')
        updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED

        item = self.backend.update(self.datasource, id, updates, original)

        push_notification(
            'assignments:completed',
            item=str(original[config.ID_FIELD]),
            planning=original.get('planning_item'),
            assigned_desk=(original.get('assigned_to') or {}).get('desk'),
            assignment_state=ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
            user=str(user),
            session=str(session)
        )

        return item
