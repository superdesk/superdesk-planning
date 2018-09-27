# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .flag_expired_items import FlagExpiredItems
from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow
from datetime import timedelta
from bson.objectid import ObjectId

now = utcnow()
yesterday = now - timedelta(hours=48)

active = {
    'event': {'dates': {'start': now - timedelta(hours=1), 'end': now}},
    'overnightEvent': {'dates': {'start': yesterday, 'end': now}},
    'plan': {'planning_date': now},
    'coverage': {'planning': {'scheduled': now}}
}

expired = {
    'event': {'dates': {'start': yesterday, 'end': yesterday + timedelta(hours=1)}},
    'plan': {'planning_date': yesterday},
    'coverage': {'planning': {'scheduled': yesterday}}
}


class FlagExpiredItemsTest(TestCase):
    def setUp(self):
        super().setUp()

        # Expire items that are scheduled more than 24 hours from now
        self.app.config.update({'PLANNING_EXPIRY_MINUTES': 1440})

        self.event_service = get_resource_service('events')
        self.planning_service = get_resource_service('planning')

    def assertExpired(self, item_type, results):
        service = self.event_service if item_type == 'events' else self.planning_service

        for item_id, result in results.items():
            item = service.find_one(_id=item_id, req=None)
            self.assertIsNotNone(item)
            self.assertEqual(item.get('expired', False), result)

    def insert(self, item_type, items):
        service = self.event_service if item_type == 'events' else self.planning_service
        service.post(items)

    def test_expire_disabled(self):
        self.app.config.update({'PLANNING_EXPIRY_MINUTES': 0})

        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **active['event']},
                {'guid': 'e2', **active['overnightEvent']},
                {'guid': 'e3', **expired['event']}
            ])
            self.insert('planning', [
                {'guid': 'p1', **active['plan'], 'coverages': []},

                {'guid': 'p2', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p3', **active['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p4', **active['plan'], 'coverages': [active['coverage'], expired['coverage']]},

                {'guid': 'p5', **expired['plan'], 'coverages': []},

                {'guid': 'p6', **expired['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p7', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p8', **expired['plan'], 'coverages': [active['coverage'], expired['coverage']]}
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': False,
                'e2': False,
                'e3': False
            })

            self.assertExpired('planning', {
                'p1': False,
                'p2': False,
                'p3': False,
                'p4': False,
                'p5': False,
                'p6': False,
                'p7': False,
                'p8': False,
            })

    def test_event(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **active['event']},
                {'guid': 'e2', **active['overnightEvent']},
                {'guid': 'e3', **expired['event']}
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': False,
                'e2': False,
                'e3': True
            })

    def test_planning(self):
        with self.app.app_context():
            self.insert('planning', [
                {'guid': 'p1', **active['plan'], 'coverages': []},

                {'guid': 'p2', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p3', **active['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p4', **active['plan'], 'coverages': [active['coverage'], expired['coverage']]},

                {'guid': 'p5', **expired['plan'], 'coverages': []},

                {'guid': 'p6', **expired['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p7', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p8', **expired['plan'], 'coverages': [active['coverage'], expired['coverage']]},
            ])
            FlagExpiredItems().run()

            self.assertExpired('planning', {
                'p1': False,
                'p2': False,
                'p3': False,
                'p4': False,
                'p5': True,
                'p6': False,
                'p7': True,
                'p8': False,
            })

    def test_event_with_single_planning_no_coverages(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **active['event']},
                {'guid': 'e2', **expired['event']},
                {'guid': 'e3', **active['event']},
                {'guid': 'e4', **expired['event']}
            ])

            self.insert('planning', [
                {'guid': 'p1', 'event_item': 'e1', **active['plan']},
                {'guid': 'p2', 'event_item': 'e2', **active['plan']},
                {'guid': 'p3', 'event_item': 'e3', **expired['plan']},
                {'guid': 'p4', 'event_item': 'e4', **expired['plan']}
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': False,
                'e2': False,
                'e3': False,
                'e4': True
            })

            self.assertExpired('planning', {
                'p1': False,
                'p2': False,
                'p3': False,
                'p4': True
            })

    def test_event_with_single_planning_single_coverage(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **active['event']},
                {'guid': 'e2', **active['event']},
                {'guid': 'e3', **active['event']},
                {'guid': 'e4', **active['event']},

                {'guid': 'e5', **expired['event']},
                {'guid': 'e6', **expired['event']},
                {'guid': 'e7', **expired['event']},
                {'guid': 'e8', **expired['event']},
            ])

            self.insert('planning', [
                {'guid': 'p1', 'event_item': 'e1', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p2', 'event_item': 'e2', **expired['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p3', 'event_item': 'e3', **active['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p4', 'event_item': 'e4', **expired['plan'], 'coverages': [expired['coverage']]},

                {'guid': 'p5', 'event_item': 'e5', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p6', 'event_item': 'e6', **expired['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p7', 'event_item': 'e7', **active['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p8', 'event_item': 'e8', **expired['plan'], 'coverages': [expired['coverage']]},
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': False,
                'e2': False,
                'e3': False,
                'e4': False,
                'e5': False,
                'e6': False,
                'e7': False,
                'e8': True
            })

            self.assertExpired('planning', {
                'p1': False,
                'p2': False,
                'p3': False,
                'p4': False,
                'p5': False,
                'p6': False,
                'p7': False,
                'p8': True
            })

    def test_event_with_single_planning_multiple_coverages(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e01', **active['event']},
                {'guid': 'e02', **active['event']},
                {'guid': 'e03', **active['event']},
                {'guid': 'e04', **active['event']},
                {'guid': 'e05', **active['event']},
                {'guid': 'e06', **active['event']},
                {'guid': 'e07', **active['event']},
                {'guid': 'e08', **expired['event']},
                {'guid': 'e09', **expired['event']},
                {'guid': 'e10', **expired['event']},
                {'guid': 'e11', **expired['event']},
                {'guid': 'e12', **expired['event']},
                {'guid': 'e13', **expired['event']},
                {'guid': 'e14', **expired['event']},
            ])

            self.insert('planning', [
                {'guid': 'p01', 'event_item': 'e01', **active['plan'], 'coverages':  # AAA
                    [active['coverage'], active['coverage']]},
                {'guid': 'p02', 'event_item': 'e02', **expired['plan'], 'coverages':  # EAA
                    [active['coverage'], active['coverage']]},
                {'guid': 'p03', 'event_item': 'e03', **active['plan'], 'coverages':  # AEA
                    [expired['coverage'], active['coverage']]},
                {'guid': 'p04', 'event_item': 'e04', **active['plan'], 'coverages':  # AAE
                    [active['coverage'], expired['coverage']]},
                {'guid': 'p05', 'event_item': 'e05', **expired['plan'], 'coverages':  # EEA
                    [expired['coverage'], active['coverage']]},
                {'guid': 'p06', 'event_item': 'e06', **expired['plan'], 'coverages':  # EAE
                    [active['coverage'], expired['coverage']]},
                {'guid': 'p07', 'event_item': 'e07', **expired['plan'], 'coverages':  # EEE
                    [expired['coverage'], expired['coverage']]},

                {'guid': 'p08', 'event_item': 'e08', **active['plan'], 'coverages':  # AAA
                    [active['coverage'], active['coverage']]},
                {'guid': 'p09', 'event_item': 'e09', **expired['plan'], 'coverages':  # EAA
                    [active['coverage'], active['coverage']]},
                {'guid': 'p10', 'event_item': 'e10', **active['plan'], 'coverages':  # AEA
                    [expired['coverage'], active['coverage']]},
                {'guid': 'p11', 'event_item': 'e11', **active['plan'], 'coverages':  # AAE
                    [active['coverage'], expired['coverage']]},
                {'guid': 'p12', 'event_item': 'e12', **expired['plan'], 'coverages':  # EEA
                    [expired['coverage'], active['coverage']]},
                {'guid': 'p13', 'event_item': 'e13', **expired['plan'], 'coverages':  # EAE
                    [active['coverage'], expired['coverage']]},
                {'guid': 'p14', 'event_item': 'e14', **expired['plan'], 'coverages':  # EEE
                    [expired['coverage'], expired['coverage']]},
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e01': False,
                'e02': False,
                'e03': False,
                'e04': False,
                'e05': False,
                'e06': False,
                'e07': False,
                'e08': False,
                'e09': False,
                'e10': False,
                'e11': False,
                'e12': False,
                'e13': False,
                'e14': True,
            })

            self.assertExpired('planning', {
                'p01': False,
                'p02': False,
                'p03': False,
                'p04': False,
                'p05': False,
                'p06': False,
                'p07': False,
                'p08': False,
                'p09': False,
                'p10': False,
                'p11': False,
                'p12': False,
                'p13': False,
                'p14': True
            })

    def test_event_with_multiple_planning(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **active['event']},
                {'guid': 'e2', **active['event']},
                {'guid': 'e3', **active['event']},
                {'guid': 'e4', **active['event']},

                {'guid': 'e5', **expired['event']},
                {'guid': 'e6', **expired['event']},
                {'guid': 'e7', **expired['event']},
                {'guid': 'e8', **expired['event']},
            ])

            self.insert('planning', [
                {'guid': 'p01', 'event_item': 'e1', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p02', 'event_item': 'e1', **active['plan'], 'coverages': [active['coverage']]},

                {'guid': 'p03', 'event_item': 'e2', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p04', 'event_item': 'e2', **active['plan'], 'coverages': [active['coverage']]},

                {'guid': 'p05', 'event_item': 'e3', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p06', 'event_item': 'e3', **expired['plan'], 'coverages': [expired['coverage']]},

                {'guid': 'p07', 'event_item': 'e4', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p08', 'event_item': 'e4', **expired['plan'], 'coverages': [expired['coverage']]},

                {'guid': 'p09', 'event_item': 'e5', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p10', 'event_item': 'e5', **active['plan'], 'coverages': [active['coverage']]},

                {'guid': 'p11', 'event_item': 'e6', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p12', 'event_item': 'e6', **active['plan'], 'coverages': [active['coverage']]},

                {'guid': 'p13', 'event_item': 'e7', **active['plan'], 'coverages': [active['coverage']]},
                {'guid': 'p14', 'event_item': 'e7', **expired['plan'], 'coverages': [expired['coverage']]},

                {'guid': 'p15', 'event_item': 'e8', **expired['plan'], 'coverages': [expired['coverage']]},
                {'guid': 'p16', 'event_item': 'e8', **expired['plan'], 'coverages': [expired['coverage']]},
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': False,
                'e2': False,
                'e3': False,
                'e4': False,
                'e5': False,
                'e6': False,
                'e7': False,
                'e8': True
            })

            self.assertExpired('planning', {
                'p01': False,
                'p02': False,
                'p03': False,
                'p04': False,
                'p05': False,
                'p06': False,
                'p07': False,
                'p08': False,
                'p09': False,
                'p10': False,
                'p11': False,
                'p12': False,
                'p13': False,
                'p14': False,
                'p15': True,
                'p16': True,
            })

    def test_bad_event_schedule(self):
        with self.app.app_context():
            self.insert('events', [
                {'guid': 'e1', **expired['event'], '_plans': [{'_planning_schedule': [{'scheduled': None}]}]}
            ])
            FlagExpiredItems().run()

            self.assertExpired('events', {
                'e1': True,
            })

    def test_published_planning_expiry(self):
        with self.app.app_context():
            self.app.config.update({'PUBLISH_QUEUE_EXPIRY_MINUTES': 1440})
            self.app.data.insert('published_planning', [
                {
                    '_id': ObjectId('5b30565a1d41c89f550c435f'),
                    'published_item': {
                    },
                    'item_id': 'urn:newsml:localhost:2018-06-25T11:43:44.511050:f292ab66-9df4-47db-80b1-0f58fd37bf9c',
                    'version': 6366549127730893,
                    'type': 'event'
                },
                {
                    'published_item': {
                    },
                    'type': 'planning',
                    'version': 6366575615196523,
                    'item_id': 'urn:newsml:localhost:2018-06-28T11:50:31.055283:21cb4c6d-42c9-4183-bb02-212cda2fb5a2'
                }
            ])
            FlagExpiredItems().run()
            version_entries = get_resource_service('published_planning').get(req=None, lookup={})
            self.assertEqual(1, version_entries.count())
