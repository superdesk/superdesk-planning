# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy

from superdesk.tests import utils
from pymongo.errors import DuplicateKeyError
from pydantic import ValidationError

from planning.types import PlanningProfileResource, PlanningProfileType, DEFAULT_PROFILE_ID
from planning.tests import TestCase

from .profiles import DEFAULT_PROFILES
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

    async def test_non_coverage_profile_unique_index_without_name_or_content_type(self):
        self.async_app.mongo.create_resource_indexes("planning_types")
        service = PlanningProfileResource.get_service()

        for profile_type in PlanningProfileType:
            if profile_type == PlanningProfileType.COVERAGE:
                continue

            with self.subTest(profile_type=profile_type):
                await service.mongo_async.insert_one({"type": profile_type.value})
                with self.assertRaises(DuplicateKeyError):
                    await service.mongo_async.insert_one({"type": profile_type.value})

    async def test_non_coverage_profile_type_validation(self):
        service = PlanningProfileResource.get_service()

        for profile_type in PlanningProfileType:
            if profile_type == PlanningProfileType.COVERAGE:
                continue

            with self.subTest(profile_type=profile_type):
                profile = (
                    await service.create(
                        [
                            PlanningProfileResource(
                                name="Original profile",
                                item_type=profile_type,
                                content_type="text",
                                editor=deepcopy(DEFAULT_PROFILES[profile_type].editor),
                            )
                        ]
                    )
                )[0]
                with self.assertRaises(ValidationError) as context:
                    await service.create(
                        [
                            PlanningProfileResource(
                                name="Different profile", item_type=profile_type, content_type="picture"
                            )
                        ]
                    )
                error = context.exception.errors()[0]
                self.assertEqual(error["type"], "unique")
                self.assertEqual(error["msg"], "A profile already exists for this type")

                await service.update(profile.id, {"name": "Renamed profile"})
                self.assertEqual((await service.find_by_id(profile.id)).name, "Renamed profile")

    async def test_non_coverage_profile_type_update_validation(self):
        service = PlanningProfileResource.get_service()
        await service.create([PlanningProfileResource(name="Event profile", item_type=PlanningProfileType.EVENT)])
        planning_profile = (
            await service.create(
                [PlanningProfileResource(name="Planning profile", item_type=PlanningProfileType.PLANNING)]
            )
        )[0]

        with self.assertRaises(ValidationError) as context:
            await service.update(planning_profile.id, {"type": "event"})
        self.assertEqual(context.exception.errors()[0]["msg"], "A profile already exists for this type")
        self.assertEqual((await service.find_by_id(planning_profile.id)).item_type, PlanningProfileType.PLANNING)

    async def test_coverage_profile_name_unique_index(self):
        self.async_app.mongo.create_resource_indexes("planning_types")
        service = PlanningProfileResource.get_service()

        for content_type in ("text", "picture"):
            await service.mongo_async.insert_one(
                {"type": "coverage", "name": "Shared profile", "content_type": content_type}
            )

        with self.assertRaises(DuplicateKeyError):
            await service.mongo_async.insert_one({"type": "coverage", "name": "Shared profile", "content_type": "text"})

    async def test_coverage_profile_name_validation(self):
        service = PlanningProfileResource.get_service()

        for content_type in ("text", "picture"):
            await service.create(
                [
                    PlanningProfileResource(
                        name="Shared profile", item_type=PlanningProfileType.COVERAGE, content_type=content_type
                    )
                ]
            )

        with self.assertRaises(ValidationError) as context:
            await service.create(
                [
                    PlanningProfileResource(
                        name="Shared profile", item_type=PlanningProfileType.COVERAGE, content_type="text"
                    )
                ]
            )
        self.assertEqual(context.exception.errors()[0]["msg"], "Text Coverage profile already exists with that name")

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

    async def test_always_include_default_coverage_profile(self):
        service = PlanningProfileResource.get_service()
        cursor = await service.find({"type": "coverage"})
        profiles = {profile.id: profile async for profile in cursor}

        self.assertEqual(len(profiles), 1)
        profile = profiles.get(DEFAULT_PROFILE_ID)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.item_type, PlanningProfileType.COVERAGE)
        self.assertEqual(profile.content_type, "")
        self.assertFalse(profile.editor["anpa_category"]["enabled"])
        self.assertFalse(profile.editor["headline"]["enabled"])

        text_profile = (
            await service.create(
                [
                    PlanningProfileResource(
                        name="Text Coverage",
                        item_type=PlanningProfileType.COVERAGE,
                        content_type="text",
                        editor={"anpa_category": {"enabled": True, "index": 3}},
                        schema={"anpa_category": {"required": True}},
                    )
                ]
            )
        )[0]

        cursor = await service.find({"type": "coverage"})

        profiles = {profile.id: profile async for profile in cursor}
        self.assertEqual(len(profiles), 2)

        profile = profiles.get(DEFAULT_PROFILE_ID)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.item_type, PlanningProfileType.COVERAGE)
        self.assertEqual(profile.content_type, "")
        self.assertFalse(profile.editor["anpa_category"]["enabled"])
        self.assertFalse(profile.editor["headline"]["enabled"])

        profile = profiles.get(text_profile.id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.item_type, PlanningProfileType.COVERAGE)
        self.assertEqual(profile.content_type, "text")

        self.assertTrue(profile.editor["anpa_category"]["enabled"])
        self.assertFalse(profile.editor["headline"]["enabled"])

        default_profile = (
            await service.create(
                [
                    PlanningProfileResource(
                        name="Default Coverage",
                        item_type=PlanningProfileType.COVERAGE,
                        editor={"headline": {"enabled": True, "index": 3}},
                        schema={"headline": {"required": True}},
                    )
                ]
            )
        )[0]

        cursor = await service.find({"type": "coverage"})
        profiles = {profile.id: profile async for profile in cursor}
        self.assertEqual(len(profiles), 2)

        # The system-defined default is no longer returned from the datalayer
        self.assertIsNone(profiles.get(DEFAULT_PROFILE_ID))

        # Instead, the item in the DB is returned from the datalayer
        profile = profiles.get(default_profile.id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.item_type, PlanningProfileType.COVERAGE)
        self.assertEqual(profile.content_type, "")
        self.assertFalse(profile.editor["anpa_category"]["enabled"])
        self.assertTrue(profile.editor["headline"]["enabled"])

        # And our content-specific text profile is returned from the datalayer
        profile = profiles.get(text_profile.id)
        self.assertIsNotNone(profile)
        self.assertEqual(profile.item_type, PlanningProfileType.COVERAGE)
        self.assertEqual(profile.content_type, "text")
        self.assertTrue(profile.editor["anpa_category"]["enabled"])
        self.assertFalse(profile.editor["headline"]["enabled"])

    async def test_coverage_profiles_can_share_name_across_content_types(self):
        profile_ids = await utils.post_items(
            "planning_types",
            [
                {"name": "coverage", "type": "coverage", "content_type": "text"},
                {"name": "coverage", "type": "coverage", "content_type": "picture"},
            ],
        )

        self.assertEqual(len(profile_ids), 2)
