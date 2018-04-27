from planning.tests import TestCase
from superdesk import get_resource_service
from bson import ObjectId

DESK_ID = ObjectId()


class AssignmentsContentServiceTest(TestCase):

    def test_genre(self):
        """Check that template genre is correctly overriden (SDESK-96"""
        with self.app.app_context():
            self.app.data.insert('assignments', [{
                '_id': 'as1',
                'planning_item': 'plan1',
                'coverage_item': 'cov1',
                'planning': {
                    'genre': [{'name': 'Analysis', 'qcode': 'Analysis'}]
                },
                'assigned_to': {
                    'state': 'assigned',
                    'user': 'test',
                    'desk': DESK_ID
                }
            }])
            self.app.data.insert('desks', [{
                '_id': DESK_ID
            }])

            self.app.data.insert('content_templates', [{
                '_id': 'foo',
                'template_name': 'test_template',
                'template_desks': ['politic'],
                'data': {
                    'headline': 'toto template',
                    'body_html': 'this is a test template',
                    'urgency': 1, 'priority': 3,
                    'dateline': {},
                    'anpa_take_key': 'test',
                    'genre': [{'name': 'template_genre', 'qcode': 'template_genre'}]
                }
            }])

            ids = get_resource_service('assignments_content').post([{
                'assignment_id': 'as1',
                'template_name': 'test_template'
            }])
            item = get_resource_service('archive').find_one(req=None, _id=ids[0])
        self.assertEqual(item['genre'], [{'name': 'Analysis', 'qcode': 'Analysis'}])
