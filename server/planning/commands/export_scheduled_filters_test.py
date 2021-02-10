# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import datetime
from dateutil.rrule import rrule, HOURLY
import pytz

from flask import current_app as app

from superdesk.utc import local_to_utc

from planning.tests import TestCase
from planning.commands.export_scheduled_filters import ExportScheduledFilters


def to_naive(date_str):
    return datetime.strptime(date_str, '%Y-%m-%dT%H')


def to_utc(date_str):
    return local_to_utc(
        app.config['DEFAULT_TIMEZONE'],
        datetime.strptime(date_str, '%Y-%m-%dT%H')
    )


def to_local(date_str):
    local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
    local_datetime = datetime.strptime(date_str, '%Y-%m-%dT%H')

    return local_tz.localize(local_datetime)


class ExportScheduledFiltersTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
        self.app.config['ADMINS'] = ['superdesk@test.com']

    def _test(self, report, start, end, expected_hits):
        count = 0
        for now in rrule(HOURLY, dtstart=to_naive(start), until=to_naive(end)):
            local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
            now_local = local_tz.localize(now)

            response = ExportScheduledFilters().should_export(report, now_local)
            expected_hits_str = [str(d) for d in expected_hits]

            self.assertEqual(
                response,
                now_local in expected_hits,
                f'{now_local} not in {expected_hits_str}'
            )

            if response:
                # Update the last sent time to now
                report['_last_sent'] = local_to_utc(app.config['DEFAULT_TIMEZONE'], now_local)
                count += 1

        self.assertEqual(len(expected_hits), count)

    def test_send_report_hourly(self):
        # Test every hour
        self._test(
            report={
                'frequency': 'hourly',
                'hour': -1
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local(f'2018-06-30T{hour}') for hour in range(0, 24)]
        )

        # Test every hour, already sent this hour
        self._test(
            report={
                'frequency': 'hourly',
                'hour': -1,
                '_last_sent': to_utc('2018-06-30T13')
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local(f'2018-06-30T{hour}') for hour in range(14, 24)]
        )

    def test_send_report_hour_of_the_day(self):
        # Test exact hour
        self._test(
            report={
                'frequency': 'daily',
                'hour': 10
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T10')]
        )

        # Test exact hour, not sent this hour
        report = {
            'frequency': 'daily',
            'hour': 10,
            '_last_sent': to_local('2018-06-30T09')
        }
        self._test(
            report=report,
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T10')]
        )
        # Test running this day again
        self._test(
            report=report,
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[]
        )

        # Test exact hour, already sent this hour
        self._test(
            report={
                'frequency': 'daily',
                'hour': 10,
                '_last_sent': to_local('2018-06-30T10')
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[]
        )

    def test_send_report_daily(self):
        # Every day at 8am
        self._test(
            report={
                'frequency': 'daily',
                'hour': 8
            },
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local(f'2018-06-{day}T08') for day in range(1, 31)
            ]
        )

    def test_send_report_weekly(self):
        # Every Monday and Wednesday @ 4pm
        self._test(
            report={
                'frequency': 'weekly',
                'hour': 16,
                'week_days': ['Monday', 'Wednesday']
            },
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local('2018-06-04T16'),  # Monday
                to_local('2018-06-06T16'),  # Wednesday
                to_local('2018-06-11T16'),  # Monday
                to_local('2018-06-13T16'),  # Wednesday
                to_local('2018-06-18T16'),  # Monday
                to_local('2018-06-20T16'),  # Wednesday
                to_local('2018-06-25T16'),  # Monday
                to_local('2018-06-27T16'),  # Wednesday
            ]
        )

    def test_send_report_week_days(self):
        # Every Monday->Frday @ 2pm
        self._test(
            report={
                'frequency': 'weekly',
                'hour': 14,
                'week_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            },
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local('2018-06-01T14'),
                to_local('2018-06-04T14'),
                to_local('2018-06-05T14'),
                to_local('2018-06-06T14'),
                to_local('2018-06-07T14'),
                to_local('2018-06-08T14'),
                to_local('2018-06-11T14'),
                to_local('2018-06-12T14'),
                to_local('2018-06-13T14'),
                to_local('2018-06-14T14'),
                to_local('2018-06-15T14'),
                to_local('2018-06-18T14'),
                to_local('2018-06-19T14'),
                to_local('2018-06-20T14'),
                to_local('2018-06-21T14'),
                to_local('2018-06-22T14'),
                to_local('2018-06-25T14'),
                to_local('2018-06-26T14'),
                to_local('2018-06-27T14'),
                to_local('2018-06-28T14'),
                to_local('2018-06-29T14'),
            ]
        )

    def test_send_report_week_ends(self):
        # Every Saturday and Sunday @ 9am
        self._test(
            report={
                'frequency': 'weekly',
                'hour': 9,
                'week_days': ['Saturday', 'Sunday']
            },
            start='2018-06-01T00',
            end='2018-07-01T00',
            expected_hits=[
                to_local('2018-06-02T09'),
                to_local('2018-06-03T09'),
                to_local('2018-06-09T09'),
                to_local('2018-06-10T09'),
                to_local('2018-06-16T09'),
                to_local('2018-06-17T09'),
                to_local('2018-06-23T09'),
                to_local('2018-06-24T09'),
                to_local('2018-06-30T09')
            ]
        )

    def test_send_report_monthly(self):
        self._test(
            report={
                'frequency': 'monthly',
                'hour': 0,
                'day': 1
            },
            start='2018-01-01T00',
            end='2018-12-31T23',
            expected_hits=[
                to_local('2018-01-01T00'),
                to_local('2018-02-01T00'),
                to_local('2018-03-01T00'),
                to_local('2018-04-01T00'),
                to_local('2018-05-01T00'),
                to_local('2018-06-01T00'),
                to_local('2018-07-01T00'),
                to_local('2018-08-01T00'),
                to_local('2018-09-01T00'),
                to_local('2018-10-01T00'),
                to_local('2018-11-01T00'),
                to_local('2018-12-01T00'),
            ]
        )
