# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from superdesk.metadata.item import metadata_schema


planning_types_schema = {
    # The name identifies the form in the UI to which the type relates
    "_id": {
        "type": "string",
        "iunique": True,
        "required": True,
        "nullable": False,
        "empty": False,
    },
    "name": {
        "type": "string",
        "iunique": True,
        "required": True,
        "nullable": False,
        "empty": False,
    },
    # editor controls which fields are visible in the UI
    "editor": {
        "type": "dict",
        "schema": {},
        "allow_unknown": True,
        "keysrules": {"type": "string"},
    },
    # schema controls the validation of fields at the front end.
    "schema": {
        "type": "dict",
        "schema": {},
        "allow_unknown": True,
        "keysrules": {"type": "string"},
    },
    # list of groups (and their translations) for grouping of fields in the Editor
    "groups": {
        "type": "dict",
        "schema": {},
        "allow_unknown": True,
        "keysrules": {"type": "string"},
    },
    # postSchema controls the validation of fields when posting.
    "postSchema": {
        "type": "dict",
        "schema": {},
        "allow_unknown": True,
        "keysrules": {"type": "string"},
    },
    # list fields config
    "list": {
        "type": "dict",
        "schema": {},
        "allow_unknown": True,
        "keysrules": {"type": "string"},
    },
    # list fields when seeing events/planning when exporting or downloading
    "export_list": {"type": "list", "schema": {"type": "string"}},
    # Audit Information
    "created_by": superdesk.Resource.rel("users", nullable=True),
    "updated_by": superdesk.Resource.rel("users", nullable=True),
    "firstcreated": metadata_schema["firstcreated"],
    "versioncreated": metadata_schema["versioncreated"],
    "init_version": {
        "type": "integer",
    },
}


class PlanningTypesResource(superdesk.Resource):
    endpoint_name = "planning_types"
    schema = planning_types_schema
    merge_nested_documents = True
    item_url = r'regex("[-_\w]+")'

    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "PATCH"]
    privileges = {
        "POST": "planning_manage_content_profiles",
        "PATCH": "planning_manage_content_profiles",
    }
