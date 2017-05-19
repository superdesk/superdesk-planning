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

fields_to_remove = ['_id', '_etag', '_current_version', '_updated', '_created', '_links', 'version_creator', 'guid']


class HistoryService(Service):
    """Provide common methods for tracking history of Creation, Updates and Spiking to collections
    """

    def on_item_created(self, items):
        for item in items:
            self._save_history({config.ID_FIELD: ObjectId(item[config.ID_FIELD]) if ObjectId.is_valid(
                item[config.ID_FIELD]) else str(item[config.ID_FIELD])}, deepcopy(item), 'create')

    def on_item_updated(self, updates, original, operation=None):
        item = deepcopy(original)
        if updates:
            item.update(updates)
        self._save_history(item, updates, operation or 'update')

    def on_spike(self, updates, original):
        self.on_item_updated(updates, original, 'spiked')

    def on_unspike(self, updates, original):
        self.on_item_updated(updates, original, 'unspiked')

    def get_user_id(self):
        user = getattr(g, 'user', None)
        if user:
            return user.get('_id')

    def _remove_unwanted_fields(self, update):
        if update:
            update_copy = deepcopy(update)
            for field in fields_to_remove:
                update_copy.pop(field, None)

            return update_copy
