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
from .item_lock import LockService

CUSTOM_HATEOAS = {'self': {'title': 'Planning', 'href': '/planning/{_id}'}}


def _update_returned_document(doc, item):
    doc.clear()
    doc.update(item)
    build_custom_hateoas(CUSTOM_HATEOAS, doc)
    return [doc['_id']]


class PlanningLockResource(Resource):
    endpoint_name = 'planning_lock'
    url = 'planning/<{0}:item_id>/lock'.format(item_url)
    schema = {'lock_action': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    privileges = {'POST': 'planning_planning_management'}


class PlanningLockService(BaseService):

    def create(self, docs, **kwargs):
        user = get_user(required=True)
        auth = get_auth()
        item_id = request.view_args['item_id']
        lock_action = docs[0].get('lock_action', 'edit')
        lock_service = LockService()
        item = lock_service.lock(item_id, user['_id'], auth['_id'], lock_action, 'planning')
        return _update_returned_document(docs[0], item)


class PlanningUnlockResource(Resource):
    endpoint_name = 'planning_unlock'
    url = 'planning/<{0}:item_id>/unlock'.format(item_url)
    schema = {'lock_user': {'type': 'string'}}
    datasource = {'source': 'planning'}
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name


class PlanningUnlockService(BaseService):

    def create(self, docs, **kwargs):
        user = get_user(required=True)
        auth = get_auth()
        item_id = request.view_args['item_id']
        lock_service = LockService()
        item = lock_service.unlock(item_id, user['_id'], auth['_id'], 'planning')
        return _update_returned_document(docs[0], item)
