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

from apps.prepopulate.app_populate import AppPopulateCommand

from planning.types import PlanningProfileResource
from planning.tests import TestCase


class AppPopulatePlanningTypesTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.filename = os.path.join(os.path.abspath(os.path.dirname(__file__)), "planning_types.json")

        self.json_data = [
            {
                "name": "event",
                "type": "event",
                "editor": {
                    "definition_long": {
                        "enabled": False,
                        "group": "details",
                        "index": 3,
                    }
                },
                "schema": {
                    "definition_long": {
                        "type": "string",
                        "required": False,
                        "minlength": None,
                        "maxlength": None,
                        "field_type": "multi_line",
                    }
                },
            }
        ]

        with open(self.filename, "w+") as file:
            json.dump(self.json_data, file)

    async def asyncTearDown(self):
        await super().asyncTearDown()
        os.remove(self.filename)

    async def test_populate_types(self):
        cmd = AppPopulateCommand()
        async with self.app.app_context():
            service = PlanningProfileResource.get_service()
            await cmd.run(self.filename)

            for item in self.json_data:
                data = await service.find_one(type="event")
                self.assertIsNotNone(data)
                self.assertEqual(data.name, item["name"])
                self.assertEqual(data.item_type, item["type"])
                self.assertEqual(data.editor["definition_long"], item["editor"]["definition_long"])
                self.assertDictEqual(data.schema_config["definition_long"], item["schema"]["definition_long"])
