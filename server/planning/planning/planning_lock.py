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
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from planning.item_lock import LockService
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from planning.common import update_returned_document
from planning.planning.planning import planning_schema
from copy import deepcopy
from eve.utils import config

CUSTOM_HATEOAS_PLANNING = {'self': {'title': 'Planning', 'href': '/planning/{_id}'}}


class PlanningLockResource(Resource):
    endpoint_name = 'planning_lock'
    url = 'planning/<{0}:item_id>/lock'.format(item_url)
    schema = deepcopy(planning_schema)
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}


class PlanningLockService(BaseService):

    def create(self, docs, **kwargs):
        item_id = request.view_args['item_id']
        lock_action = docs[0].get('lock_action', 'edit')
        return self.lock_item(item_id, lock_action, docs[0])

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS_PLANNING,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )

    def lock_item(self, item_id, action, doc):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_action = action
        lock_service = get_component(LockService)
        item = get_resource_service('planning').find_one(req=None, _id=item_id)

        if item and item.get('event_item'):
            lock_service.validate_relationship_locks(item, 'planning')

        updated_item = lock_service.lock(item, user_id, session_id, lock_action, 'planning')
        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_PLANNING)


class PlanningUnlockResource(Resource):
    endpoint_name = 'planning_unlock'
    url = 'planning/<{0}:item_id>/unlock'.format(item_url)
    schema = deepcopy(planning_schema)
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class PlanningUnlockService(BaseService):

    def create(self, docs, **kwargs):
        item_id = request.view_args['item_id']
        return self.unlock_item(item_id, docs[0])

    def on_created(self, docs):
        build_custom_hateoas(
            CUSTOM_HATEOAS_PLANNING,
            docs[0],
            _id=str(docs[0][config.ID_FIELD])
        )

    def unlock_item(self, item_id, doc):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        lock_service = get_component(LockService)
        resource_service = get_resource_service('planning')
        item = resource_service.find_one(req=None, _id=item_id)
        updated_item = lock_service.unlock(item, user_id, session_id, 'planning')
        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_PLANNING)
