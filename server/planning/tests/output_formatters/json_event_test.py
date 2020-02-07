import json
import tempfile

from unittest import mock
from superdesk.tests import TestCase
from superdesk.publish import init_app, registered_transmitters
from planning.output_formatters.json_event import JsonEventFormatter
from planning.events import init_app
from eve.methods.common import store_media_files
from bson import ObjectId


@mock.patch('superdesk.publish.subscribers.SubscribersService.generate_sequence_number', lambda self, subscriber: 1)
class JsonEventTestCase(TestCase):
    item = {
        '_id': 'urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946',
        'guid': 'urn:newsml:localhost:2018-04-10T11:05:55.664317:e1301640-80a2-4df9-b4d9-91bbb4af7946',
        '_planning_schedule': [
            {
                'scheduled': '2018-04-09T14:00:53.581Z'
            }
        ],
        'ednote': 'An editorial Note',
        '_created': '2018-04-10T01:05:55.000Z',
        '_updated': '2018-04-10T01:06:53.000Z',
        'event_contact_info': [
            '5ab491271d41c88e98ad9336'
        ],
        'internal_note': 'An internal Note',
        '_etag': '5ce752b8907fba6b6f56e316f4722436bd3098ba',
        'subject': [
            {
                'name': 'tourism',
                'qcode': '10006000',
                'parent': '10000000'
            }
        ],
        'anpa_category': [
            {
                'name': 'International News',
                'qcode': 'i'
            }
        ],
        'occur_status': {
            'label': 'Confirmed',
            'name': 'Planned, occurs certainly',
            'qcode': 'eocstat:eos5'
        }, 'dates': {
            'start': '2018-04-09T14:00:53.581Z',
            'tz': 'Australia/Sydney',
            'end': '2018-04-10T13:59:59.999Z'
        },
        'name': 'Name of the event',
        'definition_short': 'The description of the event',
        'location': [
            {
                'location': {
                    'lon': 14.4138309,
                    'lat': 50.0861414
                },
                'address': {
                    'locality': 'Prague',
                    'area': 'Old Town',
                    'country': 'Czechia',
                    'title': 'Charles Bridge',
                    'line': [
                        ''
                    ],
                    'postal_code': '1'
                },
                'name': 'Karlův most',
                'qcode': 'urn:newsml:localhost:2018-04-10T11:05:55.495681:4309f560-3e07-487f-a9c3-19e4659cf49f'
            }
        ],
        'links': [
            'https://www.prague.eu/en'
        ],
        'files': [],
        'type': 'event',
        'calendars': [
            {
                'name': 'Holidays',
                'qcode': 'holidays',
                'is_active': True
            }
        ],
        'original_creator': '57bcfc5d1d41c82e8401dcc0',
        'state': 'draft',
        'slugline': 'SLUGLINE',
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
        'lock_session': None,
        'lock_action': None,
        'lock_user': None,
        'lock_time': None,
        'expiry': None
    }

    def setUp(self):
        init_app(self.app)
        self.maxDiff = None
        contact = [{
            '_id': ObjectId('5ab491271d41c88e98ad9336'),
            'contact_email': [
                'jdoe@fubar.com'
            ],
            '_updated': '2018-03-23T05:31:19.000Z',
            'postcode': '2040',
            'is_active': True,
            'locality': 'Rhodes',
            'website': 'fubar.com',
            'public': True,
            'contact_state': 'NSW',
            'last_name': 'Doe',
            'notes': 'Exceptionally good looking',
            'mobile': [
                {
                    'public': False,
                    'number': '999',
                    'usage': 'Private Mobile'
                },
                {
                    'public': True,
                    'number': '666',
                    'usage': 'Office Mobile'
                }
            ],
            'organisation': 'FUBAR',
            'first_name': 'John',
            'country': 'Australia',
            'city': 'Sydney',
            'job_title': 'Media Contact',
            'honorific': 'Mr',
            'contact_phone': [
                {
                    'usage': 'Business',
                    'public': True,
                    'number': '99999999'
                }
            ],
            '_created': '2018-03-23T05:31:19.000Z'
        }]
        self.app.data.insert('contacts', contact)

    def test_formatter(self):
        formatter = JsonEventFormatter()
        output = formatter.format(self.item, {'name': 'Test Subscriber'})[0]
        output_item = json.loads(output[1])
        self.assertEqual(output_item.get('name'), 'Name of the event')
        self.assertEqual(output_item.get('event_contact_info')[0].get('last_name'), 'Doe')
        self.assertEqual(output_item.get('internal_note'), 'An internal Note')
        self.assertEqual(output_item.get('ednote'), 'An editorial Note')

    def test_files_publishing(self):
        init_app(self.app)
        with tempfile.NamedTemporaryFile(suffix='txt') as input:
            input.write('foo'.encode('utf-8'))
            input.seek(0)
            input.filename = 'foo.txt'
            input.mimetype = 'text/plain'
            attachment = {'media': input}
            store_media_files(attachment, 'events_files')
            files_ids = self.app.data.insert('events_files', [attachment])
        item = self.item.copy()
        item['files'] = files_ids

        subscriber = {'name': 'Test Subscriber', 'is_active': True}
        destination = {'delivery_type': 'http_push'}
        formatter = JsonEventFormatter()
        formatter.set_destination(destination, subscriber)
        with mock.patch.object(registered_transmitters['http_push'], '_transmit_media', return_value='new-href') as push_media:  # noqa
            output = formatter.format(item, subscriber)[0]
            push_media.assert_called_once_with(mock.ANY, destination)

        output_item = json.loads(output[1])
        self.assertEqual(1, len(output_item['files']))
        self.assertEqual({
            'name': 'foo.txt',
            'length': 3,
            'mimetype': 'text/plain',
            'media': str(self.app.data.find_one('events_files', req=None, _id=files_ids[0]).get('media')),
        }, output_item['files'][0])
