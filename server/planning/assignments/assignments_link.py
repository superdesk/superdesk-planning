# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from copy import deepcopy
from flask_babel import _

from superdesk import Resource, Service, get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from eve.utils import config
from planning.common import ASSIGNMENT_WORKFLOW_STATE, get_related_items, get_coverage_for_assignment, \
    update_assignment_on_link_unlink, get_next_assignment_status, get_delivery_publish_time, \
    is_content_link_to_coverage_allowed
from apps.archive.common import get_user, is_assigned_to_a_desk
from apps.content import push_content_notification
from superdesk.notification import push_notification
import logging

logger = logging.getLogger(__name__)


class AssignmentsLinkService(Service):
    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')

        for doc in docs:
            assignment = get_resource_service('assignments').find_one(req=None, _id=doc.pop('assignment_id'))
            item_id = doc.pop('item_id')
            actioned_item = production.find_one(req=None, _id=item_id)
            related_items = get_related_items(actioned_item)
            ids = self.link_archive_items_to_assignments(assignment, related_items, actioned_item, doc)

        return ids

    def link_archive_items_to_assignments(self, assignment, related_items, actioned_item, doc):
        assignments_service = get_resource_service('assignments')
        delivery_service = get_resource_service('delivery')
        assignments_service.validate_assignment_action(assignment)
        already_completed = assignment['assigned_to']['state'] == ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        items = []
        ids = []
        deliveries = []
        published_updated_items = []
        updates = {'assigned_to': deepcopy(assignment.get('assigned_to'))}
        need_complete = None
        for item in related_items:
            if not item.get('assignment_id') or (item['_id'] == actioned_item.get('_id') and doc.get('force')):
                # Update the delivery for the item if one exists
                delivery = delivery_service.find_one(req=None, item_id=item[config.ID_FIELD])
                if delivery:
                    delivery_service.patch(delivery['_id'], {
                        'assignment_id': assignment['_id'],
                        'scheduled_update_id': assignment.get('scheduled_update_id'),
                    })
                else:
                    # Add a delivery for the item
                    deliveries.append({
                        'item_id': item[config.ID_FIELD],
                        'assignment_id': assignment.get(config.ID_FIELD),
                        'planning_id': assignment['planning_item'],
                        'coverage_id': assignment['coverage_item'],
                        'item_state': item.get('state'),
                        'sequence_no': item.get('rewrite_sequence') or 0,
                        'publish_time': get_delivery_publish_time(item),
                        'scheduled_update_id': assignment.get('scheduled_update_id'),
                    })

                # Update archive/published collection with assignment linking
                update_assignment_on_link_unlink(assignment[config.ID_FIELD], item, published_updated_items)

                ids.append(item.get(config.ID_FIELD))
                items.append(item)

                if item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] and \
                        not assignment.get('scheduled_update_id') and \
                        assignment['assigned_to']['state'] != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                    # If assignment belongs to coverage, 'complete' it if any news item is published
                    need_complete = True

        # Create all deliveries
        if len(deliveries) > 0:
            delivery_service.post(deliveries)

        self.update_assignment(updates, assignment, actioned_item, doc.pop('reassign', None), already_completed,
                               need_complete)
        actioned_item['assignment_id'] = assignment[config.ID_FIELD]
        doc.update(actioned_item)

        # Save assignment history
        # Update assignment history with all items affected
        if len(ids) > 0:
            updates['assigned_to']['item_ids'] = ids
            if not assignment.get('scheduled_update_id'):
                assignment_history_service = get_resource_service('assignments_history')
                assignment_history_service.on_item_content_link(updates, assignment)

            if (actioned_item.get(ITEM_STATE) not in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] or
                    already_completed) and not need_complete:
                # publishing planning item
                assignments_service.publish_planning(assignment['planning_item'])

        # Send notifications
        push_content_notification(items)
        push_notification(
            'content:link',
            item=str(actioned_item[config.ID_FIELD]),
            assignment=assignment[config.ID_FIELD]
        )
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

        if not is_content_link_to_coverage_allowed(item):
            raise SuperdeskApiError.badRequestError(_(
                'Content type "%(content_type)s" is not allowed to be linked to a coverage',
                content_type=item['type']
            ))

        if not doc.get('force') and item.get('assignment_id'):
            raise SuperdeskApiError.badRequestError(
                'Content is already linked to an assignment. Cannot link assignment and content.'
            )

        if not is_assigned_to_a_desk(item):
            raise SuperdeskApiError.badRequestError(
                'Content not in workflow. Cannot link assignment and content.'
            )

        if not item.get('rewrite_of'):
            delivery = get_resource_service('delivery').find_one(
                req=None,
                assignment_id=doc.get('assignment_id')
            )

            if delivery:
                raise SuperdeskApiError.badRequestError(
                    'Content already exists for the assignment. Cannot link assignment and content.'
                )

            # scheduled update validation
            if assignment.get('scheduled_update_id'):
                raise SuperdeskApiError.badRequestError('Only updates can be linked to a scheduled update assignment')

        coverage = get_coverage_for_assignment(assignment)
        allowed_states = [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENT_WORKFLOW_STATE.COMPLETED]
        if (coverage and len(coverage.get('scheduled_updates')) > 0 and
                str(assignment['_id']) != str((coverage.get('assigned_to') or {}).get('assignment_id'))):
            if (coverage.get('assigned_to') or {}).get('state') not in allowed_states:
                raise SuperdeskApiError('Previous coverage is not linked to content.')

            # Check all previous scheduled updated to be linked/completed
            for s in coverage.get('scheduled_updates'):
                assigned_to = (s.get('assigned_to') or {})
                if str(assigned_to.get('assignment_id')) == str(doc.get('assignment_id')):
                    break

                if assigned_to.get('state') not in allowed_states:
                    raise SuperdeskApiError('Previous scheduled-update pending content-linking/completion')

    def update_assignment(self, updates, assignment, actioned_item, reassign, already_completed, need_complete):
        # Update assignments, assignment history and publish planning
        # set the state to in progress if no item in the updates chain has ever been published
        updated = False
        if need_complete:
            updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        elif not already_completed:
            new_state = ASSIGNMENT_WORKFLOW_STATE.COMPLETED if \
                actioned_item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED] else \
                ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
            updates['assigned_to']['state'] = get_next_assignment_status(updates, new_state)
            updated = True

        # on fulfiling the assignment the user is assigned the assignment, for add to planning it is not
        if reassign:
            user = get_user()
            if user and str(user.get(config.ID_FIELD)) != \
                    (assignment.get('assigned_to') or {}).get('user'):
                updates['assigned_to']['user'] = str(user.get(config.ID_FIELD))
                updated = True

            # if the item & assignment are'nt on the same desk, move the assignment to the item desk
            if (assignment.get('assigned_to') or {}).get('desk') != str(actioned_item.get('task').get('desk')):
                updates['assigned_to']['desk'] = str(actioned_item.get('task').get('desk'))
                updated = True

            # On a reassign if it was accepted clear the accept flag
            if assignment.get('accepted', False):
                updates['accepted'] = False
                updated = True

        if need_complete:
            get_resource_service('assignments_complete').update(assignment[config.ID_FIELD], updates, assignment)
        if updated:
            get_resource_service('assignments').patch(assignment[config.ID_FIELD], updates)


class AssignmentsLinkResource(Resource):
    endpoint_name = resource_title = 'assignments_link'
    url = 'assignments/link'
    schema = {
        'assignment_id': {
            'type': 'objectid',
            'required': True
        },
        'item_id': {
            'type': 'string',
            'required': True
        },
        'reassign': {
            'type': 'boolean',
            'required': True
        },
        'force': {'type': 'boolean'}
    }

    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'archive'}
