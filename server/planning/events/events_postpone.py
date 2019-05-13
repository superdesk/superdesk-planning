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
from planning.common import UPDATE_FUTURE, WORKFLOW_STATE, remove_lock_information, set_actioned_date_to_event
from copy import deepcopy
from .events import EventsResource, events_schema
from .events_base_service import EventsBaseService
from flask import current_app as app


event_postpone_schema = deepcopy(events_schema)
event_postpone_schema['reason'] = {
    'type': 'string',
    'nullable': True,
}


class EventsPostponeResource(EventsResource):
    url = 'events/postpone'
    resource_title = endpoint_name = 'events_postpone'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = event_postpone_schema


class EventsPostponeService(EventsBaseService):
    ACTION = 'postpone'

    def update_single_event(self, updates, original):
        self._set_event_postponed(updates)
        self._postpone_event_plannings(updates, original)

    def update(self, id, updates, original):
        reason = updates.pop('reason', None)
        set_actioned_date_to_event(updates, original)

        item = super().update(id, updates, original)

        # Because we require the original item being actioned against to be locked
        # then we can check the lock information of original and updates to check if this
        # event was the original event.
        if self.is_original_event(original):
            user = get_user(required=True).get(config.ID_FIELD, '')
            session = get_auth().get(config.ID_FIELD, '')

            push_notification(
                'events:postpone',
                item=str(original[config.ID_FIELD]),
                user=str(user),
                session=str(session),
                reason=reason,
                actioned_date=updates.get('actioned_date')
            )

        return item

    @staticmethod
    def push_notification(name, updates, original):
        """
        Ignore this request, as we want to handle the notification separately in update
        """
        pass

    @staticmethod
    def _postpone_event_plannings(updates, original):
        planning_service = get_resource_service('planning')
        planning_postpone_service = get_resource_service('planning_postpone')
        reason = updates.get('reason', None)

        plans = list(planning_service.find(where={'event_item': original[config.ID_FIELD]}))
        for plan in plans:
            if plan.get('state') != WORKFLOW_STATE.CANCELLED:
                updated_plan = planning_postpone_service.patch(
                    plan[config.ID_FIELD],
                    {'reason': reason}
                )
                app.on_updated_planning_postpone(
                    updated_plan,
                    plan
                )

    @staticmethod
    def _set_event_postponed(updates):
        reason = updates.get('reason', None)
        remove_lock_information(updates)
        updates['state'] = WORKFLOW_STATE.POSTPONED
        updates['state_reason'] = reason

    def update_recurring_events(self, updates, original, update_method):
        historic, past, future = self.get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            postponed_events = future
        else:
            postponed_events = past + future

        self._set_event_postponed(updates)

        for event in postponed_events:
            new_updates = deepcopy(updates)

            # Mark the Event as being Postponed
            self._postpone_event_plannings(new_updates, event)
            new_updates['skip_on_update'] = True
            self.patch(
                event[config.ID_FIELD],
                new_updates
            )

        self._postpone_event_plannings(updates, original)
