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
from superdesk.resource_fields import ID_FIELD
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification
from superdesk.users.services import current_user_has_privilege
from superdesk.utc import utcnow
from superdesk.lock import lock, unlock
from superdesk import get_resource_service, get_resource_privileges
from apps.common.components.base_component import BaseComponent
from apps.item_lock.components.item_lock import LOCK_USER, LOCK_SESSION, LOCK_ACTION, LOCK_TIME

from planning.utils import get_related_event_ids_for_planning, get_first_related_event_id_for_planning


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
        return "planning_item_lock"

    def lock(self, item, user_id, session_id, action, resource):
        if not item:
            raise SuperdeskApiError.notFoundError()
        elif self.existing_lock_is_unchanged(item, user_id, session_id, action):
            # No need to lock the item for this user, session and action
            # as it is already locked for such a purpose
            return item

        item_service = get_resource_service(resource)
        item_id = item.get(ID_FIELD)

        # lock_id will be:
        # 1 - Recurrence Id for items part of recurring series (event or planning)
        # 2 - Event ID for planning with related primary event
        # 3 - item's _id for all other cases
        first_primary_event_id = get_first_related_event_id_for_planning(item, "primary")
        if item.get("recurrence_id"):
            recurrence_id = item["recurrence_id"]
            lock_id = f"item_lock {recurrence_id}"
        elif item.get("type") != "event" and first_primary_event_id is not None:
            lock_id = f"item_lock {first_primary_event_id}"
        else:
            lock_id = f"item_lock {item_id}"

        # get the lock it not raise forbidden exception
        if not lock(lock_id, expire=5):
            raise SuperdeskApiError.forbiddenError(message="Item is locked by another user.")

        try:
            can_user_lock, error_message = self.can_lock(item, user_id, session_id, resource)

            if can_user_lock:
                # following line executes handlers attached to function:
                # on_lock_'resource' - ex. on_lock_planning, on_lock_event
                getattr(self.app, "on_lock_%s" % resource)(item, user_id)

                updates = {
                    LOCK_USER: user_id,
                    LOCK_SESSION: session_id,
                    LOCK_TIME: utcnow(),
                }
                if action:
                    updates[LOCK_ACTION] = action

                item_service.update(item.get(ID_FIELD), updates, item)

                push_notification(
                    resource + ":lock",
                    item=str(item.get(ID_FIELD)),
                    user=str(user_id),
                    lock_time=updates[LOCK_TIME],
                    lock_session=str(session_id),
                    lock_action=updates.get(LOCK_ACTION),
                    etag=updates["_etag"],
                    event_ids=get_related_event_ids_for_planning(item),
                    recurrence_id=item.get("recurrence_id") or None,
                    type=item.get("type"),
                )
            else:
                raise SuperdeskApiError.forbiddenError(message=error_message)

            item = item_service.find_one(req=None, _id=item_id)

            # following line executes handlers attached to function:
            # on_locked_'resource' - ex. on_locked_planning, on_locked_event
            getattr(self.app, "on_locked_%s" % resource)(item, user_id)
            return item
        finally:
            # unlock the lock :)
            unlock(lock_id, remove=True)

    def existing_lock_is_unchanged(self, item, user_id, session_id, action):
        return (
            item.get(LOCK_USER) == user_id and item.get(LOCK_SESSION) == session_id and item.get(LOCK_ACTION) == action
        )

    def unlock(self, item, user_id, session_id, resource):
        if not item:
            raise SuperdeskApiError.notFoundError()
        if item.get(LOCK_USER) is None and item.get(LOCK_SESSION) is None and item.get(LOCK_ACTION) is None:
            # No need to unlock the item, as it is already unlocked
            return item

        item_service = get_resource_service(resource)
        item_id = item.get(ID_FIELD)

        can_user_unlock, error_message = self.can_unlock(item, user_id, resource)

        if not can_user_unlock:
            raise SuperdeskApiError.forbiddenError(message=error_message)

        # following line executes handlers attached to function:
        # on_unlock_'resource' - ex. on_unlock_planning, on_unlock_event
        getattr(self.app, "on_unlock_%s" % resource)(item, user_id)

        # Unlock the item
        updates = {LOCK_USER: None, LOCK_SESSION: None, LOCK_TIME: None, LOCK_ACTION: None}
        item_service.update(item.get(ID_FIELD), updates, item)
        item = item_service.find_one(req=None, _id=item_id)

        # following line executes handlers attached to function:
        # on_unlocked_'resource' - ex. on_unlocked_planning, on_unlocked_event
        getattr(self.app, "on_unlocked_%s" % resource)(item, user_id)

        push_notification(
            resource + ":unlock",
            item=str(item.get(ID_FIELD)),
            user=str(user_id),
            lock_session=str(session_id),
            etag=updates.get("_etag") or item.get("_etag"),
            event_ids=get_related_event_ids_for_planning(item),
            recurrence_id=item.get("recurrence_id") or None,
            type=item.get("type"),
        )

        return item

    def unlock_session(self, user_id, session_id, is_last_session):
        logger.info(f"planning:item_lock: Unlocking session {session_id}")
        self.unlock_session_for_resource(user_id, session_id, is_last_session, "planning")
        self.unlock_session_for_resource(user_id, session_id, is_last_session, "events")
        self.unlock_session_for_resource(user_id, session_id, is_last_session, "assignments")
        self.unlock_featured_planning(user_id, session_id, is_last_session)

    def unlock_featured_planning(self, user_id, session_id, is_last_session):
        item_service = get_resource_service("planning_featured_lock")
        items = item_service.find(
            where={LOCK_USER: str(user_id)} if is_last_session else {LOCK_SESSION: str(session_id)}
        )
        if items.count() > 0:
            item_service.delete_action(lookup={})

    def unlock_session_for_resource(self, user_id, session_id, is_last_session, resource):
        logger.info(f"planning:item_lock: Unlocking {resource} resources")
        item_service = get_resource_service(resource)
        term_filter = {LOCK_USER: str(user_id)} if is_last_session else {LOCK_SESSION: str(session_id)}
        for item in item_service.search({"query": {"bool": {"filter": {"term": term_filter}}}}):
            self.unlock(item, user_id, session_id, resource)

    def can_lock(self, item, user_id, session_id, resource):
        """
        Function checks whether user can lock the item or not. If not then raises exception.
        """
        can_user_edit, error_message = superdesk.get_resource_service(resource).can_edit(item, user_id)

        if can_user_edit:
            if item.get(LOCK_USER):
                if str(item.get(LOCK_USER, "")) == str(user_id) and str(item.get(LOCK_SESSION)) != str(session_id):
                    return False, "Item is locked by you in another session."
                else:
                    if str(item.get(LOCK_USER, "")) != str(user_id):
                        return False, "Item is locked by another user."
        else:
            return False, error_message

        return True, ""

    def can_unlock(self, item, user_id, resource):
        """
        Function checks whether user can unlock the item or not.
        """
        can_user_edit, error_message = superdesk.get_resource_service(resource).can_edit(item, user_id)

        if can_user_edit:
            resource_privileges = get_resource_privileges(resource).get("PATCH")

            if not (str(item.get(LOCK_USER, "")) == str(user_id) or current_user_has_privilege(resource_privileges)):
                return False, "You don't have permissions to unlock an item."
        else:
            return False, error_message

        return True, ""

    def on_session_end(self, user_id, session_id, is_last_session):
        logger.info("planning:item_lock: On session end")
        self.unlock_session(user_id, session_id, is_last_session)

    def validate_relationship_locks(self, item, resource_name):
        if not item:
            raise SuperdeskApiError.notFoundError()

        all_items = get_resource_service(resource_name).get_all_items_in_relationship(item)
        for related_item in all_items:
            if related_item[ID_FIELD] != item[ID_FIELD]:
                if related_item.get(LOCK_USER) and related_item.get(LOCK_SESSION):
                    # Frame appropriate error message string

                    same_resource_conflict = False
                    item_name = "planning item"
                    associated_name = "event"
                    series_str = ""
                    if resource_name == "events":
                        item_name = "event"
                        associated_name = "planning item"
                        if related_item.get("type") == "event":
                            same_resource_conflict = True
                    else:
                        if related_item.get("type") != "event":
                            same_resource_conflict = True

                    if item.get("recurrence_id"):
                        series_str = "in this recurring series "

                    if same_resource_conflict:
                        message = "Another {} {}is already locked.".format(item_name, series_str)
                    else:
                        message = "An associated {} {}is already locked.".format(associated_name, series_str)

                    raise SuperdeskApiError.forbiddenError(message=message)
