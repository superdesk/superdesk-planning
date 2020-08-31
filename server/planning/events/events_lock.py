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
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from planning.item_lock import LockService
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from planning.common import update_returned_document
from planning.events.events_schema import events_schema
from copy import deepcopy
from eve.utils import config


CUSTOM_HATEOAS_EVENTS = {'self': {'title': 'Events', 'href': '/events/{_id}'}}
logger = logging.getLogger(__name__)


class EventsLockResource(Resource):
    endpoint_name = 'events_lock'
    url = 'events/<{0}:item_id>/lock'.format(item_url)
    schema = deepcopy(events_schema)
    datasource = {'source': 'events'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {'POST': 'planning_event_management'}


class EventsLockService(BaseService):

    def create(self, docs, **kwargs):
        item_id = request.view_args['item_id']
        lock_action = docs[0].get('lock_action', 'edit')
        return self.lock_item(item_id, lock_action, docs[0])

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS_EVENTS,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )

    def lock_item(self, item_id, action, doc):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_action = action
        lock_service = get_component(LockService)
        item = get_resource_service('events').find_one(req=None, _id=item_id)

        lock_service.validate_relationship_locks(item, 'events')
        updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'events')

        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_EVENTS)


class EventsUnlockResource(Resource):
    endpoint_name = 'events_unlock'
    url = 'events/<{0}:item_id>/unlock'.format(item_url)
    schema = deepcopy(events_schema)
    datasource = {'source': 'events'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class EventsUnlockService(BaseService):

    def create(self, docs, **kwargs):
        item_id = request.view_args['item_id']
        return self.unlock_item(item_id, docs[0])

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS_EVENTS,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )

    def unlock_item(self, item_id, doc):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_service = get_component(LockService)
        resource_service = get_resource_service('events')
        item = resource_service.find_one(req=None, _id=item_id)
        updated_item = lock_service.unlock(item, user_id, session_id, 'events')
        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_EVENTS)
