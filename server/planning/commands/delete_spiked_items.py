# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import current_app as app
from superdesk import Command, command, get_resource_service
from superdesk.logging import logger
from superdesk.utc import utcnow
from superdesk.celery_task_utils import get_lock_id
from superdesk.lock import lock, unlock, remove_locks
from datetime import timedelta
from eve.utils import config
from planning.common import WORKFLOW_STATE


class DeleteSpikedItems(Command):
    """
    Delete expired spiked `Events` and `Planning` items.

    Example:
    ::

        $ python manage.py planning:delete_spiked

    """

    log_msg = ''

    def run(self):
        now = utcnow()
        self.log_msg = 'Delete Spiked Items Time: {}.'.format(now)
        logger.info('{} Starting to delete spiked items at.'.format(self.log_msg))

        expire_interval = app.config.get('PLANNING_DELETE_SPIKED_MINUTES', 0)
        if expire_interval == 0:
            logger.info('{} PLANNING_DELETE_SPIKED_MINUTES=0, not spiking any items')
            return

        lock_name = get_lock_id('planning', 'delete_spiked')
        if not lock(lock_name, expire=610):
            logger.info('{} Delete spiked items task is already running'.format(self.log_msg))
            return

        expiry_datetime = now - timedelta(minutes=expire_interval)

        try:
            self._delete_spiked_events(expiry_datetime)
        except Exception as e:
            logger.exception(e)

        try:
            self._delete_spiked_planning(expiry_datetime)
        except Exception as e:
            logger.exception(e)

        unlock(lock_name)

        logger.info('{} Completed deleting spiked items.'.format(self.log_msg))
        remove_locks()

    def _delete_spiked_events(self, expiry_datetime):
        logger.info('{} Starting to delete spiked events'.format(self.log_msg))
        events_service = get_resource_service('events')

        events_deleted = set()
        series_to_delete = dict()

        # Obtain the full list of Events that we're to process first
        # As subsequent queries will change the list of returned items
        events = dict()
        for items in events_service.get_expired_items(expiry_datetime, spiked_events_only=True):
            events.update({item[config.ID_FIELD]: item for item in items})

        for event_id, event in events.items():
            if event.get('recurrence_id') and event['recurrence_id'] not in series_to_delete:
                spiked, events = self.is_series_expired_and_spiked(event, expiry_datetime)
                if spiked:
                    series_to_delete[event['recurrence_id']] = events
            else:
                events_service.delete_action(lookup={'_id': event_id})
                events_deleted.add(event_id)

        # Delete recurring series
        for recurrence_id, events in series_to_delete.items():
            events_service.delete_action(lookup={'recurrence_id': recurrence_id})
            events_deleted.add(events)

        logger.info('{} {} Events deleted: {}'.format(self.log_msg, len(events_deleted), list(events_deleted)))

    def is_series_expired_and_spiked(self, event, expiry_datetime):
        historic, past, future = get_resource_service('events').get_recurring_timeline(event, spiked=True)

        # There are future events, so the entire series is not expired.
        if len(future) > 0:
            return False

        def check_series_expired_and_spiked(series):
            for event in series:
                if event.get('state') != WORKFLOW_STATE.SPIKED or event['dates']['end'] > expiry_datetime:
                    return False

            return True

        if check_series_expired_and_spiked(historic) and check_series_expired_and_spiked(past):
            return True, [historic + past]

        return False

    def _delete_spiked_planning(self, expiry_datetime):
        logger.info('{} Starting to delete spiked planning items'.format(self.log_msg))
        planning_service = get_resource_service('planning')

        # Obtain the full list of Planning items that we're to process first
        # As subsequent queries will change the list of returnd items
        plans = dict()
        for items in planning_service.get_expired_items(expiry_datetime, spiked_planning_only=True):
            plans.update({item[config.ID_FIELD]: item for item in items})

        plans_deleted = set()
        assignments_deleted = set()
        assignments_to_delete = []

        for plan_id, plan in plans.items():
            for coverage in plan.get('coverages') or []:
                assignment_id = (coverage.get('assigned_to') or {}).get('assignment_id')
                if assignment_id:
                    assignments_to_delete.append(assignment_id)

            # Now, delete the planning item
            planning_service.delete_action(lookup={'_id': plan_id})
            plans_deleted.add(plan_id)

        # Delete assignments
        assignment_service = get_resource_service('assignments')
        for assign_id in assignments_to_delete:
            assignment_service.delete(lookup={'_id': assign_id})
            assignments_deleted.add(assign_id)

        logger.info('{} {} Assignments deleted: {}'.format(self.log_msg,
                                                           len(assignments_deleted),
                                                           list(assignments_deleted)))
        logger.info('{} {} Planning items deleted: {}'.format(self.log_msg, len(plans_deleted), list(plans_deleted)))


command('planning:delete_spiked', DeleteSpikedItems())
