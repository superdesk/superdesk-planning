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
from .events_base_service import EventsBaseService
from superdesk.errors import SuperdeskApiError
from planning.common import ITEM_EXPIRY, ITEM_STATE, set_item_expiry, UPDATE_FUTURE, \
    WORKFLOW_STATE, remove_lock_information, remove_autosave_on_spike
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from superdesk import config, get_resource_service
from planning.item_lock import LOCK_USER, LOCK_SESSION
from eve.utils import ParsedRequest
from flask import json

from flask import current_app as app


class EventsSpikeResource(EventsResource):
    url = 'events/spike'
    resource_title = endpoint_name = 'events_spike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_spike'}


class EventsSpikeService(EventsBaseService):
    ACTION = 'spiked'
    REQUIRE_LOCK = False

    def update_single_event(self, updates, original):
        self._validate(original)
        remove_lock_information(updates)
        self._spike_event(updates, original)

    def update(self, id, updates, original):
        spiked_items = updates.pop('_spiked_items', [])
        remove_autosave_on_spike(original)
        item = super().update(id, updates, original)

        if self.is_original_event(original):
            user = get_user(required=True).get(config.ID_FIELD, '')
            spiked_items.append({
                'id': id,
                'etag': item['_etag'],
                'revert_state': item['revert_state']
            })

            push_notification(
                'events:spiked',
                item=str(original[config.ID_FIELD]),
                user=str(user),
                spiked_items=spiked_items
            )

        return item

    def on_updated(self, updates, original):
        # Spike associated planning
        planning_spike_service = get_resource_service('planning_spike')
        query = {
            'query': {'bool': {'must': {'term': {'event_item': str(original[config.ID_FIELD])}}}}
        }
        results = get_resource_service('planning').search(query)
        spiked_items = []
        if len(results.docs) > 0:
            for planning in results.docs:
                if planning['state'] == WORKFLOW_STATE.DRAFT:
                    planning_spike_service.patch(planning[config.ID_FIELD], {'state': 'spiked'})
                    spiked_items.append(str(planning[config.ID_FIELD]))

            # When a planning item associated with this event is spiked
            # If there were any failures in removing assignments
            # Send those notifications here
            if len(spiked_items) > 0:
                query = {
                    'query': {
                        'filtered': {
                            'filter': {
                                'bool': {
                                    'must': {
                                        'terms': {'planning_item': spiked_items}
                                    }
                                }
                            }
                        }
                    }
                }

                req = ParsedRequest()
                req.args = {'source': json.dumps(query)}

                assignments = get_resource_service('assignments').get(req=req, lookup=None)
                if assignments.count() > 0:
                    session_id = get_auth().get('_id')
                    user_id = get_user().get(config.ID_FIELD)
                    push_notification(
                        'assignments:delete:fail',
                        items=[{
                            'slugline': a.get('planning').get('slugline'),
                            'type': a.get('planning').get('g2_content_type')
                        } for a in assignments],
                        session=session_id,
                        user=user_id
                    )

    @staticmethod
    def push_notification(name, updates, original):
        """
        Ignore this request, as we want to handle the notification separately in update
        """
        pass

    @staticmethod
    def _spike_event(updates, original):
        updates['revert_state'] = original[ITEM_STATE]
        updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
        set_item_expiry(updates)

    @staticmethod
    def _can_spike(event, events_with_plans):
        return \
            'pubstatus' not in event and \
            event[config.ID_FIELD] not in events_with_plans and \
            'reschedule_from' not in event

    def update_recurring_events(self, updates, original, update_method):
        """Spike events in a recurring series

        Based on the update_method provided, spikes 'future' or 'all' events in the series.
        Historic events, i.e. events that have already occurred, will not be spiked.
        """
        # Ensure that no other Event or Planning item is currently locked
        events_with_plans = self._validate_recurring(original, original['recurrence_id'])

        historic, past, future = self.get_recurring_timeline(original, postponed=True, cancelled=True)

        # Mark item as unlocked directly in order to avoid more queries and notifications
        # coming from lockservice.
        remove_lock_information(updates)
        self._spike_event(updates, original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            spiked_events = future
        else:
            spiked_events = past + future

        notifications = []
        for event in spiked_events:
            if not self._can_spike(event, events_with_plans):
                continue

            new_updates = {'skip_on_update': True}
            self._spike_event(new_updates, event)
            item = self.patch(event[config.ID_FIELD], new_updates)
            app.on_updated_events_spike(new_updates, event)

            notifications.append({
                'id': event[config.ID_FIELD],
                'etag': item['_etag'],
                'revert_state': item['revert_state']
            })

        updates['_spiked_items'] = notifications

    @staticmethod
    def _validate(event):
        # Check to see if there are any planning items that are locked
        # If yes, return error
        # Check to see if we have any related planning items for that event which is locked
        planning_service = get_resource_service('planning')
        for planning in list(planning_service.find(where={'event_item': event[config.ID_FIELD]})):
            if planning.get(LOCK_USER) or planning.get(LOCK_SESSION):
                raise SuperdeskApiError.forbiddenError(
                    message="Spike failed. One or more related planning items are locked.")

        EventsSpikeService._validate_states(event)

    @staticmethod
    def _validate_recurring(original, recurrence_id):
        events_service = get_resource_service('events')
        planning_service = get_resource_service('planning')

        events_with_plans = []

        EventsSpikeService._validate_states(original)

        for event in list(events_service.find(where={'recurrence_id': recurrence_id})):
            if event[config.ID_FIELD] == original[config.ID_FIELD]:
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

    @staticmethod
    def _validate_states(event):
        events_service = get_resource_service('events')

        # Public Events (except unposted) cannot be spiked
        if event.get('pubstatus') and event.get('state') != WORKFLOW_STATE.KILLED:
            raise SuperdeskApiError.badRequestError(
                message="Spike failed. Posted Events cannot be spiked."
            )

        # Posted Events with Planning items cannot be spiked
        elif event.get('pubstatus') and events_service.get_plannings_for_event(event).count() > 0:
            raise SuperdeskApiError.badRequestError(
                message="Spike failed. Event has an associated Planning item."
            )

        # Event was created from a 'Reschedule' action or is 'Rescheduled'
        elif event.get('reschedule_from') or event.get(ITEM_STATE) == WORKFLOW_STATE.RESCHEDULED:
            raise SuperdeskApiError.badRequestError(
                message="Spike failed. Rescheduled Events cannot be spiked."
            )

        # Event already spiked
        elif event.get(ITEM_STATE) == WORKFLOW_STATE.SPIKED:
            raise SuperdeskApiError.badRequestError(
                message="Spike failed. Event is already spiked."
            )


class EventsUnspikeResource(EventsResource):
    url = 'events/unspike'
    resource_title = endpoint_name = 'events_unspike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_unspike'}


class EventsUnspikeService(EventsBaseService):
    ACTION = 'unspiked'
    REQUIRE_LOCK = False

    def update_single_event(self, updates, original):
        self._unspike_event(updates, original)

    def update_recurring_events(self, updates, original, update_method):
        historic, past, future = self.get_recurring_timeline(original, spiked=True)

        self._unspike_event(updates, original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            unspiked_events = future
        else:
            unspiked_events = past + future

        notifications = []
        for event in unspiked_events:
            if event.get(ITEM_STATE) != WORKFLOW_STATE.SPIKED:
                continue

            new_updates = {'skip_on_update': True}
            self._unspike_event(new_updates, event)
            item = self.patch(event[config.ID_FIELD], new_updates)
            app.on_updated_events_unspike(new_updates, event)

            notifications.append({
                'id': event[config.ID_FIELD],
                'etag': item['_etag'],
                'state': event.get('revert_state', WORKFLOW_STATE.DRAFT)
            })

        updates['_unspiked_items'] = notifications

    def update(self, id, updates, original):
        unspiked_items = updates.pop('_unspiked_items', [])
        item = super().update(id, updates, original)

        if self.is_original_event(original):
            user = get_user(required=True).get(config.ID_FIELD, '')
            unspiked_items.append({
                'id': id,
                'etag': item['_etag'],
                'state': item[ITEM_STATE]
            })

            push_notification(
                'events:unspiked',
                item=str(original[config.ID_FIELD]),
                user=str(user),
                unspiked_items=unspiked_items
            )

        return item

    @staticmethod
    def push_notification(name, updates, original):
        """
        Ignore this request, as we want to handle the notification separately in update
        """
        pass

    @staticmethod
    def _unspike_event(updates, original):
        updates[ITEM_STATE] = original.get('revert_state', WORKFLOW_STATE.DRAFT)
        updates['revert_state'] = None
        updates[ITEM_EXPIRY] = None
