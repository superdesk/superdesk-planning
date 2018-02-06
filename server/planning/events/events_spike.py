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
from planning.common import ITEM_EXPIRY, ITEM_STATE, set_item_expiry, UPDATE_SINGLE, UPDATE_FUTURE, \
    WORKFLOW_STATE, remove_lock_information
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.archive.common import get_user
from superdesk import config, get_resource_service
from planning.item_lock import LOCK_USER, LOCK_SESSION


class EventsSpikeResource(EventsResource):
    url = 'events/spike'
    resource_title = endpoint_name = 'events_spike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_spike'}


class EventsSpikeService(BaseService):
    def update(self, id, updates, original):
        if 'update_method' in updates:
            update_method = updates['update_method']
            del updates['update_method']
        else:
            update_method = UPDATE_SINGLE

        if original.get('recurrence_id') and update_method != UPDATE_SINGLE:
            item = self._spike_recurring(updates, original, update_method)
        else:
            item = self._spike_single_event(updates, original)

        return item

    def _spike_event(self, updates, original):
        updates['revert_state'] = original[ITEM_STATE]
        updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
        set_item_expiry(updates)

        return self.backend.update(self.datasource, original[config.ID_FIELD], updates, original)

    def _spike_single_event(self, updates, original):
        self._validate(original[config.ID_FIELD])
        # Mark item as unlocked directly in order to avoid more queries and notifications
        # coming from lockservice.
        remove_lock_information(updates)
        item = self._spike_event(updates, original)

        user = get_user(required=True)
        push_notification(
            'events:spiked',
            item=str(original[config.ID_FIELD]),
            user=str(user.get(config.ID_FIELD)),
            etag=item['_etag'],
            revert_state=item['revert_state']
        )

        return item

    def _spike_recurring(self, updates, original, update_method):
        """Spike events in a recurring series

        Based on the update_method provided, spikes 'future' or 'all' events in the series.
        Historic events, i.e. events that have already occurred, will not be spiked.
        """
        # Ensure that no other Event or Planning item is currently locked
        events_with_plans = self._validate_recurring(original[config.ID_FIELD], original['recurrence_id'])

        notifications = []

        events_service = get_resource_service('events')
        historic, past, future = events_service.get_recurring_timeline(original)

        # Mark item as unlocked directly in order to avoid more queries and notifications
        # coming from lockservice.
        remove_lock_information(updates)
        new_item = self._spike_event(updates, original)
        notifications.append({
            '_id': original[config.ID_FIELD],
            'etag': new_item['_etag'],
            'revert_state': new_item['revert_state']
        })

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            spiked_events = future
        else:
            spiked_events = past + future

        for event in spiked_events:
            if 'pubstatus' in event or \
                    event[ITEM_STATE] == WORKFLOW_STATE.SPIKED or \
                    event[config.ID_FIELD] in events_with_plans:
                continue

            self.on_update(updates, event)
            item = self._spike_event({}, event)
            notifications.append({
                '_id': event[config.ID_FIELD],
                'etag': item['_etag'],
                'revert_state': item['revert_state']
            })
            self.on_updated(updates, event)

        user = get_user(required=True)
        push_notification(
            'events:spiked:recurring',
            user=str(user.get(config.ID_FIELD)),
            items=notifications,
            recurrence_id=original['recurrence_id']
        )

        return new_item

    def _validate(self, id):
        # Check to see if there are any planning items that are locked
        # If yes, return error
        # Check to see if we have any related planning items for that event which is locked
        planning_service = get_resource_service('planning')
        for planning in list(planning_service.find(where={'event_item': id})):
            if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
                raise SuperdeskApiError.forbiddenError(
                    message="Spike failed. One or more related planning items are locked.")

    def _validate_recurring(self, original_id, recurrence_id):
        events_service = get_resource_service('events')
        planning_service = get_resource_service('planning')

        events_with_plans = []

        for event in list(events_service.find(where={'recurrence_id': recurrence_id})):
            if event[config.ID_FIELD] == original_id:
                continue

            if event.get(LOCK_USER) or event.get(LOCK_SESSION):
                raise SuperdeskApiError.forbiddenError(
                    message="Spike failed. An event in the series is locked."
                )

        for planning in list(planning_service.find(where={'recurrence_id': recurrence_id})):
            if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
                raise SuperdeskApiError.forbiddenError(
                    message="Spike failed. A related planning item is locked."
                )

            if planning['event_item'] not in events_with_plans:
                events_with_plans.append(planning['event_item'])

        return events_with_plans


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

        updates[ITEM_STATE] = original.get('revert_state', WORKFLOW_STATE.DRAFT)
        updates['revert_state'] = None
        updates[ITEM_EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification(
            'events:unspiked',
            item=str(id),
            user=str(user.get(config.ID_FIELD)),
            etag=item['_etag'],
            state=item[ITEM_STATE]
        )
        return item
