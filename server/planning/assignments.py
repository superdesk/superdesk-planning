# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Assignments"""

import superdesk
import logging
from copy import deepcopy
from bson import ObjectId
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import item_url
from superdesk.metadata.item import metadata_schema, ITEM_STATE, CONTENT_STATE
from superdesk.resource import not_analyzed
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from apps.duplication.archive_move import ITEM_MOVE
from apps.publish.enqueue import ITEM_PUBLISH
from eve.utils import config
from superdesk.utc import utcnow
from superdesk.activity import add_activity, ACTIVITY_UPDATE
from .planning import coverage_schema
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from .item_lock import LockService, LOCK_USER
from superdesk.users.services import current_user_has_privilege
from .common import ASSIGNMENT_WORKFLOW_STATE, assignment_workflow_state


logger = logging.getLogger(__name__)
planning_type = deepcopy(superdesk.Resource.rel('planning', type='string'))
planning_type['mapping'] = not_analyzed


class AssignmentsService(superdesk.Service):
    """Service class for the Assignments model."""

    def on_create(self, docs):
        for doc in docs:
            self.set_assignment(doc)

    def on_created(self, docs):
        for doc in docs:
            self.notify('assignments:created', doc, {})

            if doc['assigned_to'].get('state') != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                self.send_assignment_notification(doc, {})

    def set_assignment(self, updates, original=None):
        """Set the assignment information"""
        if not original:
            original = {}

        if not updates.get('assigned_to'):
            updates['assigned_to'] = {}

        assigned_to = updates.get('assigned_to')
        if assigned_to.get('user') and not assigned_to.get('desk'):
            raise SuperdeskApiError.badRequestError(message="Assignment should have a desk.")

        # set the assignment information
        user = get_user()
        if original.get('assigned_to', {}).get('desk') != assigned_to.get('desk'):
            if original.get('assigned_to', {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
                raise SuperdeskApiError.forbiddenError(
                    message="Assignment in progress. Desk reassignment not allowed.")

            assigned_to['assigned_date_desk'] = utcnow()

            if user and user.get(config.ID_FIELD):
                assigned_to['assignor_desk'] = user.get(config.ID_FIELD)

        if assigned_to.get('user') and original.get('assigned_to', {}).get('user') != assigned_to.get('user'):
            assigned_to['assigned_date_user'] = utcnow()

            if user and user.get(config.ID_FIELD):
                assigned_to['assignor_user'] = user.get(config.ID_FIELD)

        if not original.get(config.ID_FIELD):
            updates['original_creator'] = str(user.get(config.ID_FIELD)) if user else None
            updates['assigned_to'][ITEM_STATE] = updates['assigned_to'].get(ITEM_STATE) or \
                ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
        else:
            # In case user was removed
            if not assigned_to.get('user'):
                assigned_to['user'] = None
            updates['version_creator'] = str(user.get(config.ID_FIELD)) if user else None

    def on_update(self, updates, original):
        self.set_assignment(updates, original)

    def notify(self, event_name, updates, original):
        doc = deepcopy(original)
        doc.update(updates)
        kwargs = {
            'item': doc.get(config.ID_FIELD),
            'coverage': doc.get('coverage_item'),
            'planning': doc.get('planning_item'),
            'assigned_user': (doc.get('assigned_to') or {}).get('user'),
            'assigned_desk': (doc.get('assigned_to') or {}).get('desk'),
            'user': doc.get('version_creator', doc.get('original_creator')),
            'original_assigned_desk': (original.get('assigned_to') or {}).get('desk'),
            'original_assigned_user': (original.get('assigned_to') or {}).get('user')
        }
        push_notification(event_name, **kwargs)

    def on_updated(self, updates, original):
        self.notify('assignments:updated', updates, original)
        self.send_assignment_notification(updates, original)

    def system_update(self, id, updates, original):
        super().system_update(id, updates, original)
        self.notify('assignments:updated', updates, original)

    def is_assignment_modified(self, updates, original):
        """Checks whether the assignment is modified or not"""
        updates_assigned_to = updates.get('assigned_to') or {}
        original_assigned_to = original.get('assigned_to') or {}
        return updates_assigned_to.get('desk') != original_assigned_to.get('desk') or \
            updates_assigned_to.get('user') != original_assigned_to.get('user')

    def send_assignment_notification(self, updates, original=None):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        if not original:
            original = {}

        if not self.is_assignment_modified(updates, original):
            return

        assigned_to = updates.get('assigned_to')
        user = get_user()
        if assigned_to.get('user'):
            # Done to avoid fetching users data for every assignment
            # Because user assigned can also be a provider whose qcode
            # might be an invalid GUID, check if the user assigned is a valid user (GUID)
            # However, in a rare case where qcode of a provider is a valid GUID,
            # This will create activity records - inappropriate
            if ObjectId.is_valid(assigned_to.get('user')):
                add_activity(ACTIVITY_UPDATE,
                             '{{assignor}} assigned a coverage to {{assignee}}',
                             self.datasource,
                             notify=[assigned_to.get('user')],
                             assignor=user.get('username')
                             if str(user.get(config.ID_FIELD, None)) != assigned_to.get('user') else 'You',
                             assignee='you'
                             if str(user.get(config.ID_FIELD, None)) != assigned_to.get('user') else 'yourself')

    def send_assignment_cancellation_notification(self, assignment):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        if not assignment:
            return

        user = get_user()
        assigned_to = assignment.get('assigned_to')
        slugline = assignment.get('planning').get('slugline')

        if assigned_to.get('desk'):
            desk = get_resource_service('desks').find_one(req=None, _id=assigned_to.get('desk'))
            notify_users = [str(member['user']) for member in desk.get('members', [])]

        if assigned_to.get('user'):
            # Done to avoid fetching users data for every assignment
            # Because user assigned can also be a provider whose qcode
            # might be an invalid GUID, check if the user assigned is a valid user (GUID)
            # However, in a rare case where qcode of a provider is a valid GUID,
            # This will create activity records - inappropriate
            if ObjectId.is_valid(assigned_to.get('user')):
                notify_users = [assigned_to.get('user')]

        add_activity(ACTIVITY_UPDATE,
                     'Assignment {{slugline}} for desk {{desk}} has been cancelled by {{user}}',
                     self.datasource,
                     notify=notify_users,
                     user=user.get('username')
                     if str(user.get(config.ID_FIELD, None)) != assigned_to.get('user') else 'You',
                     slugline=slugline,
                     desk=desk.get('name'))

    def cancel_assignment(self, original_assignment, coverage):
        coverage_to_copy = deepcopy(coverage)
        if original_assignment:
            updated_assignment = {'assigned_to': {}}
            updated_assignment.get('assigned_to').update(original_assignment.get('assigned_to'))
            updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.cancelled
            updated_assignment['planning'] = coverage_to_copy.get('planning')
            updated_assignment['planning']['news_coverage_status'] = coverage_to_copy.get('news_coverage_status')

            self.system_update(ObjectId(original_assignment.get('_id')), updated_assignment, original_assignment)
            self.send_assignment_cancellation_notification(original_assignment)

    def _get_empty_updates_for_assignment(self, assignment):
        updated_assignment = {'assigned_to': {}}
        updated_assignment.get('assigned_to').update(assignment.get('assigned_to'))
        return updated_assignment

    def _set_user_for_assignment(self, assignment, assignee, assignor=None):
        updates = self._get_empty_updates_for_assignment(assignment)
        updates['assigned_to']['user'] = assignee

        if assignor:
            updates['assigned_to']['assignor_user'] = assignor

        return updates

    def _get_assignment_data_on_archive_update(self, updates, original):
        assignment_id = original.get('assignment_id')
        item_user_id = updates.get('version_creator')
        item_desk_id = updates.get('task', {}).get('desk')
        assignment = None
        if assignment_id:
            assignment = self.find_one(req=None, _id=assignment_id)

        return {
            'assignment_id': assignment_id,
            'item_user_id': str(item_user_id),
            'item_desk_id': str(item_desk_id),
            'assignment': assignment
        }

    def update_assignment_on_archive_update(self, updates, original):
        if not original.get('assignment_id'):
            return

        assignment_update_data =\
            self._get_assignment_data_on_archive_update(updates, original)

        if assignment_update_data.get('assignment') and \
            assignment_update_data['assignment'].get('assigned_to')['user'] != \
                assignment_update_data.get('item_user_id'):
            # re-assign the user to the lock user
            updated_assignment = self._set_user_for_assignment(assignment_update_data.get('assignment'),
                                                               assignment_update_data.get('item_user_id'))
            self._update_assignment_and_notify(updated_assignment, assignment_update_data.get('assignment'))

    def update_assignment_on_archive_operation(self, updates, original, operation=None):
        if operation == ITEM_MOVE:
            assignment_update_data = \
                self._get_assignment_data_on_archive_update(updates, original)

            if assignment_update_data.get('assignment') and \
                assignment_update_data['assignment'].get('assigned_to')['desk'] != \
                    assignment_update_data.get('item_desk_id'):
                updated_assignment = self._set_user_for_assignment(assignment_update_data['assignment'], None,
                                                                   assignment_update_data.get('item_user_id'))
                updated_assignment.get('assigned_to')['desk'] = assignment_update_data.get('item_desk_id')
                updated_assignment.get('assigned_to')['assignor_user'] = assignment_update_data.get('item_user_id')
                updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.SUBMITTED

                self._update_assignment_and_notify(updated_assignment, assignment_update_data['assignment'])
        elif operation == ITEM_PUBLISH:
            assignment_update_data = \
                self._get_assignment_data_on_archive_update(updates, original)

            if assignment_update_data.get('assignment'):
                updated_assignment = self._get_empty_updates_for_assignment(assignment_update_data['assignment'])
                if updates.get(ITEM_STATE, original.get(ITEM_STATE, '')) != CONTENT_STATE.SCHEDULED:
                    updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED

                self._update_assignment_and_notify(updated_assignment, assignment_update_data['assignment'])

    def _update_assignment_and_notify(self, updates, original):
        self.system_update(original.get(config.ID_FIELD),
                           updates, original)

        # send notification
        self.notify('assignments:updated', updates, original)

    def validate_assignment_unlock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            assignment = assignment_update_data.get('assignment')
            if assignment and assignment.get('lock_user'):
                if assignment['lock_session'] != get_auth()['_id'] or assignment['lock_user'] != user_id:
                    raise SuperdeskApiError.badRequestError(message="Related assignment is locked.")

    def sync_assignment_lock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            assignment = assignment_update_data.get('assignment')
            lock_service = get_component(LockService)
            lock_service.lock(assignment, user_id, get_auth()['_id'], 'content_edit', 'assignments')

    def sync_assignment_unlock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            assignment = assignment_update_data.get('assignment')
            if assignment.get(LOCK_USER):
                lock_service = get_component(LockService)
                lock_service.unlock(assignment, user_id, get_auth()['_id'], 'assignments')

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege('planning_planning_management'):
            return False, 'User does not have sufficient permissions.'
        return True, ''


assignments_schema = {
    # Audit Information
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # Assignment details
    'coverage_item': {
        'type': 'string',
        'mapping': not_analyzed
    },
    'planning_item': planning_type,
    'lock_user': metadata_schema['lock_user'],
    'lock_time': metadata_schema['lock_time'],
    'lock_session': metadata_schema['lock_session'],
    'lock_action': metadata_schema['lock_action'],

    'assigned_to': {
        'type': 'dict',
        'schema': {
            'desk': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'user': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'assignor_desk': {'type': 'string', 'mapping': not_analyzed},
            'assignor_user': {'type': 'string', 'mapping': not_analyzed},
            'assigned_date_desk': {'type': 'datetime'},
            'assigned_date_user': {'type': 'datetime'},
            'state': {'type': 'string', 'mapping': not_analyzed, 'allowed': assignment_workflow_state},
            'coverage_provider': {
                'type': 'dict',
                'nullable': True,
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'}
                },
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed
                    }
                }
            }
        }
    },

    # coverage details
    'planning': coverage_schema['planning']
}


class AssignmentsResource(superdesk.Resource):
    url = 'assignments'
    item_url = item_url
    schema = assignments_schema
    resource_methods = ['GET']
    item_methods = ['GET', 'PATCH', 'DELETE']
    privileges = {'PATCH': 'planning',
                  'DELETE': 'planning'}

    mongo_indexes = {
        'coverage_item_1': ([('coverage_item', 1)], {'background': True}),
        'planning_item_1': ([('planning_item', 1)], {'background': True})
    }

    datasource = {
        'source': 'assignments',
        'search_backend': 'elastic'
    }

    etag_ignore_fields = ['planning']
