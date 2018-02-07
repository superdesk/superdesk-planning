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
from superdesk.errors import SuperdeskApiError
from flask import current_app as app
from eve.utils import config
from copy import deepcopy

from .events import EventsResource, events_schema
from planning.common import remove_lock_information, UPDATE_FUTURE
from .events_base_service import EventsBaseService


class EventsUpdateTimeResource(EventsResource):
    url = 'events/update_time'
    resource_title = endpoint_name = 'events_update_time'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = events_schema


class EventsUpdateTimeService(EventsBaseService):
    ACTION = 'update_time'

    def update_single_event(self, updates, original):
        # Release the Lock on the selected Event
        remove_lock_information(updates)

        # Set '_planning_schedule' on the Event item
        self.set_planning_schedule(updates)

    def update_recurring_events(self, updates, original, update_method):
        events_service = get_resource_service('events')
        historic, past, future = events_service.get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            new_series = [original] + future
        else:
            new_series = past + [original] + future

        # Release the Lock on the selected Event
        remove_lock_information(updates)

        # Calculate the delta between the original date/time and the updated date/time
        start_delta = updates['dates']['start'] - original['dates']['start']
        end_delta = updates['dates']['end'] - original['dates']['end']

        for event in new_series:
            if not event.get(config.ID_FIELD):
                continue

            new_updates = {'dates': deepcopy(event['dates'])}

            # Add the delta to the events original date/time
            new_updates['dates']['start'] = event['dates']['start'] + start_delta
            new_updates['dates']['end'] = event['dates']['end'] + end_delta

            # Set '_planning_schedule' on the Event item
            self.set_planning_schedule(new_updates)

            if event.get(config.ID_FIELD) != original.get(config.ID_FIELD):
                new_updates['skip_on_update'] = True
                self.patch(event[config.ID_FIELD], new_updates)
                app.on_updated_events_update_time(new_updates, {'_id': event[config.ID_FIELD]})

    def validate(self, updates, original):
        super().validate(updates, original)

        if not updates.get('dates'):
            raise SuperdeskApiError.badRequestError('No new time was provided')
        elif not updates['dates'].get('start'):
            raise SuperdeskApiError.badRequestError('No start time was provided')
        elif not updates['dates'].get('end'):
            raise SuperdeskApiError.badRequestError('No end time was provided')
