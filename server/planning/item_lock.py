# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import superdesk

from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.users.services import current_user_has_privilege
from superdesk.utc import utcnow
from superdesk.lock import lock, unlock
from eve.utils import config
from superdesk import get_resource_service, get_resource_privileges
from flask import current_app as app


LOCK_USER = 'lock_user'
LOCK_SESSION = 'lock_session'
logger = logging.getLogger(__name__)


class LockService:
    def __init__(self):
        self.app = app
        self.app.on_session_end += self.on_session_end

    def lock(self, item, user_id, session_id, action, resource, lock_id_field=None):
        if not item:
            raise SuperdeskApiError.notFoundError()

        item_service = get_resource_service(resource)
        item_id = item.get(config.ID_FIELD)

        # lock_id will have a specific value (recurrence_id) for recurring events
        if not lock_id_field:
            lock_id_field = config.ID_FIELD

        # set the lock_id it per item
        lock_id = "item_lock {}".format(item.get(lock_id_field))

        # get the lock it not raise forbidden exception
        if not lock(lock_id, expire=5):
            raise SuperdeskApiError.forbiddenError(message="Item is locked by another user.")

        try:
            can_user_lock, error_message = self.can_lock(item, user_id, session_id, resource)

            if can_user_lock:
                # following line executes handlers attached to function:
                # on_lock_'resource' - ex. on_lock_planning, on_lock_event
                getattr(self.app, 'on_lock_%s' % resource)(item, user_id)

                updates = {LOCK_USER: user_id, LOCK_SESSION: session_id, 'lock_time': utcnow()}
                if action:
                    updates['lock_action'] = action

                item_service.update(item.get(config.ID_FIELD), updates, item)

                push_notification(resource + ':lock',
                                  item=str(item.get(config.ID_FIELD)),
                                  user=str(user_id), lock_time=updates['lock_time'],
                                  lock_session=str(session_id),
                                  etag=updates['_etag'])
            else:
                raise SuperdeskApiError.forbiddenError(message=error_message)

            item = item_service.find_one(req=None, _id=item_id)

            # following line executes handlers attached to function:
            # on_locked_'resource' - ex. on_locked_planning, on_locked_event
            getattr(self.app, 'on_locked_%s' % resource)(item, user_id)
            return item
        finally:
            # unlock the lock :)
            unlock(lock_id, remove=True)

    def unlock(self, item, user_id, session_id, resource):
        if not item:
            raise SuperdeskApiError.notFoundError()

        item_service = get_resource_service(resource)
        item_id = item.get(config.ID_FIELD)

        if not item.get(LOCK_USER):
            raise SuperdeskApiError.badRequestError(message="Item is not locked.")

        can_user_unlock, error_message = self.can_unlock(item, user_id, resource)

        if can_user_unlock:
            # following line executes handlers attached to function:
            # on_unlock_'resource' - ex. on_unlock_planning, on_unlock_event
            getattr(self.app, 'on_unlock_%s' % resource)(item, user_id)
            updates = {LOCK_USER: None, LOCK_SESSION: None, 'lock_time': None,
                       'lock_action': None}

            item_service.update(item.get(config.ID_FIELD), updates, item)

            # following line executes handlers attached to function:
            # on_unlocked_'resource' - ex. on_unlocked_planning, on_unlocked_event
            getattr(self.app, 'on_unlocked_%s' % resource)(item, user_id)

            push_notification(resource + ':unlock',
                              item=str(item.get(config.ID_FIELD)),
                              user=str(user_id), lock_session=str(session_id),
                              etag=updates['_etag'])
        else:
            raise SuperdeskApiError.forbiddenError(message=error_message)

        item = item_service.find_one(req=None, _id=item_id)
        return item

    def unlock_session(self, user_id, session_id):
        self.unlock_session_for_resource(user_id, session_id, 'planning')

    def unlock_session_for_resource(self, user_id, session_id, resource):
        item_service = get_resource_service(resource)
        items = item_service.find(where={'lock_session': session_id})

        for item in items:
            self.unlock(item.get(config.ID_FIELD), user_id, session_id, resource)

    def can_lock(self, item, user_id, session_id, resource):
        """
        Function checks whether user can lock the item or not. If not then raises exception.
        """
        can_user_edit, error_message = superdesk.get_resource_service(resource).can_edit(item, user_id)

        if can_user_edit:
            if item.get(LOCK_USER):
                if str(item.get(LOCK_USER, '')) == str(user_id) and str(item.get(LOCK_SESSION)) != str(session_id):
                    return False, 'Item is locked by you in another session.'
                else:
                    if str(item.get(LOCK_USER, '')) != str(user_id):
                        return False, 'Item is locked by another user.'
        else:
            return False, error_message

        return True, ''

    def can_unlock(self, item, user_id, resource):
        """
        Function checks whether user can unlock the item or not.
        """
        can_user_edit, error_message = superdesk.get_resource_service(resource).can_edit(item, user_id)

        if can_user_edit:
            resource_privileges = get_resource_privileges(resource).get('PATCH')

            if not (str(item.get(LOCK_USER, '')) == str(user_id) or
                    (current_user_has_privilege(resource_privileges) and
                    current_user_has_privilege('planning_unlock'))):
                return False, 'You don\'t have permissions to unlock an item.'
        else:
            return False, error_message

        return True, ''

    def on_session_end(self, user_id, session_id):
        self.unlock_session(user_id, session_id)
