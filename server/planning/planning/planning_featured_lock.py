# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML, metadata_schema
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow
from superdesk.resource import Resource
from apps.archive.common import get_user, get_auth
from superdesk.services import BaseService
from superdesk.lock import lock, unlock
from planning.item_lock import LOCK_USER, LOCK_SESSION, LOCK_TIME
from superdesk.notification import push_notification
from superdesk import get_resource_service

LOCK_ID = "item_lock_planning_featured"


class PlanningFeaturedLockResource(Resource):
    endpoint_name = 'planning_featured_lock'
    url = 'planning_featured_lock'
    datasource = {
        'source': 'planning_featured_lock',
        'search_backend': 'elastic'
    }
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    resource_title = endpoint_name
    privileges = {'POST': 'planning',
                  'DELETE': 'planning'}
    schema = {
        'lock_user': metadata_schema['lock_user'],
        'lock_time': metadata_schema['lock_time'],
        'lock_session': metadata_schema['lock_session']
    }


class PlanningFeaturedLockService(BaseService):

    def on_create(self, docs, **kwargs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']

        existing_locks = list(self.find(where={}))
        for existing_lock in existing_locks:
            if str(existing_lock.get(LOCK_USER)) != str(user_id):
                raise SuperdeskApiError.forbiddenError(
                    message="Featured stories already being managed by another user.")
            elif str(existing_lock.get(LOCK_SESSION)) != str(session_id):
                raise SuperdeskApiError.forbiddenError(
                    message="Featured stories already being managed by you in another session.")

        # get the lock if not raise forbidden exception
        if not lock(LOCK_ID, expire=5):
            raise SuperdeskApiError.forbiddenError(message="Unable to obtain lock on Featured stories.")

        for doc in docs:
            doc['_id'] = generate_guid(type=GUID_NEWSML)
            lock_updates = {LOCK_USER: user_id, LOCK_SESSION: session_id, LOCK_TIME: utcnow()}
            doc.update(lock_updates)

        return docs

    def on_created(self, docs):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        unlock(LOCK_ID, remove=True)
        push_notification('planning_featured_lock:lock', user=str(user_id), lock_session=str(session_id))

    def on_deleted(self, doc):
        user_id = get_user(required=True)['_id']
        session_id = get_auth()['_id']
        push_notification('planning_featured_lock:unlock', user=str(user_id), lock_session=str(session_id))


class PlanningFeaturedUnlockResource(Resource):
    endpoint_name = 'planning_featured_unlock'
    url = 'planning_featured_unlock'
    resource_methods = ['GET', 'POST']
    resource_title = endpoint_name
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'DELETE': 'planning'}


class PlanningFeaturedUnlockService(BaseService):

    def create(self, docs, **kwargs):
        get_resource_service('planning_featured_lock').delete_action(lookup={})
        return [{'_id': 'feature_unlocked'}]
