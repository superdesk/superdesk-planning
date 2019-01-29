# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import os
import json

from superdesk.tests import TestCase
from superdesk import get_resource_service
from apps.prepopulate.app_populate import AppPopulateCommand


class AppPopulatePlanningTypesTest(TestCase):

    def setUp(self):
        super().setUp()
        self.filename = os.path.join(os.path.abspath(os.path.dirname(__file__)), "planning_types.json")

        self.json_data = [{
            "_id": "event",
            "name": "event",
            "editor": {
                "definition_long": {
                    "enabled": False
                }
            },
            "schema": {
                "definition_long": {
                    "type": "string",
                    "required": False
                }
            }
        }]

        with open(self.filename, "w+") as file:
            json.dump(self.json_data, file)

    def test_populate_types(self):
        cmd = AppPopulateCommand()
        with self.app.app_context():
            service = get_resource_service("planning_types")
            cmd.run(self.filename)

            for item in self.json_data:
                data = service.find_one(_id=item['_id'], req=None)
                self.assertEqual(data["_id"], item["_id"])
                self.assertEqual(data["editor"]['definition_long'], item["editor"]['definition_long'])
                self.assertDictEqual(data["schema"]['definition_long'], item["schema"]['definition_long'])

    def tearDown(self):
        os.remove(self.filename)
