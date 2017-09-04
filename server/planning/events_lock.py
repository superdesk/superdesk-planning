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
logger = logging.getLogger(__name__)


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
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']

        lock_action = docs[0].get('lock_action', 'edit')
        lock_service = LockService()

        item_id = request.view_args['item_id']
        resource_service = get_resource_service('events')
        item = resource_service.find_one(req=None, _id=item_id)

        self._validate(resource_service, item)
        if item.get('recurrence_id'):
            updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'events', 'recurrence_id')
        else:
            updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'events')

        return _update_returned_document(docs[0], updated_item)

    def _validate(self, resource_service, item):
        if not item:
            raise SuperdeskApiError.notFoundError()

        # If the event is a recurrent event, ensure no event in that series is already locked
        if item.get('recurrence_id') and not item.get(LOCK_USER):
            historic, past, future = resource_service.get_recurring_timeline(item)
            series = historic + past + future

            for event in series:
                if event.get(LOCK_USER):
                    raise SuperdeskApiError.forbiddenError(
                        message="An event in this recurring series is already locked.")


class EventsUnlockResource(Resource):
    endpoint_name = 'events_unlock'
    url = 'events/<{0}:item_id>/unlock'.format(item_url)
    schema = {'lock_user': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class EventsUnlockService(BaseService):

    def create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_service = LockService()

        # If the event is a recurrent event, unlock all other events in this series
        item_id = request.view_args['item_id']
        resource_service = get_resource_service('events')
        item = resource_service.find_one(req=None, _id=item_id)
        if item.get('recurrence_id') and not item.get(LOCK_USER):
            # Find the actual event that is locked
            historic, past, future = resource_service.get_recurring_timeline(item)
            series = historic + past + future

            for event in series:
                if event.get(LOCK_USER):
                    updated_item = lock_service.unlock(event, user_id, session_id, 'events')
                    break
        else:
            updated_item = lock_service.unlock(item, user_id, session_id, 'events')

        if updated_item is None:
            # version 1 item must have been deleted by now
            return [0]

        return _update_returned_document(docs[0], updated_item)
