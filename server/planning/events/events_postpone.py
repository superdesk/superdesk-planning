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
from planning.item_lock import LOCK_USER, LOCK_SESSION
from eve.utils import config
from apps.archive.common import get_user, get_auth
from planning.common import UPDATE_SINGLE, UPDATE_FUTURE, WORKFLOW_STATE
from copy import deepcopy
from .events import EventsResource, events_schema
from flask import current_app as app

event_postpone_schema = deepcopy(events_schema)
event_postpone_schema['reason'] = {
    'type': 'string',
    'nullable': True
}


class EventsPostponeResource(EventsResource):
    url = 'events/postpone'
    resource_title = endpoint_name = 'events_postpone'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = event_postpone_schema


class EventsPostponeService(BaseService):
    def update(self, id, updates, original):
        if 'skip_on_update' in updates:
            del updates['skip_on_update']
        else:
            if not original.get('dates', {}).get('recurring_rule', None) or \
                    updates.get('update_method', UPDATE_SINGLE) == UPDATE_SINGLE:

                self._set_event_postponed(updates, original)
                self._postpone_event_plannings(updates, original)
            else:
                self._postpone_recurring_events(
                    updates,
                    original
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
            'events:postponed',
            item=str(original[config.ID_FIELD]),
            user=str(user),
            session=str(session),
            reason=reason
        )

        return item

    def _postpone_event_plannings(self, updates, original):
        planning_service = get_resource_service('planning')
        planning_postpone_service = get_resource_service('planning_postpone')
        reason = updates.get('reason', None)

        plans = list(planning_service.find(where={'event_item': original[config.ID_FIELD]}))
        for plan in plans:
            updated_plan = planning_postpone_service.patch(
                plan[config.ID_FIELD],
                {'reason': reason}
            )
            app.on_updated_planning_postpone(
                updated_plan,
                plan
            )

    def _set_event_postponed(self, updates, original):
        reason = updates.get('reason', None)

        definition = '''------------------------------------------------------------
Event Postponed
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
            'state': WORKFLOW_STATE.POSTPONED,
            'definition_long': definition
        })

    def _postpone_recurring_events(self, updates, original):
        update_method = updates.get('update_method', UPDATE_SINGLE)
        historic, past, future = get_resource_service('events').get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            postponed_events = future
        else:
            postponed_events = past + future

        self._set_event_postponed(updates, original)

        for event in postponed_events:
            cloned_updates = deepcopy(updates)

            # Mark the Event as being Postponed
            self._postpone_event_plannings(cloned_updates, event)
            cloned_updates['skip_on_update'] = True

            self.update(
                event[config.ID_FIELD],
                cloned_updates,
                event
            )

        self._postpone_event_plannings(updates, original)
