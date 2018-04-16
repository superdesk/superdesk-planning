from planning.tests import TestCase
from unittest import mock
from planning.output_formatters.json_planning import JsonPlanningFormatter
import json


@mock.patch('superdesk.publish.subscribers.SubscribersService.generate_sequence_number', lambda self, subscriber: 1)
class JsonPlanningTestCase(TestCase):
    item = {
        '_id': 'urn:newsml:localhost:2018-04-10T11:06:53.632085:e372d553-9ee1-4e62-8706-fd2eb678ce06',
        '_planning_schedule': [
            {
                'scheduled': '2018-04-09T14:00:53.000Z',
                'coverage_id': 'urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713'
            }
        ],
        'ednote': 'An editorial Note',
        '_created': '2018-04-10T01:06:53.000Z',
        '_updated': '2018-04-10T04:37:36.000Z',
        'coverages': [
            {
                'firstcreated': '2018-04-10T04:37:31.000Z',
                'planning': {
                    'g2_content_type': 'text',
                    'genre': [
                        {
                            'name': 'Article',
                            'qcode': 'Article'
                        }
                    ],
                    'ednote': 'An editorial Note',
                    'keyword': [
                        'Motoring'
                    ],
                    'scheduled': '2018-04-09T14:00:53.000Z',
                    'slugline': 'SLUGLINE',
                    'internal_note': 'An internal Note'
                },
                'assigned_to': {
                    'assignment_id': '5acc3f8b1d41c81cc16a5e4f',
                    'priority': 2
                },
                'original_creator': '57bcfc5d1d41c82e8401dcc0',
                'workflow_status': 'draft',
                'coverage_id': 'urn:newsml:localhost:2018-04-10T14:37:31.188619:e5da893e-8027-4923-8c39-868f11eee713',
                'news_coverage_status': {
                    'label': 'Planned',
                    'name': 'coverage intended',
                    'qcode': 'ncostat:int'
                }
            }
        ],
        'internal_note': 'An internal Note',
        '_etag': '639e18fc36d9ef6da577702de307aa9506b440e2',
        'subject': [
            {
                'name': 'tourism',
                'qcode': '10006000',
                'parent': '10000000'
            }
        ],
        'description_text': 'The description of the event',
        'anpa_category': [
            {
                'name': 'International News',
                'qcode': 'i'
            }
        ],
        'flags': {
            'marked_for_not_publication': False
        },
        'guid': 'urn:newsml:localhost:2018-04-10T11:06:53.632085:e372d553-9ee1-4e62-8706-fd2eb678ce06',
        'planning_date': '2018-04-09T14:00:53.000Z',
        'headline': 'Name of the event',
        'agendas': [
            1
        ],
        'event_item': 'urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946',
        'place': [
            {
                'group': 'Rest Of World',
                'world_region': 'Europe',
                'name': 'EUR',
                'qcode': 'EUR',
                'country': '',
                'state': ''
            }
        ],
        'item_class': 'plinat:newscoverage',
        'original_creator': '57bcfc5d1d41c82e8401dcc0',
        'state': 'draft',
        'slugline': 'SLUGLINE',
        'type': 'planning',
        'lock_session': None,
        'lock_action': None,
        'lock_user': None,
        'lock_time': None,
        'urgency': 1,
        'version_creator': '57bcfc5d1d41c82e8401dcc0'
    }

    def setUp(self):
        super().setUp()
        self.maxDiff = None

    def test_formatter(self):
        with self.app.app_context():
            agenda = {
                '_id': 1,
                'is_enabled': True,
                'original_creator': '57bcfc5d1d41c82e8401dcc0',
                '_etag': '1573e7f9b288e65e28c0c0c73edac1ff8736b589',
                'name': 'Culture',
                '_updated': '2017-09-06T06:22:53.000Z',
                '_created': '2017-09-06T06:22:53.000Z'
            }
            self.app.data.insert('agenda', [agenda])
            formatter = JsonPlanningFormatter()
            output = formatter.format(self.item, {'name': 'Test Subscriber'})[0]
            output_item = json.loads(output[1])
            self.assertEqual(output_item.get('slugline'), 'SLUGLINE')
            self.assertEqual(output_item.get('agendas')[0].get('name'), 'Culture')
            self.assertEqual(output_item.get('coverages')[0].get('planning').get('slugline'), 'SLUGLINE')
