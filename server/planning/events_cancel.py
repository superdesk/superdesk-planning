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
from superdesk.services import BaseService
from superdesk.notification import push_notification
from .item_lock import LOCK_USER, LOCK_SESSION
from eve.utils import config
from apps.archive.common import get_user, get_auth
from .common import UPDATE_SINGLE, UPDATE_FUTURE, WORKFLOW_STATE
from copy import deepcopy
from .events import EventsResource, events_schema
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


class EventsCancelService(BaseService):
    def update(self, id, updates, original):
        if 'skip_on_update' in updates:
            del updates['skip_on_update']
        else:
            eocstat_map = get_resource_service('vocabularies').find_one(
                req=None,
                _id='eventoccurstatus'
            )

            occur_cancel_state = [x for x in eocstat_map.get('items', []) if
                                  x['qcode'] == 'eocstat:eos6'][0]
            occur_cancel_state.pop('is_active', None)

            if not original.get('dates', {}).get('recurring_rule', None) or \
                    updates.get('update_method', UPDATE_SINGLE) == UPDATE_SINGLE:

                self._set_event_cancelled(updates, original, occur_cancel_state)
                self._cancel_event_plannings(updates, original)
            else:
                self._cancel_recurring_events(
                    updates,
                    original,
                    occur_cancel_state
                )

        reason = updates.get('reason', None)
        if 'reason' in updates:
            del updates['reason']

        if 'update_method' in updates:
            del updates['update_method']

        item = self.backend.update(self.datasource, id, updates, original)

        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        push_notification(
            'events:cancelled',
            item=str(original[config.ID_FIELD]),
            user=str(user),
            session=str(session),
            reason=reason,
            occur_status=updates['occur_status']
        )

        return item

    def _cancel_event_plannings(self, updates, original):
        planning_service = get_resource_service('planning')
        planning_cancel_service = get_resource_service('planning_cancel')
        reason = updates.get('reason', None)

        plans = list(planning_service.find(where={'event_item': original[config.ID_FIELD]}))
        for plan in plans:
            updated_plan = planning_cancel_service.patch(
                plan[config.ID_FIELD],
                {'reason': reason}
            )
            app.on_updated_planning_cancel(
                updated_plan,
                plan
            )

    def _set_event_cancelled(self, updates, original, occur_cancel_state):
        reason = updates.get('reason', None)

        definition = '''------------------------------------------------------------
Event Cancelled
'''
        if reason is not None:
            definition += 'Reason: {}\n'.format(reason)

        if 'definition_long' in original:
            definition = original['definition_long'] + '\n\n' + definition

        updates.update({
            LOCK_USER: None,
            LOCK_SESSION: None,
            'lock_time': None,
            'lock_action': None,
            'state': WORKFLOW_STATE.CANCELLED,
            'definition_long': definition,
            'occur_status': occur_cancel_state
        })

    def _cancel_recurring_events(self, updates, original, occur_cancel_state):
        events_service = get_resource_service('events')
        events_spike_service = get_resource_service('events_spike')
        update_method = updates.get('update_method', UPDATE_SINGLE)
        historic, past, future = events_service.get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            cancelled_events = future
        else:
            cancelled_events = past + future

        self._set_event_cancelled(updates, original, occur_cancel_state)

        for event in cancelled_events:
            has_plannings = events_service.has_planning_items(event)
            cloned_updates = deepcopy(updates)

            if not has_plannings and 'pubstatus' not in event:
                if 'reason' in cloned_updates:
                    del cloned_updates['reason']

                if 'update_method' in cloned_updates:
                    del cloned_updates['update_method']

                # Spike this Event as it is not in use
                updated_event = events_spike_service.patch(event[config.ID_FIELD], cloned_updates)
                app.on_updated_events_spike(
                    updated_event,
                    event
                )

            else:
                # Cancel this Event as it is in use
                self._cancel_event_plannings(cloned_updates, event)
                cloned_updates['skip_on_update'] = True

                self.update(
                    event[config.ID_FIELD],
                    cloned_updates,
                    event
                )

        self._cancel_event_plannings(updates, original)
