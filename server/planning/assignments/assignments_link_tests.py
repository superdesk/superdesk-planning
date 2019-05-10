from planning.tests import TestCase
from superdesk import get_resource_service
from bson import ObjectId


assignment_id = '5b20652a1d41c812e24aa49e'


class AssignmentLinkTestCase(TestCase):
    def test_delivery_record(self):
        with self.app.app_context():
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId(assignment_id),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                }
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': assignment_id,
                'item_id': 'item1',
                'reassign': True
            }])

            delivery_item = get_resource_service('delivery').find_one(req=None, item_id='item1')

            self.assertEqual(delivery_item.get('item_id'), 'item1')
            self.assertEqual(delivery_item.get('assignment_id'), ObjectId(assignment_id))
            self.assertEqual(delivery_item.get('planning_id'), 'plan1')
            self.assertEqual(delivery_item.get('coverage_id'), 'cov1')

            archive_item = get_resource_service('archive').find_one(req=None, _id='item1')
            self.assertEqual(archive_item.get('assignment_id'), ObjectId(assignment_id))

            assignment = get_resource_service('assignments').find_one(req=None, _id=ObjectId(assignment_id))
            self.assertEqual(assignment.get('assigned_to')['state'], 'in_progress')

    def test_updates_creates_new_record(self):
        with self.app.app_context():
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId(assignment_id),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                }
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': assignment_id,
                'item_id': 'item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId(assignment_id)})
            self.assertEqual(deliveries.count(), 1)

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
            get_resource_service('assignments_link').post([{
                'assignment_id': assignment_id,
                'item_id': 'rewrite_item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId(assignment_id)})
            self.assertEqual(deliveries.count(), 2)

    def test_captures_item_state(self):
        with self.app.app_context():
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1'
            }])
            self.app.data.insert('assignments', [{
                '_id': ObjectId(assignment_id),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                }
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': assignment_id,
                'item_id': 'item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId(assignment_id)})
            self.assertEqual(deliveries.count(), 1)
            self.assertEqual(deliveries[0].get('item_state'), 'in_progress')

    def test_previous_unlinked_content_gets_linked_when_update_is_linked(self):
        with self.app.app_context():
            self.app.config.update({'PLANNING_LINK_UPDATES_TO_COVERAGES': True})
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'state': 'in_progress',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                },
                'event_id': 'item1'
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId(assignment_id)})
            self.assertEqual(deliveries.count(), 0)

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
                '_id': ObjectId(assignment_id),
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                }
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': assignment_id,
                'item_id': 'rewrite_item1',
                'reassign': True
            }])

            deliveries = get_resource_service('delivery').get(req=None, lookup={'assignment_id':
                                                                                ObjectId(assignment_id)})
            self.assertEqual(deliveries.count(), 2)
