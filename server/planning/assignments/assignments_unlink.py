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
from eve.utils import config
from planning.common import ASSIGNMENT_WORKFLOW_STATE, get_coverage_type_name, get_related_items, \
    update_assignment_on_link_unlink
from apps.content import push_content_notification
from planning.item_lock import LOCK_USER, LOCK_SESSION
from apps.archive.common import get_user, get_auth
from planning.planning_notifications import PlanningNotifications
from superdesk.notification import push_notification
from .assignments_history import ASSIGNMENT_HISTORY_ACTIONS


class AssignmentsUnlinkService(Service):
    def on_create(self, docs):
        for doc in docs:
            self._validate(doc)

    def create(self, docs):
        ids = []
        production = get_resource_service('archive')
        assignments_service = get_resource_service('assignments')
        updated_items = []
        actioned_item = {}
        published_updated_items = []

        for doc in docs:
            # Boolean set to true if the unlink is as the result of spiking the content item
            spike = doc.pop('spike', False)
            assignment = assignments_service.find_one(req=None, _id=doc.pop('assignment_id'))
            assignments_service.validate_assignment_action(assignment)
            actioned_item_id = doc.pop('item_id')
            actioned_item = production.find_one(req=None, _id=actioned_item_id)
            updates = {'assigned_to': deepcopy(assignment.get('assigned_to'))}

            related_items = get_related_items(actioned_item, assignment)
            for item in related_items:
                # For all items, update news item for unlinking
                update_assignment_on_link_unlink(None, item, published_updated_items)
                ids.append(item[config.ID_FIELD])
                updated_items.append(item)

            # Update assignment if no other archive item is linked to it
            doc.update(actioned_item)
            archive_items = assignments_service.get_archive_items_for_assignment(assignment)
            other_linked_items = [a for a in archive_items if
                                  str(a.get(config.ID_FIELD)) != str(actioned_item[config.ID_FIELD])]
            if len(other_linked_items) <= 0:
                updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
                assignments_service.patch(assignment.get(config.ID_FIELD), updates)

            # Delete delivery records associated with all the items unlinked
            item_ids = [i.get(config.ID_FIELD) for i in related_items]
            get_resource_service('delivery').delete_action(lookup={'item_id': {'$in': item_ids}})

            # publishing planning item
            assignments_service.publish_planning(assignment['planning_item'])

            user = get_user()
            PlanningNotifications().notify_assignment(target_desk=actioned_item.get('task').get('desk'),
                                                      message='assignment_spiked_unlinked_msg',
                                                      actioning_user=user.get('display_name',
                                                                              user.get('username', 'Unknown')),
                                                      action='unlinked' if not spike else 'spiked',
                                                      coverage_type=get_coverage_type_name(
                                                          actioned_item.get('type', '')),
                                                      slugline=actioned_item.get('slugline'),
                                                      omit_user=True,
                                                      assignment_id=assignment[config.ID_FIELD],
                                                      is_link=True)

            push_content_notification(updated_items)
            push_notification(
                'content:unlink',
                item=str(actioned_item_id),
                assignment=str(assignment[config.ID_FIELD])
            )

            # Update assignment history with all items affected
            updates['item_ids'] = ids
            assignment_history_service = get_resource_service('assignments_history')
            if spike:
                get_resource_service('assignments_history')\
                    .on_item_content_unlink(updates, assignment, ASSIGNMENT_HISTORY_ACTIONS.SPIKE_UNLINK)
            else:
                assignment_history_service.on_item_content_unlink(updates, assignment)

        return ids

    def _validate(self, doc):
        assignments_service = get_resource_service('assignments')
        assignment = assignments_service.find_one(
            req=None,
            _id=doc.get('assignment_id')
        )

        user = get_user(required=True)
        user_id = user.get(config.ID_FIELD)

        session = get_auth()
        session_id = session.get(config.ID_FIELD)

        if not assignment:
            raise SuperdeskApiError.badRequestError('Assignment not found.')

        if not assignments_service.is_text_assignment(assignment):
            raise SuperdeskApiError.badRequestError('Cannot unlink media assignments.')

        if assignment.get(LOCK_USER):
            if str(assignment.get(LOCK_USER)) != str(user_id):
                raise SuperdeskApiError.forbiddenError(
                    'Assignment is locked by another user. Cannot unlink assignment and content.'
                )

            if str(assignment.get(LOCK_SESSION)) != str(session_id):
                raise SuperdeskApiError.forbiddenError(
                    'Assignment is locked by you in another session. Cannot unlink assignment and content.'
                )

        item = get_resource_service('archive').find_one(
            req=None,
            _id=doc.get('item_id')
        )

        if not item:
            raise SuperdeskApiError.badRequestError('Content item not found.')

        # If the item is locked, then check to see if it is locked by the
        # current user in their current session
        if item.get(LOCK_USER):
            if str(item.get(LOCK_USER)) != str(user_id):
                raise SuperdeskApiError.forbiddenError(
                    'Item is locked by another user. Cannot unlink assignment and content.'
                )

            if str(item.get(LOCK_SESSION)) != str(session_id):
                raise SuperdeskApiError.forbiddenError(
                    'Item is locked by you in another session. Cannot unlink assignment and content.'
                )

        if not item.get('assignment_id'):
            raise SuperdeskApiError.badRequestError(
                'Content not linked to an assignment. Cannot unlink assignment and content.'
            )

        if str(item.get('assignment_id')) != str(assignment.get(config.ID_FIELD)):
            raise SuperdeskApiError.badRequestError(
                'Assignment and Content are not linked.'
            )

        deliveries = get_resource_service('delivery').get(req=None, lookup={
            'assignment_id': assignment.get(config.ID_FIELD)})
        delivery = [d for d in deliveries if d.get('item_id') == doc.get('item_id')]
        if len(delivery) <= 0:
            raise SuperdeskApiError.badRequestError(
                'Content doesnt exist for the assignment. Cannot unlink assignment and content.'
            )

    def on_spike_item(self, updates, original):
        """Called by the on_updated event of archive_spike endpoint"""
        assignment_id = original.get('assignment_id', updates.get('assignment_id'))
        if assignment_id:
            self.create([{
                'assignment_id': assignment_id,
                'item_id': original.get(config.ID_FIELD),
                'spike': True
            }])


class AssignmentsUnlinkResource(Resource):
    endpoint_name = resource_title = 'assignments_unlink'
    url = 'assignments/unlink'
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
