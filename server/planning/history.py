# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from superdesk import Service
from copy import deepcopy
from flask import g
from eve.utils import config
from bson import ObjectId
from .item_lock import LOCK_ACTION, LOCK_USER, LOCK_TIME, LOCK_SESSION
from superdesk.metadata.item import ITEM_TYPE


fields_to_remove = ['_id', '_etag', '_current_version', '_updated', '_created', '_links', 'version_creator', 'guid',
                    LOCK_ACTION, LOCK_USER, LOCK_TIME, LOCK_SESSION, 'planning_ids', '_updates_schedule',
                    '_planning_schedule', '_planning_date', '_reschedule_from_schedule', 'versioncreated']


class HistoryService(Service):
    """Provide common methods for tracking history of Creation, Updates and Spiking to collections
    """

    def on_item_created(self, items, operation=None):
        for item in items:
            if not item.get('duplicate_from'):
                self._save_history({config.ID_FIELD: ObjectId(item[config.ID_FIELD]) if ObjectId.is_valid(
                    item[config.ID_FIELD]) else str(item[config.ID_FIELD])}, deepcopy(item), operation or 'create')

    def on_item_updated(self, updates, original, operation=None):
        item = deepcopy(original)
        if list(item.keys()) == ['_id']:
            diff = updates
        else:
            diff = self._changes(original, updates)
            if updates:
                item.update(updates)

        self._save_history(item, diff, operation or 'edited')

    def on_spike(self, updates, original):
        self.on_item_updated(updates, original, 'spiked')

    def on_unspike(self, updates, original):
        self.on_item_updated(updates, original, 'unspiked')

    def on_cancel(self, updates, original):
        operation = 'events_cancel' if original.get(ITEM_TYPE) == 'event' else 'planning_cancel'
        self.on_item_updated(updates, original, operation)

    def on_reschedule(self, updates, original):
        self.on_item_updated(updates, original, 'reschedule')

    def on_reschedule_from(self, item):
        new_item = deepcopy(item)
        self._save_history(
            {config.ID_FIELD: str(item[config.ID_FIELD])},
            new_item,
            'reschedule_from'
        )

    def on_postpone(self, updates, original):
        self.on_item_updated(updates, original, 'postpone')

    def get_user_id(self):
        user = getattr(g, 'user', None)
        if user:
            return user.get('_id')

    def _changes(self, original, updates):
        """
        Given the original record and the updates calculate what has changed and what is new

        :param original:
        :param updates:
        :return: dictionary of what was changed and what was added
        """
        original_keys = set(original.keys())
        updates_keys = set(updates.keys())
        intersect_keys = original_keys.intersection(updates_keys)
        modified = {o: updates[o] for o in intersect_keys if original[o] != updates[o]}
        added_keys = updates_keys - original_keys
        added = {a: updates[a] for a in added_keys}
        modified.update(added)
        return self._remove_unwanted_fields(modified)

    def _remove_unwanted_fields(self, update):
        if update:
            update_copy = deepcopy(update)
            for field in fields_to_remove:
                update_copy.pop(field, None)

            return update_copy

    def _save_history(self, item, update, operation):
        raise NotImplementedError()
