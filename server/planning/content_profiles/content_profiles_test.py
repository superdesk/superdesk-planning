# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from planning.tests import TestCase

from .utils import get_multilingual_fields, ContentProfileData


class ContentProfilesTestCase(TestCase):
    def setUp(self):
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

    def test_get_multilingual_fields(self):
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
        self.app.data.insert(
            "planning_types",
            [
                {
                    "_id": "event",
                    "name": "event",
                    "editor": {
                        "language": {"enabled": True},
                    },
                    "schema": schema,
                }
            ],
        )

        fields = get_multilingual_fields("event")
        self.assertIn("name", fields)
        self.assertIn("slugline", fields)
        self.assertIn("definition_short", fields)
        self.assertNotIn("definition_long", fields)

        schema["language"]["multilingual"] = False
        self.app.data.update(
            "planning_types",
            "event",
            {"schema": schema},
            self.app.data.find_one("planning_types", req=None, _id="event"),
        )

        fields = get_multilingual_fields("event")
        self.assertNotIn("name", fields)
        self.assertNotIn("slugline", fields)
        self.assertNotIn("definition_short", fields)
        self.assertNotIn("definition_long", fields)

    def test_content_profile_data(self):
        self.app.data.insert(
            "planning_types",
            [
                {
                    "_id": "event",
                    "name": "event",
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

        data = ContentProfileData("event")
        self.assertTrue(data.profile["_id"] == data.profile["name"] == "event")
        self.assertTrue(data.is_multilingual)
        self.assertEqual(data.multilingual_fields, {"name", "slugline", "definition_short"})
        self.assertIn("name", data.enabled_fields)
        self.assertIn("slugline", data.enabled_fields)
        self.assertIn("definition_short", data.enabled_fields)
        self.assertIn("anpa_category", data.enabled_fields)
