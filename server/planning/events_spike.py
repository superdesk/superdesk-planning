# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .events import EventsResource
from superdesk.errors import SuperdeskApiError
from .common import ITEM_EXPIRY, ITEM_STATE, set_item_expiry, UPDATE_SINGLE, UPDATE_FUTURE, \
    WORKFLOW_STATE
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.archive.common import get_user
from superdesk import config, get_resource_service
from superdesk.utc import utcnow
from .item_lock import LOCK_USER, LOCK_SESSION


class EventsSpikeResource(EventsResource):
    url = 'events/spike'
    resource_title = endpoint_name = 'events_spike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_spike'}


class EventsSpikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        self._validate(id)

        updates['revert_state'] = original[ITEM_STATE]
        updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
        set_item_expiry(updates)

        if 'update_method' in updates:
            update_method = updates['update_method']
            del updates['update_method']
        else:
            update_method = UPDATE_SINGLE

        # Mark item as unlocked directly in order to avoid more queries and notifications
        # coming from lockservice.
        updates.update({LOCK_USER: None, LOCK_SESSION: None, 'lock_time': None,
                       'lock_action': None})

        item = self.backend.update(self.datasource, id, updates, original)

        push_notification('events:spiked', item=str(id), user=str(user.get(config.ID_FIELD)),
                          etag=item['_etag'], revert_state=item['revert_state'])

        if original.get('recurrence_id') and update_method != UPDATE_SINGLE:
            self._spike_recurring(updates, original, update_method)

        return item

    def on_updated(self, updates, original):
        planning_service = get_resource_service('planning')
        spike_service = get_resource_service('planning_spike')

        for planning in list(planning_service.find(where={'event_item': original[config.ID_FIELD]})):
            spike_service.patch(planning[config.ID_FIELD], {})

    def _spike_recurring(self, updates, original, update_method):
        """Spike events in a recurring series

        Based on the update_method provided, spikes 'future' or 'all' events in the series.
        Historic events, i.e. events that have already occurred, will not be spiked.
        """
        recurrence_id = original['recurrence_id']

        if update_method == UPDATE_SINGLE:
            return

        start = utcnow()

        if update_method == UPDATE_FUTURE:
            dates = original.get('dates')
            start = dates.get('start')

        lookup = {
            '$and': [
                {'recurrence_id': recurrence_id},
                {'_id': {'$ne': original[config.ID_FIELD]}},
                {'dates.end': {'$gt': start}}
            ]
        }

        events = list(e for e in self.get_from_mongo(None, lookup))
        for e in events:
            self.on_update(updates, e)
            self.update(e[config.ID_FIELD], {}, e)
            self.on_updated(updates, e)

    def _validate(self, id):
        # Check to see if there are any planning items that are locked
        # If yes, return error
        # Check to see if we have any related planning items for that event which is locked
        planning_service = get_resource_service('planning')
        for planning in list(planning_service.find(where={'event_item': id})):
            if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
                raise SuperdeskApiError.forbiddenError(
                    message="Spike failed. One or more related planning items are locked.")


class EventsUnspikeResource(EventsResource):
    url = 'events/unspike'
    resource_title = endpoint_name = 'events_unspike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_unspike'}


class EventsUnspikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[ITEM_STATE] = original.get('revert_state', WORKFLOW_STATE.IN_PROGRESS)
        updates['revert_state'] = None
        updates[ITEM_EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('events:unspiked', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item
