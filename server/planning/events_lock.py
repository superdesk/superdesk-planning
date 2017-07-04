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
from superdesk.errors import SuperdeskApiError
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from .item_lock import LockService
from superdesk import get_resource_service

CUSTOM_HATEOAS = {'self': {'title': 'Events', 'href': '/events/{_id}'}}
LOCK_USER = 'lock_user'
LOCK_SESSION = 'lock_session'


def _update_returned_document(doc, item):
    doc.clear()
    doc.update(item)
    build_custom_hateoas(CUSTOM_HATEOAS, doc)
    return [doc['_id']]


class EventsLockResource(Resource):
    endpoint_name = 'events_lock'
    url = 'events/<{0}:item_id>/lock'.format(item_url)
    schema = {'lock_action': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {'POST': 'planning_event_management'}


class EventsLockService(BaseService):

    def create(self, docs, **kwargs):
        user = get_user(required=True)
        auth = get_auth()
        item_id = request.view_args['item_id']
        lock_action = docs[0].get('lock_action', 'edit')
        self._validate(item_id, user, auth['_id'])
        lock_service = LockService()
        item = lock_service.lock(item_id, user['_id'], auth['_id'], lock_action, 'events')
        return _update_returned_document(docs[0], item)

    def _validate(self, item_id, user_id, session_id):
        # Check to see if we have any related planning items for that event which is locked
        planning_service = get_resource_service('planning')

        for planning in list(planning_service.find(where={'event_item': item_id})):
            if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
                # A related planning item is locked - throw an error
                raise SuperdeskApiError.forbiddenError(message="One or more related planning items "
                                                               "are locked. Cannot lock the event.")


class EventsUnlockResource(Resource):
    endpoint_name = 'events_unlock'
    url = 'events/<{0}:item_id>/unlock'.format(item_url)
    schema = {'lock_user': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class EventsUnlockService(BaseService):

    def create(self, docs, **kwargs):
        user = get_user(required=True)
        auth = get_auth()
        item_id = request.view_args['item_id']
        lock_service = LockService()
        item = lock_service.unlock(item_id, user['_id'], auth['_id'], 'events')

        if item is None:
            # version 1 item must have been deleted by now
            return [0]

        return _update_returned_document(docs[0], item)
