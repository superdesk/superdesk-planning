from planning.tests import TestCase
from superdesk import get_resource_service


class AssignmentUnlinkTestCase(TestCase):
    def test_delivery_record(self):
        with self.app.app_context():
            self.app.data.insert('archive', [{
                '_id': 'item1',
                'type': 'text',
                'headline': 'test headline',
                'slugline': 'test slugline',
                'task': {
                    'desk': 'desk1',
                    'stage': 'stage1'
                }
            }])
            self.app.data.insert('assignments', [{
                '_id': 'as1',
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': 'test'
                }
            }])

            get_resource_service('assignments_link').post([{
                'assignment_id': 'as1',
                'item_id': 'item1'
            }])

            delivery_service = get_resource_service('delivery')
            archive_service = get_resource_service('archive')
            assignment_service = get_resource_service('assignments')

            delivery_item = delivery_service.find_one(req=None, item_id='item1')

            self.assertEqual(delivery_item.get('item_id'), 'item1')
            self.assertEqual(delivery_item.get('assignment_id'), 'as1')
            self.assertEqual(delivery_item.get('planning_id'), 'plan1')
            self.assertEqual(delivery_item.get('coverage_id'), 'cov1')

            archive_item = archive_service.find_one(req=None, _id='item1')
            self.assertEqual(archive_item.get('assignment_id'), 'as1')

            assignment = assignment_service.find_one(req=None, _id='as1')
            self.assertEqual(assignment.get('assigned_to')['state'], 'in_progress')

            get_resource_service('assignments_unlink').post([{
                'assignment_id': 'as1',
                'item_id': 'item1'
            }])

            delivery_item = delivery_service.find_one(req=None, item_id='item1')
            self.assertEqual(delivery_item, None)

            assignment = assignment_service.find_one(req=None, _id='as1')
            self.assertEqual(assignment.get('assigned_to')['state'], 'assigned')

            archive_item = archive_service.find_one(req=None, _id='item1')
            self.assertEqual(archive_item.get('assignment_id'), None)
