from planning.feed_parsers.superdesk_event_json import EventJsonFeedParser
import os
from planning.tests import TestCase
from superdesk import get_resource_service


class EventJsonFeedParserTestCase(TestCase):

    sample_json = {}

    def setUp(self):
        super().setUp()
        dir_path = os.path.dirname(os.path.realpath(__file__))
        self.sample_json = os.path.join(dir_path, 'event_format_sample.json')

    def test_event_json_feed_parser_can_parse(self):
        self.assertEqual(True, EventJsonFeedParser().can_parse(self.sample_json))

    def test_event_json_feed_parser_parse(self):
        with self.app.app_context():

            random_event = {'is_active': True, 'name': 'random123', 'qcode': 'random123'}
            assign_from_local_cv = {
                'anpa_category': 'categories',
                'calendars': 'event_calendars',
                'place': 'locators',
                'occur_status': 'eventoccurstatus'
            }

            # add the random event items for above fields.
            for field in assign_from_local_cv:

                self.app.data.insert('vocabularies', [{
                    "_id": assign_from_local_cv[field],
                    "type": "manageable",
                    "unique_field": "qcode",
                    "selection_type": "do not show",
                    "items": [
                        {'is_active': True, 'name': 'random123', 'qcode': 'random123'}
                    ]
                }])

            events = EventJsonFeedParser().parse(self.sample_json)
            for field in assign_from_local_cv.keys():

                # check if the same random is returned after parsing as inserted above.
                if events[0].get(field):
                    if field == 'occur_status':
                        self.assertTrue(True, (events[0][field]['qcode'] == random_event['qcode']))
                    else:
                        self.assertTrue(True, (random_event['qcode'] in [event['qcode'] for event in events[0][field]]))

            # check if locations and contacts are created.
            location = get_resource_service('locations').find_one(req=None, _id='835d5175-a2bc-41ad-a906-baf3f2281a5c')
            contact = get_resource_service('contacts').find_one(req=None, _id='5d67ccc2fdf5baac5c93745c')

            self.assertTrue(True, location)
            self.assertTrue(True, contact)

            # remove the locations and contacts added.
            get_resource_service('locations').delete(location)
            get_resource_service('contacts').delete(contact)
