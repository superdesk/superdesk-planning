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
from apps.common.components.base_component import BaseComponent


LOCK_USER = 'lock_user'
LOCK_SESSION = 'lock_session'
LOCK_ACTION = 'lock_action'
LOCK_TIME = 'lock_time'
logger = logging.getLogger(__name__)


class LockService(BaseComponent):
    def __init__(self, app):
        """Initialize planning lock component.

        :param app: superdesk app
        """
        self.app = app
        self.app.on_session_end += self.on_session_end

    @classmethod
    def name(cls):
        return 'planning_item_lock'

    def lock(self, item, user_id, session_id, action, resource):
        if not item:
            raise SuperdeskApiError.notFoundError()

        item_service = get_resource_service(resource)
        item_id = item.get(config.ID_FIELD)

        # lock_id will be:
        # 1 - Recurrence Id for items part of recurring series (event or planning)
        # 2 - event_item for planning with associated event
        # 3 - item's _id for all other cases
        lock_id_field = config.ID_FIELD
        if item.get('recurrence_id'):
            lock_id_field = 'recurrence_id'
        elif item.get('type') != 'event' and item.get('event_item'):
            lock_id_field = 'event_item'

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
                                  lock_action=updates.get('lock_action'),
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

        can_user_unlock, error_message = self.can_unlock(item, user_id, resource)

        if can_user_unlock:
            # following line executes handlers attached to function:
            # on_unlock_'resource' - ex. on_unlock_planning, on_unlock_event
            getattr(self.app, 'on_unlock_%s' % resource)(item, user_id)
            updates = {}
            if item.get(LOCK_USER):
                updates = {LOCK_USER: None, LOCK_SESSION: None, 'lock_time': None,
                           'lock_action': None}

                item_service.update(item.get(config.ID_FIELD), updates, item)

            # following line executes handlers attached to function:
            # on_unlocked_'resource' - ex. on_unlocked_planning, on_unlocked_event
            getattr(self.app, 'on_unlocked_%s' % resource)(item, user_id)

            push_notification(
                resource + ':unlock',
                item=str(item.get(config.ID_FIELD)),
                user=str(user_id),
                lock_session=str(session_id),
                etag=updates.get('_etag') or item.get('_etag'),
                event_item=item.get('event_item') or None,
                recurrence_id=item.get('recurrence_id') or None
            )
        else:
            raise SuperdeskApiError.forbiddenError(message=error_message)

        item = item_service.find_one(req=None, _id=item_id)
        return item

    def unlock_session(self, user_id, session_id):
        self.unlock_session_for_resource(user_id, session_id, 'planning')
        self.unlock_session_for_resource(user_id, session_id, 'events')
        self.unlock_session_for_resource(user_id, session_id, 'assignments')
        self.unlock_featured_planning(user_id, session_id)

    def unlock_featured_planning(self, user_id, session_id):
        item_service = get_resource_service('planning_featured_lock')
        items = item_service.find(where={'lock_session': session_id})
        if items.count() > 0:
            item_service.delete_action(lookup={})

    def unlock_session_for_resource(self, user_id, session_id, resource):
        item_service = get_resource_service(resource)
        items = item_service.find(where={'lock_session': session_id})

        for item in items:
            self.unlock(item, user_id, session_id, resource)

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

            if not (str(item.get(LOCK_USER, '')) == str(user_id) or current_user_has_privilege(resource_privileges)):
                return False, 'You don\'t have permissions to unlock an item.'
        else:
            return False, error_message

        return True, ''

    def on_session_end(self, user_id, session_id):
        self.unlock_session(user_id, session_id)

    def validate_relationship_locks(self, item, resource_name):
        if not item:
            raise SuperdeskApiError.notFoundError()

        all_items = get_resource_service(resource_name).get_all_items_in_relationship(item)
        for related_item in all_items:
            if related_item[config.ID_FIELD] != item[config.ID_FIELD]:
                if related_item.get(LOCK_USER) and related_item.get(LOCK_SESSION):
                    # Frame appropriate error message string

                    same_resource_conflict = False
                    item_name = 'planning item'
                    associated_name = 'event'
                    series_str = ''
                    if resource_name == 'events':
                        item_name = 'event'
                        associated_name = 'planning item'
                        if related_item.get('type') == 'event':
                            same_resource_conflict = True
                    else:
                        if related_item.get('type') != 'event':
                            same_resource_conflict = True

                    if item.get('recurrence_id'):
                        series_str = 'in this recurring series '

                    if same_resource_conflict:
                        message = 'Another {} {}is already locked.'.format(item_name, series_str)
                    else:
                        message = 'An associated {} {}is already locked.'.format(associated_name, series_str)

                    raise SuperdeskApiError.forbiddenError(message=message)
