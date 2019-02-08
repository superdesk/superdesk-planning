# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import mock
from datetime import timedelta
from .export_to_newsroom import ExportToNewsroom
from superdesk import get_resource_service
from superdesk.utc import utcnow
from planning.tests import TestCase


class MockTransmitter:
    events = []
    planning = []

    def transmit(self, queue_item):
        if queue_item.get('content_type') == 'event':
            self.events.append(queue_item.get('item_id'))
        else:
            self.planning.append(queue_item.get('item_id'))


class ExportToNewsroomTest(TestCase):

    def setUp(self):
        super().setUp()

        self.event_service = get_resource_service('events')
        self.planning_service = get_resource_service('planning')

    def setUp_data(self):
        utc_now = utcnow()
        events = [
            {
                '_id': 'draft',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'draft',
                'type': 'event'
            },
            {
                '_id': 'scheduled',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'scheduled',
                'pubstatus': 'usable',
                'type': 'event'
            },
            {
                '_id': 'postponed',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'postponed',
                'pubstatus': 'usable',
                'type': 'event'
            },
            {
                '_id': 'rescheduled',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'rescheduled',
                'pubstatus': 'usable',
                'type': 'event'
            },
            {
                '_id': 'cancelled',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'cancelled',
                'pubstatus': 'usable',
                'type': 'event'
            },
            {
                '_id': 'killed',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'killed',
                'pubstatus': 'cancelled',
                'type': 'event'
            },
            {
                '_id': 'postponed-not-published',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'postponed',
                'type': 'event'
            },
            {
                '_id': 'rescheduled-not-published',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'rescheduled',
                'type': 'event'
            },
            {
                '_id': 'cancelled-not-published',
                'dates': {
                    'start': utc_now,
                    'end': utc_now + timedelta(days=1),
                    'tx': 'UTC'
                },
                'name': 'event_name',
                'state': 'cancelled',
                'type': 'event'
            },
        ]

        planning = [
            {
                '_id': 'draft',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'draft',
                'type': 'planning'
            },
            {
                '_id': 'scheduled',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'scheduled',
                'pubstatus': 'usable',
                'type': 'planning'
            },
            {
                '_id': 'postponed',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'postponed',
                'pubstatus': 'usable',
                'type': 'planning'
            },
            {
                '_id': 'rescheduled',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'rescheduled',
                'pubstatus': 'usable',
                'type': 'planning'
            },
            {
                '_id': 'cancelled',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'cancelled',
                'pubstatus': 'usable',
                'type': 'planning'
            },
            {
                '_id': 'killed',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'killed',
                'pubstatus': 'cancelled',
                'type': 'planning'
            },
            {
                '_id': 'postponed-not-published',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'postponed',
                'type': 'planning'
            },
            {
                '_id': 'rescheduled-not-published',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'rescheduled',
                'type': 'planning'
            },
            {
                '_id': 'cancelled-not-published',
                'planning_date': utc_now,
                'slugline': 'planning slugline',
                'state': 'cancelled',
                'type': 'planning'
            },
        ]

        self.event_service.create(events)
        self.planning_service.create(planning)

    @mock.patch('planning.commands.export_to_newsroom.NewsroomHTTPTransmitter')
    def test_events_events_planning(self, mock_transmitter):
        with self.app.app_context():
            self.setUp_data()

            mock_transmitter.return_value = MockTransmitter()
            ExportToNewsroom().run(assets_url='foo', resource_url='bar')
            valid_ids = ['scheduled', 'postponed', 'rescheduled']

            for item_id in mock_transmitter.return_value.events:
                self.assertIn(item_id, valid_ids)

            for item_id in mock_transmitter.return_value.planning:
                self.assertIn(item_id, valid_ids)
