# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import datetime
import logging

from flask import current_app as app

from superdesk import Command, command, Option, get_resource_service
from superdesk.utc import utcnow, local_to_utc, utc_to_local
from superdesk.lock import lock, unlock
from superdesk.celery_task_utils import get_lock_id

logger = logging.getLogger(__name__)


class ExportScheduledFilters(Command):
    """Exports scheduled filters to news items

    Example:
    ::

        $ python manage planning:export_scheduled_filters
        $ python manage planning:export_scheduled_filters --now '2021-01-11T15'

    """

    option_list = [
        Option(
            '--now', '-n',
            dest='now',
            required=False,
            help="Local date/hour in the format '%Y-%m-%dT%H', i.e. 2018-09-13T10"
        )
    ]

    def run(self, now=None):
        lock_name = get_lock_id('planning', 'export_scheduled_filters')
        if not lock(lock_name, expire=600):
            logger.info('Export scheduled filters task is already running')
            return

        if now:
            now_utc = now if isinstance(now, datetime) else local_to_utc(
                app.config['DEFAULT_TIMEZONE'],
                datetime.strptime(now, '%Y-%m-%dT%H')
            )
        else:
            now_utc = utcnow()

        now_local = utc_to_local(app.config['DEFAULT_TIMEZONE'], now_utc)

        # Set now to the beginning of the hour (in local time)
        now_local = now_local.replace(
            minute=0,
            second=0,
            microsecond=0
        )

        logger.info(f'Starting to export scheduled filters: {now_utc}')
        self.process_filters(
            self.get_filters_with_schedules(),
            now_local,
            now_utc
        )

        unlock(lock_name)
        logger.info(f'Completed sending scheduled exports: {now_utc}')

    def process_filters(self, filters, now_local, now_utc):
        if not filters.count():
            logger.info('No enabled filter schedules found, not continuing')
            return

        for search_filter in filters:
            for schedule in search_filter.get('schedules') or []:
                try:
                    self.export_filter(search_filter, schedule, now_local, now_utc)
                except Exception as err:
                    search_filter_id = search_filter['_id']
                    logger.error(f'Failed to export filter {search_filter_id}')
                    logger.exception(err)

            # Update the DB for _last_sent of all schedules for this filter
            get_resource_service('events_planning_filters').system_update(
                search_filter['_id'],
                {'schedules': search_filter['schedules']},
                search_filter
            )

    def export_filter(self, search_filter, schedule, now_local, now_utc):
        if not self.should_export(schedule, now_local):
            return

        search_filter_id = search_filter['_id']
        logger.info(f'Attempting to export filter {search_filter_id}')
        self._export_filter(search_filter, schedule)

        # Update the _last_sent of the schedule
        schedule['_last_sent'] = now_utc

    def get_filters_with_schedules(self):
        return get_resource_service('events_planning_filters').get(
            req=None,
            lookup={'schedules': {'$exists': True, '$ne': []}}
        )

    def should_export(self, schedule, now_local):
        last_sent = None
        if schedule.get('_last_sent'):
            last_sent = utc_to_local(
                app.config['DEFAULT_TIMEZONE'],
                schedule['_last_sent']
            ).replace(
                minute=0,
                second=0,
                microsecond=0
            )

        schedule_hour = schedule.get('hour', -1)
        schedule_day = schedule.get('day', -1)
        schedule_week_days = schedule.get('week_days') or []

        # Is this export to be run today (Day of the month)?
        # -1 = every day
        if schedule_day > -1 and schedule_day != now_local.day:
            return False

        # Is this export to be run on this week day (i.e. Monday, Wednesday etc)?
        # None or [] = every week day
        week_day = now_local.strftime('%A')
        if len(schedule_week_days) > 0 and week_day not in schedule_week_days:
            return False

        # Is this export to be run on this hour (i.e. 8am)
        # -1 = every hour
        if schedule_hour > -1 and schedule_hour != now_local.hour:
            return False

        # This export has not been run on this hour
        if last_sent is not None and now_local <= last_sent:
            return False

        return True

    def _export_filter(self, search_filter, schedule):
        items = get_resource_service('events_planning_search').search_by_filter_id(
            search_filter['_id'],
            projections=['_id']
        )

        if not items.count():
            search_filter_id = search_filter['_id']
            logger.info(f'No items found for filter {search_filter_id}')
            return

        get_resource_service('planning_article_export').post([{
            'items': [
                item['_id']
                for item in items
            ],
            'desk': schedule.get('desk'),
            'template': schedule.get('template'),
            'article_template': schedule.get('article_template'),
            'type': 'event' if search_filter['item_type'] == 'events' else search_filter['item_type']
        }])


command('planning:export_scheduled_filters', ExportScheduledFilters())
