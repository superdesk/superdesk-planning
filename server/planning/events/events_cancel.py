# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.notification import push_notification
from eve.utils import config
from apps.archive.common import get_user, get_auth
from planning.common import UPDATE_FUTURE, WORKFLOW_STATE, remove_lock_information
from copy import deepcopy
from .events import EventsResource, events_schema
from .events_base_service import EventsBaseService
from flask import current_app as app

event_cancel_schema = deepcopy(events_schema)
event_cancel_schema['reason'] = {
    'type': 'string',
    'nullable': True
}


class EventsCancelResource(EventsResource):
    url = 'events/cancel'
    resource_title = endpoint_name = 'events_cancel'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = event_cancel_schema


class EventsCancelService(EventsBaseService):
    ACTION = 'cancel'

    @staticmethod
    def _get_cancel_state():
        eocstat_map = get_resource_service('vocabularies').find_one(
            req=None,
            _id='eventoccurstatus'
        )

        occur_cancel_state = [x for x in eocstat_map.get('items', []) if
                              x['qcode'] == 'eocstat:eos6'][0]
        occur_cancel_state.pop('is_active', None)
        return occur_cancel_state

    def update_single_event(self, updates, original):
        occur_cancel_state = self._get_cancel_state()
        self._set_event_cancelled(updates, original, occur_cancel_state)
        self._cancel_event_plannings(updates, original)

    def update(self, id, updates, original):
        reason = updates.pop('reason', None)
        cancelled_items = updates.pop('_cancelled_events', [])
        item = super().update(id, updates, original)

        if self.is_original_event(updates, original):
            user = get_user(required=True).get(config.ID_FIELD, '')
            session = get_auth().get(config.ID_FIELD, '')

            push_notification(
                'events:cancel',
                item=str(original[config.ID_FIELD]),
                user=str(user),
                session=str(session),
                occur_status=updates.get('occur_status'),
                etag=item.get('_etag'),
                cancelled_items=cancelled_items,
                reason=reason or ''
            )

        return item

    @staticmethod
    def push_notification(name, updates, original):
        """
        Ignore this request, as we want to handle the notification separately in update
        """
        pass

    @staticmethod
    def _cancel_event_plannings(updates, original):
        planning_service = get_resource_service('planning')
        planning_cancel_service = get_resource_service('planning_cancel')
        reason = updates.get('reason', None)

        plans = list(planning_service.find(where={'event_item': original[config.ID_FIELD]}))
        for plan in plans:
            updated_plan = planning_cancel_service.patch(
                plan[config.ID_FIELD],
                {'reason': reason, 'event_cancellation': True}
            )
            app.on_updated_planning_cancel(
                updated_plan,
                plan
            )

    @staticmethod
    def _set_event_cancelled(updates, original, occur_cancel_state):
        reason = updates.get('reason', None)

        definition = '''------------------------------------------------------------
Event Cancelled
'''
        if reason is not None:
            definition += 'Reason: {}\n'.format(reason)

        if 'definition_long' in original:
            definition = original['definition_long'] + '\n\n' + definition

        remove_lock_information(updates)
        updates.update({
            'state': WORKFLOW_STATE.CANCELLED,
            'definition_long': definition,
            'occur_status': occur_cancel_state
        })

    def update_recurring_events(self, updates, original, update_method):
        occur_cancel_state = self._get_cancel_state()
        events_spike_service = get_resource_service('events_spike')
        historic, past, future = self.get_recurring_timeline(original, True)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            cancelled_events = future
        else:
            cancelled_events = past + future

        self._set_event_cancelled(updates, original, occur_cancel_state)

        notifications = []

        for event in cancelled_events:
            new_updates = deepcopy(updates)

            if not self.is_event_in_use(event):
                new_updates.pop('reason', None)
                new_updates.pop('update_method', None)

                # Spike this Event as it is not in use
                updated_event = events_spike_service.patch(event[config.ID_FIELD], new_updates)
                app.on_updated_events_spike(
                    updated_event,
                    event
                )

            else:
                # Cancel this Event as it is in use
                self._cancel_event_plannings(new_updates, event)
                new_updates['skip_on_update'] = True
                updated_event = self.patch(
                    event[config.ID_FIELD],
                    new_updates
                )

                notifications.append({
                    '_id': event.get(config.ID_FIELD),
                    '_etag': updated_event.get('_etag')
                })

        self._cancel_event_plannings(updates, original)
        updates['_cancelled_events'] = notifications
