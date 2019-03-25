from planning.tests import TestCase
from superdesk import get_resource_service
import flask
from bson import ObjectId


class AssignmentsTestCase(TestCase):
    users = [
        {'_id': ObjectId()},
        {'_id': ObjectId()}
    ]

    auth = [
        {'_id': ObjectId(), 'user': users[0]['_id']},
        {'_id': ObjectId(), 'user': users[1]['_id']}
    ]

    archive_item = {
        '_id': 'item1',
        'guid': 'item1',
        'type': 'text',
        'headline': 'test headline',
        'slugline': 'test slugline',
        'task': {
            'desk': 'desk1',
            'stage': 'stage1'
        },
        'assignment_id': ObjectId('5b20652a1d41c812e24aa49e')
    }

    assignment_item = {
        '_id': ObjectId('5b20652a1d41c812e24aa49e'),
        'guid': 'as1',
        'planning_item': 'plan1',
        'coverage_item': 'cov1',
        'assigned_to': {
            'state': 'in_progress',
            'user': 'aaaaaaaaaaaaaaaaaaaaaaaa',
            'desk': 'desk1'
        },
        'lock_user': users[0]['_id'],
        'lock_session': auth[0]['_id'],
        'lock_action': 'remove_assignment'
    }

    planning_item = {
        '_id': 'plan1',
        'guid': 'plan1',
        'coverages': [{
            'coverage_id': 'cov1',
            'assigned_to': {
                'user': 'aaaaaaaaaaaaaaaaaaaaaaaa',
                'desk': 'desk1'
            }
        }],
        'lock_user': users[0]['_id'],
        'lock_session': auth[0]['_id'],
        'lock_action': 'remove_assignment'
    }

    delivery_item = {
        '_id': 'del1',
        'planning_id': 'plan1',
        'coverage_id': 'cov1',
        'assignment_id': ObjectId('5b20652a1d41c812e24aa49e'),
        'item_id': 'item1'
    }

    def setUp(self):
        super().setUp()
        with self.app.app_context():
            self.app.data.insert('users', self.users)
            self.app.data.insert('auth', self.auth)
            self.app.data.insert('archive', [self.archive_item])
            self.app.data.insert('assignments', [self.assignment_item])
            self.app.data.insert('planning', [self.planning_item])
            self.app.data.insert('delivery', [self.delivery_item])

    def test_delivery_record_deleted(self):
        with self.app.app_context():
            flask.g.user = self.users[0]
            flask.g.auth = self.auth[0]
            delivery_service = get_resource_service('delivery')
            assignment_service = get_resource_service('assignments')

            self.assertIsNotNone(delivery_service.find_one(req=None, item_id='item1'))
            assignment_service.delete_action(lookup={'_id': ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertIsNone(delivery_service.find_one(req=None, item_id='item1'))
