# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from apps.auth import get_user_id
from planning.common import remove_lock_information, WORKFLOW_STATE, POST_STATE, \
    get_max_recurrent_events, set_original_creator
from .events import EventsResource, generate_recurring_dates
from .events_base_service import EventsBaseService
from planning.item_lock import LOCK_ACTION

from eve.utils import config
from flask import current_app as app

from copy import deepcopy
import pytz


class EventsUpdateRepetitionsResource(EventsResource):
    url = 'events/update_repetitions'
    resource_title = endpoint_name = 'events_update_repetitions'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}


class EventsUpdateRepetitionsService(EventsBaseService):
    ACTION = 'update_repetitions'

    def on_update(self, updates, original):
        user_id = get_user_id()
        if user_id:
            updates['version_creator'] = user_id

        # If `skip_on_update` is provided in the updates
        # Then return here so no further processing is performed on this event.
        if 'skip_on_update' in updates:
            return

        # We only validate the original event,
        # not the events that are automatically updated by the system
        self.validate(updates, original)

        remove_lock_information(updates)

        updated_rule = deepcopy(updates['dates']['recurring_rule'])
        original_rule = deepcopy(original['dates']['recurring_rule'])

        existing_events = self._get_series(original)

        first_event = existing_events[0]
        new_dates = [date for date in generate_recurring_dates(
            start=first_event.get('dates', {}).get('start'),
            tz=updates['dates'].get('tz') and pytz.timezone(updates['dates']['tz'] or None),
            **updated_rule
        )]

        original_dates = [date for date in generate_recurring_dates(
            start=first_event.get('dates', {}).get('start'),
            tz=original['dates'].get('tz') and pytz.timezone(original['dates']['tz'] or None),
            **original_rule
        )]

        # Compute the difference between start and end in the updated event
        time_delta = original['dates']['end'] - original['dates']['start']

        events_service = get_resource_service('events')

        deleted_events = {}
        new_events = []

        # Update the recurring rules for EVERY event in the series
        # Also if we're decreasing the length of the series, then
        # delete or mark the Event as cancelled.
        for event in existing_events:
            # if the event does not occur in the new dates, then we need to either
            # delete or cancel this event
            if event['dates']['start'].replace(tzinfo=None) not in new_dates:
                deleted_events[event[config.ID_FIELD]] = event

            # Otherwise this Event does occur in the new dates
            # So just update the recurring_rule to match the new series recurring_rule
            else:
                self._update_event(updated_rule, event)

        # Create new events that do not fall on the original series
        for date in new_dates:
            if date not in original_dates:
                new_events.append(self._create_event(date, updates, original, time_delta))

        # Now iterate over the new events and create them
        if new_events:
            events_service.create(new_events)
            for event in new_events:
                get_resource_service('events_history').on_update_repetitions(
                    event,
                    event[config.ID_FIELD],
                    'update_repetitions_create'
                )

        # Iterate over the events to delete/cancel
        self._set_events_planning(deleted_events)

        for event in deleted_events.values():
            self._delete_event(event, events_service, updated_rule)

        # if the original event was "posted" then post the new generated events
        if original.get('pubstatus') in [POST_STATE.CANCELLED, POST_STATE.USABLE]:
            post = {'event': original[config.ID_FIELD], 'etag': original['_etag'],
                    'update_method': 'all', 'pubstatus': original.get('pubstatus'), 'repost_on_update': True}
            get_resource_service('events_post').post([post])

    def update(self, id, updates, original):
        """
        Don't update the Event item here

        Instead modifications are done on Event items in the following functions:
        * _update_event
        * _create_event
        * _delete_event
        * _cancel_event
        """
        pass

    def _update_event(self, updated_rule, original):
        updates = self._update_rules(original, updated_rule)
        self.set_planning_schedule(updates)
        self.backend.update(self.datasource, original[config.ID_FIELD], updates, original)
        get_resource_service('events_history').on_update_repetitions(
            updates,
            original[config.ID_FIELD],
            'update_repetitions' if original.get(LOCK_ACTION) == 'update_repetitions' else 'update_repetitions_update'
        )

    def _create_event(self, date, updates, original, time_delta):
        # Create a copy of the metadata to use for the new event
        new_event = deepcopy(original)
        new_event.update(deepcopy(updates))

        # Remove fields not required by new events
        EventsUpdateRepetitionsService.remove_fields(new_event,
                                                     extra_fields=['reschedule_from', 'pubstatus'])

        new_event['state'] = WORKFLOW_STATE.DRAFT
        for key in list(new_event.keys()):
            if key.startswith('_') or key.startswith('lock_'):
                new_event.pop(key)

        # Set the new start and end dates, as well as the _id and guid fields
        new_event['dates']['start'] = date
        new_event['dates']['end'] = date + time_delta
        new_event[config.ID_FIELD] = new_event['guid'] = generate_guid(type=GUID_NEWSML)
        set_original_creator(new_event)
        self.set_planning_schedule(new_event)

        return new_event

    def _delete_event(self, event, events_service, updated_rule):
        event_plans = event.get('_plans', [])

        if len(event_plans) > 0 or event.get('pubstatus', None) is not None:
            self._cancel_event(event, updated_rule)
        else:
            events_service.delete_action(lookup={'_id': event[config.ID_FIELD]})
            app.on_deleted_item_events(event)

    def _cancel_event(self, event, updated_rule):
        cancel_service = get_resource_service('events_cancel')

        # If the Event is not in a valid state to Cancel, then we simply ignore this Event
        if not cancel_service.validate_states(event):
            return

        updates = self._update_rules(event, updated_rule)

        cancel_service.update_single_event(updates, event)
        self.backend.update(self.datasource, event[config.ID_FIELD], updates, event)
        app.on_updated_events_cancel(updates, {'_id': event[config.ID_FIELD]})

        # If the event was posted we need to post the cancellation
        if event.get('pubstatus') in [POST_STATE.CANCELLED, POST_STATE.USABLE]:
            post = {'event': event[config.ID_FIELD], 'etag': event['_etag'],
                    'update_method': 'single', 'pubstatus': event.get('pubstatus')}
            get_resource_service('events_post').post([post])

    @staticmethod
    def _update_rules(event, updated_rules):
        updates = {'dates': deepcopy(event['dates'])}
        updates['dates']['recurring_rule'] = deepcopy(updated_rules)
        remove_lock_information(updates)
        return updates

    def _get_series(self, original):
        query = {
            '$and': [{'recurrence_id': original['recurrence_id']}]
        }
        sort = '[("dates.start", 1)]'
        max_results = get_max_recurrent_events()

        events = []
        for event in self.get_series(query, sort, max_results):
            event['dates']['start'] = event['dates']['start']
            event['dates']['end'] = event['dates']['end']
            events.append(event)

        return events

    def validate(self, updates, original):
        super().validate(updates, original)

        if not updates.get('dates', {}).get('recurring_rule'):
            raise SuperdeskApiError.badRequestError('New recurring rules not provided')
        elif not original.get('recurrence_id'):
            raise SuperdeskApiError.badRequestError('Not a series of recurring events')
