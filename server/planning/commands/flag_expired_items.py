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
from superdesk.notification import push_notification
from datetime import timedelta, datetime
from eve.utils import config
from bson.objectid import ObjectId


class FlagExpiredItems(Command):
    """
    Flag expired `Events` and `Planning` items with `{'expired': True}`.

    Example:
    ::

        $ python manage.py planning:flag_expired

    """

    log_msg = ''

    def run(self):
        now = utcnow()
        self.log_msg = 'Expiry Time: {}.'.format(now)
        logger.info('{} Starting to remove expired content at.'.format(self.log_msg))

        expire_interval = app.config.get('PLANNING_EXPIRY_MINUTES', 0)
        if expire_interval == 0:
            logger.info('{} PLANNING_EXPIRY_MINUTES=0, not flagging items as expired')
            return

        lock_name = get_lock_id('planning', 'flag_expired')
        if not lock(lock_name, expire=610):
            logger.info('{} Flag expired items task is already running'.format(self.log_msg))
            return

        expiry_datetime = now - timedelta(minutes=expire_interval)

        try:
            self._flag_expired_events(expiry_datetime)
        except Exception as e:
            logger.exception(e)

        try:
            self._flag_expired_planning(expiry_datetime)
        except Exception as e:
            logger.exception(e)

        unlock(lock_name)

        logger.info('{} Completed flagging expired items.'.format(self.log_msg))
        remove_locks()
        logger.info('{} Starting to remove expired planning versions.'.format(self.log_msg))
        self._remove_expired_published_planning()
        logger.info('{} Completed removing expired planning versions.'.format(self.log_msg))

    def _flag_expired_events(self, expiry_datetime):
        logger.info('{} Starting to flag expired events'.format(self.log_msg))
        events_service = get_resource_service('events')
        planning_service = get_resource_service('planning')

        locked_events = set()
        events_in_use = set()
        events_expired = set()
        plans_expired = set()

        # Obtain the full list of Events that we're to process first
        # As subsequent queries will change the list of returned items
        events = dict()
        for items in events_service.get_expired_items(expiry_datetime):
            events.update({item[config.ID_FIELD]: item for item in items})

        self._set_event_plans(events)

        for event_id, event in events.items():
            if event.get('lock_user'):
                locked_events.add(event_id)
            elif self._get_event_schedule(event) > expiry_datetime:
                events_in_use.add(event_id)
            else:
                events_expired.add(event_id)
                events_service.system_update(event_id, {'expired': True}, event)
                for plan in event.get('_plans', []):
                    plan_id = plan[config.ID_FIELD]
                    planning_service.system_update(plan_id, {'expired': True}, plan)
                    plans_expired.add(plan_id)

        if len(locked_events) > 0:
            logger.info('{} Skipping {} locked Events: {}'.format(
                self.log_msg,
                len(locked_events),
                list(locked_events)
            ))

        if len(events_in_use) > 0:
            logger.info('{} Skipping {} Events in use: {}'.format(
                self.log_msg,
                len(events_in_use),
                list(events_in_use)
            ))

        if len(events_expired) > 0:
            push_notification(
                'events:expired',
                items=list(events_expired)
            )

        if len(plans_expired) > 0:
            push_notification(
                'planning:expired',
                items=list(plans_expired)
            )

        logger.info('{} {} Events expired: {}'.format(self.log_msg, len(events_expired), list(events_expired)))

    def _flag_expired_planning(self, expiry_datetime):
        logger.info('{} Starting to flag expired planning items'.format(self.log_msg))
        planning_service = get_resource_service('planning')

        # Obtain the full list of Planning items that we're to process first
        # As subsequent queries will change the list of returnd items
        plans = dict()
        for items in planning_service.get_expired_items(expiry_datetime):
            plans.update({item[config.ID_FIELD]: item for item in items})

        locked_plans = set()
        plans_expired = set()

        for plan_id, plan in plans.items():
            if plan.get('lock_user'):
                locked_plans.add(plan_id)
            else:
                planning_service.system_update(plan[config.ID_FIELD], {'expired': True}, plan)
                plans_expired.add(plan_id)

        if len(locked_plans) > 0:
            logger.info('{} Skipping {} locked Planning items: {}'.format(
                self.log_msg,
                len(locked_plans),
                list(locked_plans)
            ))

        if len(plans_expired) > 0:
            push_notification(
                'planning:expired',
                items=list(plans_expired)
            )

        logger.info('{} {} Planning items expired: {}'.format(self.log_msg, len(plans_expired), list(plans_expired)))

    @staticmethod
    def _set_event_plans(events):
        planning_service = get_resource_service('planning')

        for plan in planning_service.get_from_mongo(req=None, lookup={'event_item': {'$in': list(events.keys())}}):
            event = events[plan['event_item']]
            if '_plans' not in event:
                event['_plans'] = []
            event['_plans'].append(plan)

    @staticmethod
    def _get_event_schedule(event):
        latest_scheduled = datetime.strptime(event['dates']['end'], '%Y-%m-%dT%H:%M:%S%z')
        for plan in event.get('_plans', []):
            # First check the Planning item's planning date
            # and compare to the Event's end date
            if latest_scheduled < plan.get('planning_date', latest_scheduled):
                latest_scheduled = plan.get('planning_date')

            # Next go through all the coverage's scheduled dates
            # and compare to the latest scheduled date
            for planning_schedule in plan.get('_planning_schedule', []):
                scheduled = planning_schedule.get('scheduled')
                if scheduled and isinstance(scheduled, str):
                    scheduled = datetime.strptime(planning_schedule.get('scheduled'), '%Y-%m-%dT%H:%M:%S%z')

                if scheduled and (latest_scheduled < scheduled):
                    latest_scheduled = scheduled

        # Finally return the latest scheduled date among the Event, Planning and Coverages
        return latest_scheduled

    @staticmethod
    def _remove_expired_published_planning():
        """Expire planning versions

        Expiry of the planning versions mirrors the expiry of items within the publish queue in Superdesk so it uses the
        same configuration value

        :param self:
        :return:
        """
        expire_interval = app.config.get('PUBLISH_QUEUE_EXPIRY_MINUTES', 0)
        if expire_interval:
            expire_time = utcnow() - timedelta(minutes=expire_interval)
            logger.info('Removing planning history items created before {}'.format(str(expire_time)))

            get_resource_service('published_planning').delete({'_id': {'$lte': ObjectId.from_datetime(expire_time)}})


command('planning:flag_expired', FlagExpiredItems())
