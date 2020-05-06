# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning.tests import TestCase
from .planning_notifications import PlanningNotifications
from unittest import mock


class MockSlack():

    api_call_OK = True

    def api_call(self, method, **pars):
        self.api_call_OK = True
        if method == 'chat.postMessage':
            if pars.get('channel') == 'news':
                if pars.get('text') != 'hello world by Unknown':
                    return {'ok': False}
            elif pars.get('channel') == 'EFGH':
                if pars.get('text') != 'hello user from world by Unknown':
                    return {'ok': False}
            return {'ok': True}
        elif method == 'users.list':
            return {'ok': True, 'members': [{'name': 'foo', 'id': 'ABCD'}]}
        elif method == 'conversations.open':
            return {'ok': True, 'channel': {'id': 'EFGH'}}


class NotificationTests(TestCase):

    def setUp(self):
        super().setUp()

        self.user_ids = self.app.data.insert('users', [{'username': 'foo', 'display_name': 'Foo Bar',
                                                        "user_preferences": {"slack:notification": {
                                                            "enabled": True}}}])
        self.desk_ids = self.app.data.insert('desks', [
            {'name': 'sports', 'members': [{'user': self.user_ids[0]}], 'slack_channel_name': 'news'}
        ])

    @mock.patch('planning.planning_notifications._get_slack_client', return_value=MockSlack())
    def test_desk_notification(self, sc):
        try:
            PlanningNotifications()._notify_slack('hdskjgdsjg', target_user=None, target_desk=self.desk_ids[0],
                                                  target_desk2=None, message='hello world by Unknown')
        except Exception:
            self.assertTrue(False)

    @mock.patch('planning.planning_notifications._get_slack_client', return_value=MockSlack())
    def test_user_notification(self, sc):
        try:
            PlanningNotifications()._notify_slack('djkjhkjhdkjhdk', target_user=self.user_ids[0], target_desk=None,
                                                  target_desk2=None, message='hello user from world by Unknown')
        except Exception:
            self.assertTrue(False)
