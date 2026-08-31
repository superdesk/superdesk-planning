# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests import utils

from planning.tests import TestCase

from .utils import get_multilingual_fields, ContentProfileData


class ContentProfilesTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.app.data.insert(
            "vocabularies",
            [
                {
                    "_id": "languages",
                    "display_name": "Languages",
                    "type": "manageable",
                    "unique_field": "qcode",
                    "service": {"all": 1},
                    "items": [
                        {"qcode": "nl", "name": "Dutch", "is_active": True},
                        {"qcode": "fr", "name": "French", "is_active": True},
                        {"qcode": "en", "name": "English", "is_active": True},
                        {"qcode": "de", "name": "German", "is_active": True},
                    ],
                }
            ],
        )

    async def test_get_multilingual_fields(self):
        async with self.app.app_context():
            schema = {
                "language": {
                    "languages": ["en", "de"],
                    "default_language": "en",
                    "multilingual": True,
                    "required": True,
                },
                "name": {"multilingual": True},
                "slugline": {"multilingual": True},
                "definition_short": {"multilingual": True},
            }

            profile_ids = await utils.post_items(
                "planning_types",
                [
                    {
                        "name": "event",
                        "type": "event",
                        "editor": {
                            "language": {"enabled": True},
                        },
                        "schema": schema,
                    }
                ],
            )

            fields = await get_multilingual_fields("event")
            self.assertIn("name", fields)
            self.assertIn("slugline", fields)
            self.assertIn("definition_short", fields)
            self.assertNotIn("definition_long", fields)

            schema["language"]["multilingual"] = False
            await utils.patch_item("planning_types", profile_ids[0], {"schema": schema})

            fields = await get_multilingual_fields("event")
            self.assertNotIn("name", fields)
            self.assertNotIn("slugline", fields)
            self.assertNotIn("definition_short", fields)
            self.assertNotIn("definition_long", fields)

    async def test_content_profile_data(self):
        await utils.post_items(
            "planning_types",
            [
                {
                    "name": "event",
                    "type": "event",
                    "editor": {
                        "language": {"enabled": True},
                    },
                    "schema": {
                        "language": {
                            "languages": ["en", "de"],
                            "default_language": "en",
                            "multilingual": True,
                            "required": True,
                        },
                        "name": {"multilingual": True},
                        "slugline": {"multilingual": True},
                        "definition_short": {"multilingual": True},
                        "anpa_category": {"required": True},
                    },
                }
            ],
        )

        data = await ContentProfileData.get("event")
        self.assertTrue(data.profile["name"] == data.profile["type"] == "event")
        self.assertTrue(data.is_multilingual)
        self.assertEqual(data.multilingual_fields, {"name", "slugline", "definition_short"})
        self.assertIn("name", data.enabled_fields)
        self.assertIn("slugline", data.enabled_fields)
        self.assertIn("definition_short", data.enabled_fields)
        self.assertIn("anpa_category", data.enabled_fields)
