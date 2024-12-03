# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2024-09-20 14:13

from superdesk.commands.data_updates import BaseDataUpdate


class DataUpdate(BaseDataUpdate):
    resource = "planning_types"

    def forwards(self, mongodb_collection, mongodb_database):
        for resource_type in ["event", "planning"]:
            original_profile = mongodb_collection.find_one({"name": resource_type})
            if not original_profile:
                # No need to process this Profile if the defaults are currently used
                continue

            try:
                schema = original_profile["schema"]
                schema["subject"]["schema"]["schema"]["scheme"].pop("allowed", None)
            except (KeyError, TypeError):
                # ``subject`` or ``allowed`` is not currently set, no need to fix it
                continue

            mongodb_collection.update({"name": resource_type}, {"$set": {"schema": schema}})

    def backwards(self, mongodb_collection, mongodb_database):
        pass
