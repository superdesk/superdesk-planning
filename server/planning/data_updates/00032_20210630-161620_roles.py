# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2021-06-30 16:00

from superdesk.resource_fields import ID_FIELD
from superdesk.commands.data_updates import BaseDataUpdate


class DataUpdate(BaseDataUpdate):
    """Set `planning_global_filters` for roles with Planning privileges"""

    resource = "roles"

    def forwards(self, mongodb_collection, mongodb_database):
        for role in mongodb_collection.find({}) or []:
            privileges = role.get("privileges") or {}

            if privileges.get("planning") and (
                privileges.get("planning_event_management") or privileges.get("planning_planning_management")
            ):
                # Only add `planning_global_filters` privilege if the role has access
                # to manage either Events or Planning items
                privileges["planning_global_filters"] = 1

                mongodb_collection.update({"_id": role[ID_FIELD]}, {"$set": {"privileges": privileges}})

    def backwards(self, mongodb_collection, mongodb_database):
        raise NotImplementedError()
