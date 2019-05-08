# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import json
from datetime import datetime
from flask import request
from eve.utils import config, ParsedRequest

from superdesk.errors import SuperdeskApiError
from superdesk.services import BaseService
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.utc import utcnow
from apps.auth import get_user_id
from apps.archive.common import get_auth

from planning.common import UPDATE_SINGLE, WORKFLOW_STATE, get_max_recurrent_events, update_post_item, \
    set_ingested_event_state, is_valid_event_planning_reason
from planning.item_lock import LOCK_USER, LOCK_SESSION, LOCK_ACTION


class EventsBaseService(BaseService):
    """
    Base class for Event action endpoints

    Provides common functionality to be used for event actions.
    Implement `update_single_event` and `update_recurring_events` based on the
    type of event that is being actioned against.
    """

    ACTION = ''
    REQUIRE_LOCK = True

    def on_update(self, updates, original):
        """
        Process the action on the event provided

        Automatically sets the `version_creator`, then calls the appropriate method
        for single event (`update_single_event`) or a series of events (`update_recurring_events`)
        """
        user_id = get_user_id()
        if user_id:
            updates['version_creator'] = user_id
            set_ingested_event_state(updates, original)

        # If `skip_on_update` is provided in the updates
        # Then return here so no further processing is performed on this event.
        if 'skip_on_update' in updates:
            return

        # We only validate the original event,
        # not the events that are automatically updated by the system
        self.validate(updates, original)

        # Run the specific method based on if the original is a single or a series of recurring events
        # Or if the 'update_method' is 'UPDATE_SINGLE'
        update_method = self.get_update_method(original, updates)
        if update_method == UPDATE_SINGLE:
            self.update_single_event(updates, original)
        else:
            self.update_recurring_events(updates, original, update_method)

    @staticmethod
    def get_update_method(event, updates):
        update_method = updates.pop('update_method', UPDATE_SINGLE)

        # If the Event is not a recurring series, then we can only update a single event
        if not event.get('dates', {}).get('recurring_rule', None):
            return UPDATE_SINGLE

        # Otherwise we return the update_method supplied
        return update_method

    def update(self, id, updates, original):
        """
        Save the changes to the backend.

        If `_deleted` is in the updates, then don't save the changes for this item.
        This is used when updating a series of events where the selected Event is
        deleted and a new series is generated
        """
        # If this Event has been deleted, then do not perform the update
        if '_deleted' in updates:
            return

        updates.pop('update_method', None)
        updates.pop('skip_on_update', None)
        return self.backend.update(self.datasource, id, updates, original)

    def on_updated(self, updates, original):
        # Because we require the original item being actioned against to be locked
        # then we can check the lock information of original and updates to check if this
        # event was the original event.
        if self.is_original_event(original):
            # Send a notification if the LOCK has been removed as a result of the update
            if original.get('lock_user') and 'lock_user' in updates and updates.get('lock_user') is None:
                push_notification(
                    'events:unlock',
                    item=str(original.get(config.ID_FIELD)),
                    user=str(get_user_id()),
                    lock_session=str(get_auth().get('_id')),
                    etag=updates.get('_etag'),
                    recurrence_id=original.get('recurrence_id') or None
                )

            self.push_notification(
                self.ACTION,
                updates,
                original
            )

        update_post_item(updates, original)

    def update_single_event(self, updates, original):
        pass

    def update_recurring_events(self, updates, original, update_method):
        pass

    def validate(self, updates, original):
        """
        Generic validation for event actions

        A lock must be held by the user in their current session
        As well as the lock must solely be for the action being processed,
        i.e. lock_action='update_time'
        """
        if not original:
            raise SuperdeskApiError.notFoundError()

        if not is_valid_event_planning_reason(updates, original):
            raise SuperdeskApiError.badRequestError(message='Reason is required field.')

        if original.get('state') == WORKFLOW_STATE.CANCELLED:
            raise SuperdeskApiError.forbiddenError(message='Aborted. Event is already cancelled')

        if self.REQUIRE_LOCK:
            user_id = get_user_id()
            session_id = get_auth().get(config.ID_FIELD, None)

            lock_user = original.get(LOCK_USER, None)
            lock_session = original.get(LOCK_SESSION, None)
            lock_action = original.get(LOCK_ACTION, None)

            if not lock_user:
                raise SuperdeskApiError.forbiddenError(message='The event must be locked')
            elif str(lock_user) != str(user_id):
                raise SuperdeskApiError.forbiddenError(message='The event is locked by another user')
            elif str(lock_session) != str(session_id):
                raise SuperdeskApiError.forbiddenError(message='The event is locked by you in another session')
            elif str(lock_action) != self.ACTION:
                raise SuperdeskApiError.forbiddenError(
                    message='The lock must be for the `{}` action'.format(self.ACTION.lower().replace('_', ' '))
                )

        get_resource_service('events').validate_event(updates, original)

    @staticmethod
    def set_planning_schedule(event):
        if event and event.get('dates') and event['dates'].get('start'):
            event['_planning_schedule'] = [
                {'scheduled': event['dates']['start']}
            ]

    @staticmethod
    def push_notification(name, updates, original):
        session = get_auth().get(config.ID_FIELD, '')

        data = {
            'item': str(original.get(config.ID_FIELD)),
            'user': str(updates.get('version_creator', '')),
            'session': str(session)
        }

        if original.get('dates', {}).get('recurring_rule', None):
            data['recurrence_id'] = str(updates.get('recurrence_id', original.get('recurrence_id', '')))
            name += ':recurring'

        push_notification(
            'events:' + name,
            **data
        )

    def get_series(self, query, sort, max_results):
        page = 1

        while True:
            # Get the results from mongo
            req = ParsedRequest()
            req.sort = sort
            req.where = json.dumps(query)
            req.max_results = max_results
            req.page = page
            results = self.get_from_mongo(req=req, lookup=None)

            docs = list(results)
            if not docs:
                break

            page += 1

            # Yield the results for iteration by the callee
            for doc in docs:
                yield doc

    def get_recurring_timeline(self, selected, spiked=False, rescheduled=False, cancelled=False, postponed=False):
        """Utility method to get all events in the series

        This splits up the series of events into 3 separate arrays.
        Historic: event.dates.start < utcnow()
        Past: utcnow() < event.dates.start < selected.dates.start
        Future: event.dates.start > selected.dates.start
        """
        excluded_states = []

        if not spiked:
            excluded_states.append(WORKFLOW_STATE.SPIKED)
        if not rescheduled:
            excluded_states.append(WORKFLOW_STATE.RESCHEDULED)
        if not cancelled:
            excluded_states.append(WORKFLOW_STATE.CANCELLED)
        if not postponed:
            excluded_states.append(WORKFLOW_STATE.POSTPONED)

        query = {
            '$and': [
                {'recurrence_id': selected['recurrence_id']},
                {'_id': {'$ne': selected[config.ID_FIELD]}}
            ]
        }

        if excluded_states:
            query['$and'].append({'state': {'$nin': excluded_states}})

        sort = '[("dates.start", 1)]'
        max_results = get_max_recurrent_events()
        selected_start = selected.get('dates', {}).get('start', utcnow())

        # Make sure we are working with a datetime instance
        if not isinstance(selected_start, datetime):
            selected_start = datetime.strptime(selected_start, '%Y-%m-%dT%H:%M:%S%z')

        historic = []
        past = []
        future = []

        for event in self.get_series(query, sort, max_results):
            event['dates']['end'] = event['dates']['end']
            event['dates']['start'] = event['dates']['start']
            for sched in event.get('_planning_schedule', []):
                sched['scheduled'] = sched['scheduled']
            end = event['dates']['end']
            start = event['dates']['start']
            if end < utcnow():
                historic.append(event)
            elif start < selected_start:
                past.append(event)
            elif start > selected_start:
                future.append(event)

        return historic, past, future

    @staticmethod
    def get_plannings_for_event(event):
        return get_resource_service('planning').find(where={
            'event_item': event[config.ID_FIELD]
        })

    @staticmethod
    def has_planning_items(doc):
        return EventsBaseService.get_plannings_for_event(doc).count() > 0

    @staticmethod
    def is_event_in_use(event):
        return EventsBaseService.has_planning_items(event) or (event.get('pubstatus') or '') != ''

    @staticmethod
    def is_original_event(original):
        # Check Flask's URL params if the ID matches the one provided here
        return original.get(config.ID_FIELD) == request.view_args.get(config.ID_FIELD)

    @staticmethod
    def _set_events_planning(events):
        planning_service = get_resource_service('planning')

        planning_items = list(planning_service.get_from_mongo(
            req=None, lookup={'event_item': {'$in': list(events.keys())}}
        ))

        for plan in planning_items:
            event = events[plan['event_item']]
            if '_plans' not in event:
                event['_plans'] = []
            event['_plans'].append(plan)

    @staticmethod
    def remove_fields(new_event, extra_fields=None):
        """Remove fields not required by new event"""
        for f in {'_id', 'guid', 'unique_name', 'unique_id', 'lock_user', 'lock_time',
                  'lock_session', 'lock_action', '_created', '_updated', '_etag', 'pubstatus',
                  'reason', 'duplicate_to', 'duplicate_from', 'reschedule_to', 'actioned_date'}:
            new_event.pop(f, None)

        if extra_fields:
            for f in extra_fields:
                new_event.pop(f, None)
