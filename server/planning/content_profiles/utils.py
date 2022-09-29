# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service


def get_planning_schema(resource: str):
    return get_resource_service("planning_types").find_one(req=None, name=resource)


def is_field_enabled(field, planning_type):
    editor = planning_type.get("editor", {})
    return editor.get(field, {}).get("enabled", False)


def is_field_editor_3(field: str, planning_type) -> bool:
    # planning_type = get_resource_service("planning_types").find_one(req=None, name=resource)
    return (
        is_field_enabled(field, planning_type)
        and ((planning_type.get("schema") or {}).get(field) or {}).get("field_type") == "editor_3"
    )
