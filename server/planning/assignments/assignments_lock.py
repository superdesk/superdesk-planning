# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import request
import logging

from eve.utils import config
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from planning.item_lock import LockService
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from apps.common.components.utils import get_component
from planning.common import ASSIGNMENT_WORKFLOW_STATE
from planning.assignments.assignments import assignments_schema

from copy import deepcopy


CUSTOM_HATEOAS = {'self': {'title': 'Assignments', 'href': '/assignments/{_id}'}}
logger = logging.getLogger(__name__)


def _update_returned_document(doc, item):
    doc.clear()
    doc.update(item)
    return [doc[config.ID_FIELD]]


class AssignmentsLockResource(Resource):
    endpoint_name = 'assignments_lock'
    url = 'assignments/<{0}:item_id>/lock'.format(item_url)
    schema = deepcopy(assignments_schema)
    datasource = {'source': 'assignments'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {
        'POST': 'archive',
        'GET': 'archive'
    }


class AssignmentsLockService(BaseService):

    def create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']

        lock_action = docs[0].get('lock_action', 'edit')
        lock_service = get_component(LockService)

        item_id = request.view_args['item_id']
        item = get_resource_service('assignments').find_one(req=None, _id=item_id)

        self.validate(item, user_id)
        updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'assignments')

        return _update_returned_document(docs[0], updated_item)

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )

    def validate(self, item, user_id):
        get_resource_service('assignments').validate_assignment_action(item)
        # Validate workflow state
        if item.get('assigned_to').get('state') not in [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                                                        ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
                                                        ASSIGNMENT_WORKFLOW_STATE.ASSIGNED,
                                                        ASSIGNMENT_WORKFLOW_STATE.COMPLETED]:
            raise SuperdeskApiError.badRequestError(message="Assignment workflow state error.")

        if item.get('assigned_to').get('state') == ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
            archive_item = get_resource_service('archive').find_one(req=None, assignment_id=item.get(config.ID_FIELD))
            if archive_item and archive_item.get('lock_user') and archive_item['lock_user'] != user_id:
                # archive item it locked by another user
                raise SuperdeskApiError.badRequestError(message="Archive item is locked by another user.")


class AssignmentsUnlockResource(Resource):
    endpoint_name = 'assignments_unlock'
    url = 'assignments/<{0}:item_id>/unlock'.format(item_url)
    schema = deepcopy(assignments_schema)
    datasource = {'source': 'assignments'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class AssignmentsUnlockService(BaseService):

    def create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_service = get_component(LockService)

        # If the event is a recurrent event, unlock all other events in this series
        item_id = request.view_args['item_id']
        resource_service = get_resource_service('assignments')
        item = resource_service.find_one(req=None, _id=item_id)

        if not self.is_assignment_locked_by_user(item, user_id):
            updated_item = lock_service.unlock(item, user_id, session_id, 'assignments')
            return _update_returned_document(docs[0], updated_item)

        return _update_returned_document(docs[0], item)

    def is_assignment_locked_by_user(self, item, user_id):
        if item.get('assigned_to').get('state') == ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
            archive_item = get_resource_service('archive').find_one(req=None, assignment_id=item.get(config.ID_FIELD))
            if archive_item and archive_item.get('lock_user') and archive_item['lock_user'] == user_id:
                return True

        return False

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )
