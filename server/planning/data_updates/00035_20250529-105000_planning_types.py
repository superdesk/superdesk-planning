# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#

from superdesk.commands.data_updates import BaseDataUpdate


class DataUpdate(BaseDataUpdate):
    resource = "planning_types"

    def forwards(self, mongodb_collection, mongodb_database):
        for resource_type in ["events", "planning"]:
            profile = mongodb_collection.find_one({"name": resource_type})
            if not profile or not profile.get("schema") or not profile.get("editor"):
                continue

            schema = profile["schema"].copy()
            editor = profile["editor"].copy()

            custom_vocabularies_schema = schema.pop("custom_vocabularies", {})
            custom_vocabularies_editor = editor.pop("custom_vocabularies", {})

            if (
                custom_vocabularies_schema
                and custom_vocabularies_editor
                and custom_vocabularies_schema.get("vocabularies")
            ):
                custom_vocabularies = custom_vocabularies_schema["vocabularies"]
                mandatory = custom_vocabularies_schema.get("mandatory_in_list") or []

                for field in editor:
                    if not editor[field]:
                        continue
                    if editor[field].get("group") == custom_vocabularies_editor.get("group") and editor[field].get(
                        "index"
                    ) > custom_vocabularies_editor.get("index", 0):
                        editor[field]["index"] += (
                            len(custom_vocabularies) - 1
                        )  # add space for new fields - custom vocabularies field

                index = custom_vocabularies_editor.get("index", 0)
                for scheme in custom_vocabularies:
                    schema[scheme] = {
                        "type": "custom_vocabulary",
                        "required": scheme in mandatory or custom_vocabularies_schema.get("required", False),
                    }
                    editor[scheme] = {
                        "enabled": custom_vocabularies_editor.get("enabled", True),
                        "group": custom_vocabularies_editor.get("group"),
                        "index": index,
                    }
                    index += 1

            mongodb_collection.update_many({"name": resource_type}, {"$set": {"schema": schema, "editor": editor}})

    def backwards(self, mongodb_collection, mongodb_database):
        pass
