import importlib
from copy import deepcopy

from bson import ObjectId

from superdesk.commands.data_updates import get_db_and_collection

from planning.tests import TestCase

DataUpdate = importlib.import_module("planning.data_updates.00039_20260828-152220_planning_types").DataUpdate


class UpgradeUnifiedPlanningProfilesTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

    async def test_update_event_and_planning_profiles(self):
        collection, db = get_db_and_collection(DataUpdate.resource, True)
        user_ids = [ObjectId(), ObjectId()]

        await collection.insert_many(
            [
                {
                    "_id": "event",
                    "name": "event",
                    "created_by": user_ids[0],
                    "updated_by": user_ids[1],
                    "schema": {
                        "name": {"required": True, "type": "string"},
                        "language": {"required": False, "type": "string"},
                    },
                    "editor": {
                        "name": {"enabled": True, "group": "title", "index": 1},
                        "language": {"enabled": True, "group": "description", "index": 1},
                    },
                },
                {
                    "_id": "planning",
                    "name": "planning",
                    "created_by": user_ids[0],
                    "updated_by": user_ids[1],
                    "schema": {
                        "headline": {"required": True, "type": "string", "field_type": "single_line"},
                        "slugline": {"required": False, "type": "string", "field_type": "single_line"},
                        "description_text": {"required": True, "type": "string", "field_type": "multi_line"},
                    },
                    "editor": {
                        "headline": {"enabled": True, "group": "title", "index": 1},
                        "slugline": {"enabled": False, "group": "description", "index": 1},
                        "description_text": {"enabled": True, "group": "description", "index": 2},
                    },
                },
                {"_id": "event_postpone", "name": "event_postpone", "schema": {"reason": {"required": True}}},
            ]
        )

        original_profiles = [
            await collection.find_one({"_id": "event"}),
            await collection.find_one({"_id": "planning"}),
            await collection.find_one({"_id": "event_postpone"}),
        ]
        self.assertIsNotNone(original_profiles[0])
        self.assertIsNotNone(original_profiles[1])
        self.assertIsNotNone(original_profiles[2])
        await DataUpdate().forwards(collection, db)

        for profile_index in range(3):
            original_profile = original_profiles[profile_index]
            migrated_profile = await collection.find_one({"type": original_profile["_id"]})
            self.assertIsNotNone(migrated_profile)
            self.assertTrue(ObjectId.is_valid(migrated_profile["_id"]))

            expected_values = {"type": original_profile["name"]}

            if migrated_profile["type"] == "event_postpone":
                expected_values["schema"] = original_profile["schema"]
            elif migrated_profile["type"] == "planning":
                original_profile_copy = deepcopy(original_profile)
                description_text_schema = original_profile_copy["schema"].pop("description_text")
                description_text_editor = original_profile_copy["editor"].pop("description_text")
                expected_values.update(
                    {
                        "original_creator": user_ids[0],
                        "version_creator": user_ids[1],
                        "schema": {
                            **original_profile_copy["schema"],
                            "definition_long": description_text_schema,
                        },
                        "editor": {
                            **original_profile_copy["editor"],
                            "definition_long": description_text_editor,
                        },
                    }
                )
            else:
                expected_values.update(
                    {
                        "original_creator": user_ids[0],
                        "version_creator": user_ids[1],
                        "schema": original_profile["schema"],
                        "editor": original_profile["editor"],
                    }
                )

            self.assertDictContains(migrated_profile, expected_values)

    async def test_migrate_coverage_profiles_to_planning_profiles(self):
        planning_profiles_collection, db = get_db_and_collection(DataUpdate.resource, True)
        coverage_profiles_collection = db["coverage_profiles"]

        coverage_profile_ids = [ObjectId(), ObjectId()]
        user_ids = [ObjectId(), ObjectId()]
        await coverage_profiles_collection.insert_many(
            [
                {
                    "_id": coverage_profile_ids[0],
                    "name": "Text Coverage",
                    "content_type": "text",
                    "created_by": user_ids[0],
                    "updated_by": user_ids[1],
                    "schema": {
                        "g2_content_type": {"required": True, "type": "list"},
                        "slugline": {"required": True, "type": "string"},
                    },
                    "editor": {
                        "g2_content_type": {"enabled": True, "index": 1},
                        "slugline": {"enabled": True, "index": 2},
                    },
                },
                {
                    "_id": str(coverage_profile_ids[1]),
                    "name": "Photo Coverage",
                    "content_type": "photo",
                    "created_by": user_ids[0],
                    "updated_by": user_ids[1],
                    "schema": {
                        "g2_content_type": {"required": True, "type": "list"},
                        "headline": {"required": True, "type": "string"},
                    },
                    "editor": {
                        "g2_content_type": {"enabled": True, "index": 1},
                        "headline": {"enabled": True, "index": 2},
                    },
                },
            ]
        )

        original_profiles = [
            await coverage_profiles_collection.find_one({"_id": coverage_profile_ids[0]}),
            await coverage_profiles_collection.find_one({"_id": str(coverage_profile_ids[1])}),
        ]
        self.assertIsNotNone(original_profiles[0])
        self.assertIsNotNone(original_profiles[1])
        await DataUpdate().forwards(planning_profiles_collection, db)

        for profile_index in range(2):
            original_profile = original_profiles[profile_index]
            self.assertIsNone(await coverage_profiles_collection.find_one({"_id": coverage_profile_ids[profile_index]}))
            migrated_profile = await planning_profiles_collection.find_one({"_id": coverage_profile_ids[profile_index]})
            self.assertIsNotNone(migrated_profile)
            self.assertDictContains(
                migrated_profile,
                {
                    "type": "coverage",
                    "original_creator": user_ids[0],
                    "version_creator": user_ids[1],
                    "content_type": original_profile["content_type"],
                    "schema": original_profile["schema"],
                    "editor": original_profile["editor"],
                },
            )
