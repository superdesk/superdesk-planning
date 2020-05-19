# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Assignments"""

from planning.tests import TestCase
from superdesk import get_resource_service
from bson import ObjectId


class AssignmentAcceptTestCase(TestCase):

    def test_accept(self):
        assignment_id = '5b20652a1d41c812e24aa49e'

        users = [
            {'_id': ObjectId(), 'display_name': 'Name McName Face'},
            {'_id': ObjectId()}
        ]

        assignment = {
            '_id': ObjectId(assignment_id),
            'planning_item': 'plan1',
            'coverage_item': 'cov1',
            'assigned_to': {
                'state': 'assigned',
                'user': users[0].get('_id'),
                'desk': 'test',
                'assignor_user': users[1].get('_id')
            },
            "planning": {
                "g2_content_type": "picture",
                "slugline": "Accept Test"
            }
        }

        with self.app.app_context():
            self.app.data.insert('users', users)
            self.app.data.insert('assignments', [assignment])
            get_resource_service('assignments').accept_assignment(ObjectId(assignment_id), users[0].get('_id'))
            assignment = self.app.data.find_one('assignments', req=None, _id=ObjectId(assignment_id))
            self.assertTrue(assignment.get('accepted'))
            activity = self.app.data.find_all('activity')[0]
            self.assertDictEqual(activity.get('data'), {"coverage_type": "picture", "user": "Name McName Face",
                                                        "omit_user": True, "slugline": "Accept Test"})
            history = self.app.data.find('assignments_history', None, None)[0]
            self.assertEqual(history[0].get('operation'), 'accepted')

    def test_external(self):
        assignment_id = '5b20652a1d41c812e24aa49e'

        users = [
            {'_id': ObjectId()}
        ]

        contact = [
            {'_id': ObjectId(),
             'first_name': 'Name',
             'last_name': 'McName Face'}
        ]

        assignment = {
            '_id': ObjectId(assignment_id),
            'planning_item': 'plan1',
            'coverage_item': 'cov1',
            'assigned_to': {
                'state': 'assigned',
                'user': None,
                'desk': 'test',
                'assignor_user': users[0].get('_id'),
                'contact': contact[0].get('_id')
            },
            "planning": {
                "g2_content_type": "picture",
                "slugline": "Accept Test"
            }
        }

        with self.app.app_context():
            self.app.data.insert('users', users)
            self.app.data.insert('assignments', [assignment])
            self.app.data.insert('contacts', contact)
            get_resource_service('assignments').accept_assignment(ObjectId(assignment_id), contact[0].get('_id'))
            assignment = self.app.data.find_one('assignments', req=None, _id=ObjectId(assignment_id))
            self.assertTrue(assignment.get('accepted'))
            history = self.app.data.find('assignments_history', None, None)[0]
            self.assertEqual(history[0].get('operation'), 'accepted')
