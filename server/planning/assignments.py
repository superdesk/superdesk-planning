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
from superdesk.metadata.item import metadata_schema, ITEM_STATE
from superdesk.resource import not_analyzed
from superdesk.notification import push_notification
from apps.archive.common import get_user
from eve.utils import config
from superdesk.utc import utcnow
from superdesk.activity import add_activity, ACTIVITY_UPDATE
from .planning import coverage_schema
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
        if user and user.get(config.ID_FIELD):
            assigned_to['assigned_by'] = user.get(config.ID_FIELD)
            assigned_to['assigned_date'] = utcnow()

        if not original.get(config.ID_FIELD):
            updates['original_creator'] = str(user.get(config.ID_FIELD)) if user else None
            updates['assigned_to'][ITEM_STATE] = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
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

    'assigned_to': {
        'type': 'dict',
        'schema': {
            'desk': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'user': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'assigned_by': {'type': 'string', 'mapping': not_analyzed},
            'assigned_date': {'type': 'datetime'},
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
