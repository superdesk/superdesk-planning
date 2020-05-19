# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.errors import SuperdeskApiError
from superdesk.utc import local_to_utc, utc_to_local
from flask import current_app as app
from eve.utils import config
from copy import deepcopy

from .events import EventsResource, events_schema
from planning.common import remove_lock_information, UPDATE_FUTURE, TO_BE_CONFIRMED_FIELD
from .events_base_service import EventsBaseService

from datetime import date, datetime


class EventsUpdateTimeResource(EventsResource):
    url = 'events/update_time'
    resource_title = endpoint_name = 'events_update_time'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = events_schema

    merge_nested_documents = True


class EventsUpdateTimeService(EventsBaseService):
    ACTION = 'update_time'

    def update_single_event(self, updates, original):
        # Release the Lock on the selected Event
        remove_lock_information(updates)

        # Set '_planning_schedule' on the Event item
        self.set_planning_schedule(updates)

    def update_recurring_events(self, updates, original, update_method):
        historic, past, future = self.get_recurring_timeline(original)

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

        # Get the timezone from the original Event (as the series was created with that timezone in mind)
        timezone = original['dates']['tz']

        # First find the hour and minute of the start date in local time
        start_time = utc_to_local(timezone, updates['dates']['start']).time()

        # Next convert that to seconds since midnight (which gives us a timedelta instance)
        delta_since_midnight = datetime.combine(date.min, start_time) - datetime.min

        # And calculate the new duration of the events
        duration = updates['dates']['end'] - updates['dates']['start']

        for event in new_series:
            if not event.get(config.ID_FIELD):
                continue

            new_updates = {'dates': deepcopy(event['dates'])} \
                if event.get(config.ID_FIELD) != original.get(config.ID_FIELD) else updates

            # Calculate midnight in local time for this occurrence
            start_of_day_local = utc_to_local(timezone, event['dates']['start'])\
                .replace(hour=0, minute=0, second=0)

            # Then convert midnight in local time to UTC
            start_date_time = local_to_utc(timezone, start_of_day_local)

            # Finally add the delta since midnight
            start_date_time += delta_since_midnight

            # Set the new start and end times
            new_updates['dates']['start'] = start_date_time
            new_updates['dates']['end'] = start_date_time + duration

            if event.get(TO_BE_CONFIRMED_FIELD):
                new_updates[TO_BE_CONFIRMED_FIELD] = False

            # Set '_planning_schedule' on the Event item
            self.set_planning_schedule(new_updates)

            if event.get(config.ID_FIELD) != original.get(config.ID_FIELD):
                new_updates['skip_on_update'] = True
                self.patch(event[config.ID_FIELD], new_updates)
                app.on_updated_events_update_time(new_updates, {'_id': event[config.ID_FIELD]})

    def validate(self, updates, original):
        super().validate(updates, original)

        if not updates.get('dates') and not updates.get('_timeToBeConfirmed'):
            raise SuperdeskApiError.badRequestError('No new time was provided')
        elif not updates['dates'].get('start'):
            raise SuperdeskApiError.badRequestError('No start time was provided')
        elif not updates['dates'].get('end'):
            raise SuperdeskApiError.badRequestError('No end time was provided')
