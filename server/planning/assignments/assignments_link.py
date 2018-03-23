# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from copy import deepcopy
from superdesk import Resource, Service, get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE, PUBLISH_STATES
from eve.utils import config
from planning.common import ASSIGNMENT_WORKFLOW_STATE
from apps.archive.common import get_user, is_assigned_to_a_desk
from apps.content import push_content_notification


class AssignmentsLinkService(Service):
    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        assignments_complete = get_resource_service('assignments_complete')
        items = []

        for doc in docs:
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            item = production.find_one(req=None, _id=doc.pop('item_id'))

            # set the state to in progress if item in published state
            updates = {'assigned_to': deepcopy(assignment.get('assigned_to'))}
            updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED if \
                item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] else \
                ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS

            # on fulfiling the assignment the user is assigned the assignment.
            user = get_user()
            if user and str(user.get(config.ID_FIELD)) != (assignment.get('assigned_to') or {}).get('user'):
                updates['assigned_to']['user'] = str(user.get(config.ID_FIELD))

            if item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED]:
                assignments_complete.update(assignment[config.ID_FIELD], updates, assignment)
            else:
                assignments_service.patch(assignment[config.ID_FIELD], updates)

            # reference the item to the assignment
            production.system_update(
                item[config.ID_FIELD],
                {'assignment_id': assignment[config.ID_FIELD]},
                item
            )

            # if the item is publish then update those items as well
            if item.get(ITEM_STATE) in PUBLISH_STATES:
                get_resource_service('published').update_published_items(
                    item[config.ID_FIELD],
                    'assignment_id', assignment[config.ID_FIELD])

            get_resource_service('delivery').post([{
                'item_id': item[config.ID_FIELD],
                'assignment_id': assignment[config.ID_FIELD],
                'planning_id': assignment['planning_item'],
                'coverage_id': assignment['coverage_item']
            }])
            item['assignment_id'] = assignment[config.ID_FIELD]

            # Save assignment history
            assignment_history_service = get_resource_service('assignments_history')
            assignment_history_service.on_item_updated(updates, assignment, 'content_link')
            if updates['assigned_to'].get('state') == ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                assignment_history_service.on_item_updated(updates, assignment, 'complete')

            doc.update(item)
            ids.append(doc[config.ID_FIELD])
            items.append(item)

        push_content_notification(items)
        return ids

    def _validate(self, doc):
        assignment = get_resource_service('assignments').find_one(
            req=None,
            _id=doc.get('assignment_id')
        )

        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        item = get_resource_service('archive').find_one(
            req=None,
            _id=doc.get('item_id')
        )

        if not item:
            raise SuperdeskApiError.badRequestError('Content item not found.')

        if item.get('assignment_id'):
            raise SuperdeskApiError.badRequestError(
                'Content is already linked to an assignment. Cannot link assignment and content.'
            )

        if not is_assigned_to_a_desk(item):
            raise SuperdeskApiError.badRequestError(
                'Content not in workflow. Cannot link assignment and content.'
            )

        delivery = get_resource_service('delivery').find_one(
            req=None,
            assignment_id=doc.get('assignment_id')
        )

        if delivery:
            raise SuperdeskApiError.badRequestError(
                'Content already exists for the assignment. Cannot link assignment and content.'
            )


class AssignmentsLinkResource(Resource):
    endpoint_name = resource_title = 'assignments_link'
    url = 'assignments/link'
    schema = {
        'assignment_id': {
            'type': 'string',
            'required': True
        },
        'item_id': {
            'type': 'string',
            'required': True
        }
    }

    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
