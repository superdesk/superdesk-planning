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

from superdesk import get_resource_service
from planning.content_profiles.planning_types_async_service import PlanningTypesAsyncService
from planning.tests import TestCase
from apps.prepopulate.app_populate import AppPopulateCommand


class AppPopulatePlanningTypesTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.filename = os.path.join(os.path.abspath(os.path.dirname(__file__)), "planning_types.json")

        self.json_data = [
            {
                "_id": "event",
                "name": "event",
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
            service = get_resource_service("planning_types")
            await cmd.run(self.filename)

            for item in self.json_data:
                data = await service.find_one_async(req=None, _id=item["_id"])
                self.assertIsNotNone(data)
                self.assertEqual(data["_id"], item["_id"])
                self.assertEqual(data["editor"]["definition_long"], item["editor"]["definition_long"])
                self.assertDictEqual(data["schema"]["definition_long"], item["schema"]["definition_long"])
