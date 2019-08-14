from planning.tests import TestCase
from superdesk import get_resource_service
import flask
from bson import ObjectId


class AssignmentUnlinkTestCase(TestCase):
    def test_delivery_record(self):
        with self.app.app_context():
            flask.g.user = {'_id': ObjectId()}
            self.app.data.insert('vocabularies', [{
                "_id": "g2_content_type",
                "display_name": "Coverage content types",
                "type": "manageable",
                "unique_field": "qcode",
                "selection_type": "do not show",
                "items": [
                    {"name": "Text", "qcode": "text", "content item type": "text"}
                ]
            }])
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId('5b20652a1d41c812e24aa49e'),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                },
                'planning': {'g2_content_type': 'text'}
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': 'item1',
                'reassign': True
            }])

            delivery_service = get_resource_service('delivery')
            archive_service = get_resource_service('archive')
            assignment_service = get_resource_service('assignments')

            delivery_item = delivery_service.find_one(req=None, item_id='item1')

            self.assertEqual(delivery_item.get('item_id'), 'item1')
            self.assertEqual(delivery_item.get('assignment_id'), ObjectId('5b20652a1d41c812e24aa49e'))
            self.assertEqual(delivery_item.get('planning_id'), 'plan1')
            self.assertEqual(delivery_item.get('coverage_id'), 'cov1')

            archive_item = archive_service.find_one(req=None, _id='item1')
            self.assertEqual(archive_item.get('assignment_id'), ObjectId('5b20652a1d41c812e24aa49e'))

            assignment = assignment_service.find_one(req=None, _id=ObjectId('5b20652a1d41c812e24aa49e'))
            self.assertEqual(assignment.get('assigned_to')['state'], 'in_progress')

            get_resource_service('assignments_unlink').post([{
                'assignment_id': ObjectId('5b20652a1d41c812e24aa49e'),
                'item_id': 'item1'
            }])

            delivery_item = delivery_service.find_one(req=None, item_id='item1')
            self.assertEqual(delivery_item, None)

            assignment = assignment_service.find_one(req=None, _id=ObjectId('5b20652a1d41c812e24aa49e'))
            self.assertEqual(assignment.get('assigned_to')['state'], 'assigned')

            archive_item = archive_service.find_one(req=None, _id='item1')
            self.assertEqual(archive_item.get('assignment_id'), None)

    def test_unlinks_all_content_updates(self):
        with self.app.app_context():
            self.app.config.update({'PLANNING_LINK_UPDATES_TO_COVERAGES': True})
            flask.g.user = {'_id': ObjectId()}
            user_id = ObjectId()
            desk_id = ObjectId()
            self.app.data.insert('vocabularies', [{
                "_id": "g2_content_type",
                "display_name": "Coverage content types",
                "type": "manageable",
                "unique_field": "qcode",
                "selection_type": "do not show",
                "items": [
                    {"name": "Text", "qcode": "text", "content item type": "text"}
                ]
            }])
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1',
                'state': 'in_progress'
            }])
            self.app.data.insert('archive', [{
                '_id': 'rewrite_item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'rewrite_of': 'item1',
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId('5b20652a1d41c812e24aa49e'),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': user_id,
                    'desk': desk_id
                },
                'planning': {'g2_content_type': 'text'}
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': 'rewrite_item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertEqual(deliveries.count(), 2)

            get_resource_service('assignments_unlink').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': 'item1'
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertEqual(deliveries.count(), 0)

    def test_unlinks_properly_on_unlinking_any_update_in_chain(self):
        with self.app.app_context():
            self.app.config.update({'PLANNING_LINK_UPDATES_TO_COVERAGES': True})
            flask.g.user = {'_id': ObjectId()}
            user_id = ObjectId()
            desk_id = ObjectId()
            self.app.data.insert('vocabularies', [{
                "_id": "g2_content_type",
                "display_name": "Coverage content types",
                "type": "manageable",
                "unique_field": "qcode",
                "selection_type": "do not show",
                "items": [
                    {"name": "Text", "qcode": "text", "content item type": "text"}
                ]
            }])
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'state': 'in_progress',
                'event_id': 'item1'
            }])
            self.app.data.insert('archive', [{
                '_id': 'rewrite_item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'rewrite_of': 'item1',
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId('5b20652a1d41c812e24aa49e'),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': user_id,
                    'desk': desk_id
                },
                'planning': {'g2_content_type': 'text'}
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': 'rewrite_item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertEqual(deliveries.count(), 2)

            get_resource_service('assignments_unlink').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': 'rewrite_item1'
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertEqual(deliveries.count(), 0)

    def test_unlinks_archived_content(self):
        with self.app.app_context():
            self.app.config.update({'PLANNING_LINK_UPDATES_TO_COVERAGES': True})
            flask.g.user = {'_id': ObjectId()}
            user_id = ObjectId()
            desk_id = ObjectId()
            self.app.data.insert('vocabularies', [{
                "_id": "g2_content_type",
                "display_name": "Coverage content types",
                "type": "manageable",
                "unique_field": "qcode",
                "selection_type": "do not show",
                "items": [
                    {"name": "Text", "qcode": "text", "content item type": "text"}
                ]
            }])
            self.app.data.insert('archived', [{
                '_id': ObjectId('111111111111111111111111'),
                'item_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1',
                'state': 'in_progress'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId('5b20652a1d41c812e24aa49e'),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': user_id,
                    'desk': desk_id
                },
                'planning': {'g2_content_type': 'text'}
            }])

            self.app.data.insert('delivery', [{'assignment_id': ObjectId('5b20652a1d41c812e24aa49e'),
                                               'coverage_id': 'cove1',
                                               'item_id': 'item1'}])

            get_resource_service('assignments_unlink').post([{
                'assignment_id': '5b20652a1d41c812e24aa49e',
                'item_id': ObjectId('111111111111111111111111')
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={
                'assignment_id': ObjectId('5b20652a1d41c812e24aa49e')})
            self.assertEqual(deliveries.count(), 0)
