# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning.tests import TestCase
from superdesk import get_resource_service


class PlanningValidateServiceTest(TestCase):
    def test_validate_on_post(self):
        with self.app.app_context():
            self.app.data.insert('planning_types', [{
                "_id": "event", "name": "event",
                "schema": {
                    "name": {
                        "type": "string", "required": True
                    },
                    "slugline": {
                        "type": "string", "required": True, "validate_on_post": True
                    },
                    "calendars": {
                        "type": "list", "required": True
                    },
                    "definition_short": {
                        "type": "string", "required": False
                    }
                }
            }])

            errors = get_resource_service('planning_validator').post([{
                'validate_on_post': True,
                'type': 'event',
                'validate': {
                    'name': 'Test Event',
                    'calendars': [{'qcode': 'cal1', 'name': 'Calendar 1'}]
                }
            }])[0]

            self.assertEqual(errors, ['SLUGLINE is a required field'])

            errors = get_resource_service('planning_validator').post([{
                'validate_on_post': True,
                'type': 'event',
                'validate': {
                    'name': 'Test Event',
                    'slugline': 'Test slugger',
                    'calendars': [{'qcode': 'cal1', 'name': 'Calendar 1'}]
                }
            }])[0]

            self.assertEqual(errors, [])

            errors = get_resource_service('planning_validator').post([{
                'validate_on_post': False,
                'type': 'event',
                'validate': {
                    'slugline': 'Test Event',
                    'definition_short': 'This is an Event'
                }
            }])[0]

            self.assertEqual(len(errors), 3)
            self.assertIn('NAME is a required field', errors)
            self.assertIn('CALENDARS is a required field', errors)
            self.assertIn('DATES is a required field', errors)

            errors = get_resource_service('planning_validator').post([{
                'validate_on_post': False,
                'type': 'event',
                'validate': {
                    'name': 'Test Event',
                    'slugline': 'Test slugger',
                    'calendars': [{'qcode': 'cal1', 'name': 'Calendar 1'}],
                    'definition_short': 'This is an Event',
                    'dates': {
                        'start': '2018-04-09T14:00:53.581Z',
                        'end': '2018-04-10T13:59:59.999Z',
                        'tz': 'Australia/Sydney',
                    }
                }
            }])[0]

            self.assertEqual(errors, [])
