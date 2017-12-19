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
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from eve.utils import config
from apps.archive.common import get_user, get_auth, set_original_creator
from planning.common import UPDATE_SINGLE, UPDATE_FUTURE, WORKFLOW_STATE, ITEM_STATE, remove_lock_information
from copy import deepcopy
from .events import EventsResource, events_schema, generate_recurring_dates, \
    set_next_occurrence, set_planning_schedule
from flask import current_app as app
from itertools import islice
import pytz
from datetime import datetime

event_cancel_schema = deepcopy(events_schema)
event_cancel_schema['reason'] = {
    'type': 'string',
    'nullable': True
}


class EventsRescheduleResource(EventsResource):
    url = 'events/reschedule'
    resource_title = endpoint_name = 'events_reschedule'

    datasource = {'source': 'events'}

    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_management'}

    schema = event_cancel_schema


class EventsRescheduleService(BaseService):
    def update(self, id, updates, original):
        if 'skip_on_update' in updates:
            del updates['skip_on_update']
        else:
            events_service = get_resource_service('events')
            update_method = updates.pop('update_method', UPDATE_SINGLE)
            # Release the Lock on the selected Event
            remove_lock_information(item=updates)

            # Run the specific methods based on if the original is a
            # single or a series of recurring events
            if not original.get('dates', {}).get('recurring_rule', None) or \
                    update_method == UPDATE_SINGLE:
                self._reschedule_single_event(updates, original, events_service)
            else:
                if not self._reschedule_recurring_events(
                        updates,
                        original,
                        update_method,
                        events_service
                ):
                    return

        updates.pop('reason', None)
        return self.backend.update(self.datasource, id, updates, original)

    def on_updated(self, updates, original):
        user = get_user(required=True).get(config.ID_FIELD, '')
        session = get_auth().get(config.ID_FIELD, '')

        push_notification(
            'events:rescheduled',
            item=str(original[config.ID_FIELD]),
            user=str(user),
            session=str(session)
        )

    def _reschedule_single_event(self, updates, original, events_service):
        has_plannings = events_service.has_planning_items(original)

        # If the Event is in use, then we will duplicate the original
        # and set the original's status to `rescheduled`
        if has_plannings or 'pubstatus' in original:
            duplicated_event_id = self._duplicate_event(updates, original, events_service)
            duplicates = original.get('duplicate_to', [])
            duplicates.append(duplicated_event_id)
            updates['duplicate_to'] = duplicates

            self._mark_event_rescheduled(updates, original)
            if has_plannings:
                self._reschedule_event_plannings(updates, original)

    def _mark_event_rescheduled(self, updates, original, keep_dates=False):
        definition = '''------------------------------------------------------------
Event Rescheduled
'''

        reason = updates.get('reason', None)
        if reason is not None:
            definition += 'Reason: {}\n'.format(reason)

        if 'definition_long' in original:
            definition = original['definition_long'] + '\n\n' + definition

        # Update the workflow state and definition of the original Event
        updates.update({
            'state': WORKFLOW_STATE.RESCHEDULED,
            'definition_long': definition
        })

        # We don't want to update the schedule of this current event
        # As the duplicated Event will have the new schedule
        if not keep_dates:
            updates.pop('dates', None)

    def _reschedule_event_plannings(self, updates, original, plans=None, state=None):
        planning_service = get_resource_service('planning')
        planning_reschedule_service = get_resource_service('planning_reschedule')
        reason = updates.get('reason', None)

        if plans is None:
            plans = list(planning_service.find(where={'event_item': original[config.ID_FIELD]}))

        plan_updates = {
            'reason': reason,
            'state': state
        }
        for plan in plans:
            updated_plan = planning_reschedule_service.patch(
                plan[config.ID_FIELD],
                plan_updates
            )
            app.on_updated_planning_reschedule(
                updated_plan,
                plan
            )

    def _duplicate_event(self, updates, original, events_service):
        new_event = deepcopy(original)
        new_event.update(updates)

        for f in {'_id', 'guid', 'unique_name', 'unique_id', 'lock_user', 'lock_time',
                  'lock_session', 'lock_action', '_created', '_updated', '_etag', 'pubstatus',
                  'reason', 'duplicate_to'}:
            new_event.pop(f, None)

        new_event[ITEM_STATE] = WORKFLOW_STATE.DRAFT
        new_event['guid'] = generate_guid(type=GUID_NEWSML)
        new_event['_id'] = new_event['guid']
        new_event['duplicate_from'] = original[config.ID_FIELD]
        set_original_creator(new_event)

        created_event = events_service.create([new_event])[0]
        history_service = get_resource_service('events_history')
        history_service.on_reschedule_from(new_event)
        return created_event

    def _reschedule_recurring_events(self, updates, original, update_method, events_service):
        original_deleted = False
        rules_changed = updates['dates']['recurring_rule'] != original['dates']['recurring_rule']
        times_changed = updates['dates']['start'] != original['dates']['start'] or \
            updates['dates']['end'] != original['dates']['end']
        reason = updates.get('reason')

        historic, past, future = events_service.get_recurring_timeline(original)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            rescheduled_events = [original] + future
            new_start_date = updates['dates']['start']
            original_start_date = original['dates']['start']
            original_rule = original['dates']['recurring_rule']
        else:
            rescheduled_events = past + [original] + future

            # Assign the date from the beginning of the new series
            new_start_date = updates['dates']['start']
            original_start_date = past[0]['dates']['start']
            original_rule = past[0]['dates']['recurring_rule']

        updated_rule = deepcopy(updates['dates']['recurring_rule'])
        if updated_rule['endRepeatMode'] == 'count':
            num_events = len(historic) + len(past) + len(future) + 1
            updated_rule['count'] -= num_events - len(rescheduled_events)

        # Compute the difference between start and end in the updated event
        time_delta = updates['dates']['end'] - updates['dates']['start']

        # Generate the dates for the new event series
        new_dates = [date for date in islice(generate_recurring_dates(
            start=new_start_date,
            tz=updates['dates'].get('tz') and pytz.timezone(updates['dates']['tz'] or None),
            date_only=True,
            **updated_rule
        ), 0, 200)]

        # Generate the dates for the original events
        original_dates = [date for date in islice(generate_recurring_dates(
            start=original_start_date,
            tz=original['dates'].get('tz') and pytz.timezone(original['dates']['tz'] or None),
            date_only=True,
            **original_rule
        ), 0, 200)]

        set_next_occurrence(updates)

        dates_processed = []

        # Iterate over the current events in the series and delete/spike
        # or update the event accordingly
        deleted_events = {}
        for event in rescheduled_events:
            if event[config.ID_FIELD] == original[config.ID_FIELD]:
                event_date = updates['dates']['start'].replace(tzinfo=None).date()
            else:
                event_date = event['dates']['start'].replace(tzinfo=None).date()
            # If the event does not occur in the new dates, then we need to either
            # delete or spike this event
            if event_date not in new_dates:
                # Add it to the list of events to delete or spike
                # This is done later so that we can perform a single
                # query against mongo, rather than one per deleted event
                deleted_events[event[config.ID_FIELD]] = event

            # If the date has already been processed, then we should mark this event for deletion
            # This occurs when the selected Event is being updated to an Event that already exists
            # in another Event in the series.
            # This stops multiple Events to occur on the same day
            elif event_date in new_dates and event_date in dates_processed:
                deleted_events[event[config.ID_FIELD]] = event

            # Otherwise this Event does occur in the new dates
            else:
                # Because this Event occurs in the new dates, then we are not to set the state to 'rescheduled',
                # instead we set it to either 'scheduled' (if public) or 'draft' (if not public)
                new_state = WORKFLOW_STATE.SCHEDULED if event.get('pubstatus') else WORKFLOW_STATE.DRAFT

                # If this is the selected Event, then simply update the fields and
                # Reschedule associated Planning items
                if event[config.ID_FIELD] == original[config.ID_FIELD]:
                    self._mark_event_rescheduled(updates, original, True)
                    updates['state'] = new_state
                    self._reschedule_event_plannings(updates, event, state=WORKFLOW_STATE.DRAFT)

                else:
                    new_updates = {'reason': reason}
                    self._mark_event_rescheduled(new_updates, event)
                    new_updates['state'] = new_state

                    # Update the 'start', 'end' and 'recurring_rule' fields of the Event
                    if rules_changed or times_changed:
                        new_updates['state'] = new_state
                        new_updates['dates'] = event['dates']
                        new_updates['dates']['start'] = datetime.combine(event_date, updates['dates']['start'].time())
                        new_updates['dates']['end'] = new_updates['dates']['start'] + time_delta
                        new_updates['dates']['recurring_rule'] = updates['dates']['recurring_rule']
                        set_planning_schedule(new_updates)

                    # And finally update the Event, and Reschedule associated Planning items
                    events_service.patch(event[config.ID_FIELD], new_updates)
                    self._reschedule_event_plannings(new_updates, event, state=WORKFLOW_STATE.DRAFT)
                    app.on_updated_events_reschedule(new_updates, {'_id': event[config.ID_FIELD]})

                # Mark this date as being already processed
                dates_processed.append(event_date)

        # Create new events that do not fall on the original occurrence dates
        new_events = []
        for date in new_dates:
            # If the new date falls on the original occurrences, or if the
            # start date of the selected one, then skip this date occurrence
            if date in original_dates or date in dates_processed:
                continue

            # Create a copy of the metadata to use for the new event
            new_event = deepcopy(original)
            new_event.update(deepcopy(updates))

            # Remove fields not required by the new events
            for key in list(new_event.keys()):
                if key.startswith('_'):
                    new_event.pop(key)
                elif key.startswith('lock_'):
                    new_event.pop(key)

            # Set the new start and end dates, as well as the _id and guid fields
            new_event['dates']['start'] = datetime.combine(date, updates['dates']['start'].time())
            new_event['dates']['end'] = new_event['dates']['start'] + time_delta
            new_event[config.ID_FIELD] = new_event['guid'] = generate_guid(type=GUID_NEWSML)
            new_event.pop('reason', None)
            set_planning_schedule(new_event)

            # And finally add this event to the list of events to be created
            new_events.append(new_event)

        # Now iterate over the new events and create them
        if new_events:
            events_service.create(new_events)
            app.on_inserted_events(new_events)

        # Iterate over the events to delete/spike
        self._set_events_planning(deleted_events)

        for event in deleted_events.values():
            event_plans = event.get('_plans', [])
            is_original = event[config.ID_FIELD] == original[config.ID_FIELD]
            if len(event_plans) > 0 or event.get('pubstatus', None) is not None:
                if is_original:
                    self._mark_event_rescheduled(updates, original)
                else:
                    # This event has Planning items, so spike this event and
                    # all Planning items
                    new_updates = {
                        'skip_on_update': True,
                        'reason': reason
                    }
                    self._mark_event_rescheduled(new_updates, original)
                    self.patch(event[config.ID_FIELD], new_updates)

                if len(event_plans) > 0:
                    self._reschedule_event_plannings(updates, original, event_plans)
            else:
                # This event has no Planning items, therefor we can safely
                # delete this event
                events_service.delete_action(lookup={'_id': event[config.ID_FIELD]})
                app.on_deleted_item_events(event)

                if is_original:
                    original_deleted = True

        return not original_deleted

    def _set_events_planning(self, events):
        planning_service = get_resource_service('planning')

        planning_items = list(planning_service.get_from_mongo(
            req=None, lookup={'event_item': {'$in': list(events.keys())}}
        ))

        for plan in planning_items:
            event = events[plan['event_item']]
            if '_plans' not in event:
                event['_plans'] = []
            event['_plans'].append(plan)
