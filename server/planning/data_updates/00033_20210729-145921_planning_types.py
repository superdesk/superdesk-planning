# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2021-07-29 14:59

from copy import deepcopy

from superdesk.commands.data_updates import BaseDataUpdate

from planning.content_profiles.profiles.event import DEFAULT_EVENT_PROFILE
from planning.content_profiles.profiles.planning import DEFAULT_PLANNING_PROFILE
from planning.content_profiles.profiles.coverage import DEFAULT_COVERAGE_PROFILE

DEFAULT_PROFILES = {
    "event": DEFAULT_EVENT_PROFILE,
    "planning": DEFAULT_PLANNING_PROFILE,
    "coverage": DEFAULT_COVERAGE_PROFILE,
}


class DataUpdate(BaseDataUpdate):
    resource = "planning_types"
    resource_types = ["event", "planning", "coverage"]

    def forwards(self, mongodb_collection, mongodb_database):
        for resource_type in self.resource_types:
            default_profile = deepcopy(DEFAULT_PROFILES[resource_type])
            existing_profile = mongodb_collection.find_one({"name": resource_type})

            if not existing_profile:
                # No need to process this Profile if the defaults are currently used
                continue

            updates = {
                "editor": default_profile["editor"],
                "schema": default_profile["schema"],
            }

            for config_type in updates.keys():
                for field, options in updates[config_type].items():
                    if (existing_profile.get(config_type) or {}).get(field):
                        updates[config_type][field].update(existing_profile[config_type][field])

            if default_profile.get("groups"):
                updates["groups"] = default_profile["groups"]

            mongodb_collection.update({"name": resource_type}, {"$set": updates})

    def backwards(self, mongodb_collection, mongodb_database):
        pass
