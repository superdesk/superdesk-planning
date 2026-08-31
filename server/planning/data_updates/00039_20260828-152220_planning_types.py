# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2026-08-28 15:22

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from superdesk.commands.data_updates import BaseDataUpdate

from planning.types import PlanningProfileType


class DataUpdate(BaseDataUpdate):
    resource = "planning_types"
    use_async_resources: bool = True

    async def forwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase):
        async for profile in collection.find({}):
            await self._upgrade_planning_type(profile, collection)

        coverages_collection = database["coverage_profiles"]
        async for profile in coverages_collection.find({}):
            await self._migrate_coverage_profiles(profile, collection, coverages_collection)

    async def _upgrade_planning_type(self, profile: dict, collection: AsyncIOMotorCollection):
        original_id = profile["_id"]
        new_id = self._get_profile_id(original_id)
        create_new = new_id != original_id

        # Attempt to get the `type` of the item, based on either the `_id` or `name` attributes
        profile_type: PlanningProfileType | None = None
        try:
            profile_type = PlanningProfileType(original_id)
        except ValueError:
            try:
                profile_type = PlanningProfileType(profile.get("name"))
            except ValueError:
                pass

        if not profile_type:
            print("Failed to determine the profile type of the item, deleting this profile")
            print(profile)
            response = await collection.delete_one({"_id": original_id})
            if not response.acknowledged or not response.deleted_count:
                print(f"Failed to delete the invalid profile '{original_id}'")
                print(response)
            return

        updates: dict = {
            "type": profile_type,
            # Migrate the audit information to a common format
            "original_creator": profile.pop("created_by", None),
            "version_creator": profile.pop("updated_by", None),
        }

        if profile_type == PlanningProfileType.PLANNING:
            # When migrating to UnifiedPlanningResource `description_text` is now `definition_long`
            description_text_schema = (profile.get("schema") or {}).pop("description_text", None)
            if description_text_schema:
                profile["schema"]["definition_long"] = description_text_schema
                updates["schema"] = profile["schema"]

            description_text_editor = (profile.get("editor") or {}).pop("description_text", None)
            if description_text_editor:
                profile["editor"]["definition_long"] = description_text_editor
                updates["editor"] = profile["editor"]

        if not create_new:
            update_response = await collection.update_one(
                {"_id": original_id}, {"$set": updates, "$unset": {"created_by": 1, "updated_by": 1}}
            )
            if not update_response.acknowledged or not update_response.modified_count:
                print(f"Failed to update the existing profile '{original_id}'")
                print(update_response)
                print(updates)
            return
        else:
            profile.update(updates)
            profile["_id"] = new_id
            insert_response = await collection.insert_one(profile)
            if not insert_response.acknowledged:
                print("Failed to migrate the profile to a new document")
                print(insert_response)
                print(profile)
                return

            delete_response = await collection.delete_one({"_id": original_id})
            if not delete_response.acknowledged or not delete_response.deleted_count:
                print("Failed to delete the old profile")
                print(delete_response)

    async def _migrate_coverage_profiles(
        self, profile: dict, profiles_collection: AsyncIOMotorCollection, coverages_collection: AsyncIOMotorCollection
    ):
        original_id = profile["_id"]
        profile["_id"] = self._get_profile_id(original_id)

        # Migrate the audit information to a common format
        profile.update(
            {
                "type": PlanningProfileType.COVERAGE,
                "original_creator": profile.pop("created_by", None),
                "version_creator": profile.pop("updated_by", None),
            }
        )
        insert_response = await profiles_collection.insert_one(profile)
        if not insert_response.acknowledged:
            print("Failed to copy the Coverage profile")
            print(insert_response)
            return

        delete_response = await coverages_collection.delete_one({"_id": original_id})
        if not delete_response.acknowledged or not delete_response.deleted_count:
            print("Failed to delete the original Coverage profile")
            print(delete_response)

    def _get_profile_id(self, original_id: str | ObjectId) -> ObjectId:
        if isinstance(original_id, ObjectId):
            return original_id

        # This is an older profile, we must delete this one and create a new one
        try:
            # If the existing one is a valid ObjectId string, convert it to an ObjectId instance
            return ObjectId(original_id)
        except InvalidId:
            # Otherwise create a new one
            return ObjectId()

    async def backwards(self, collection: AsyncIOMotorCollection, database: AsyncIOMotorDatabase):
        raise NotImplementedError()
