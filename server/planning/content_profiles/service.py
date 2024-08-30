# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy

import superdesk
from superdesk.utils import ListCursor

from planning.common import planning_link_updates_to_coverage, get_config_event_related_item_search_provider_name
from .profiles import DEFAULT_PROFILES


class PlanningTypesService(superdesk.Service):
    """Planning types service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    def find_one(self, req, **lookup):
        try:
            planning_type = super().find_one(req, **lookup)

            # lookup name from either **lookup of planning_item(if lookup has only '_id')
            lookup_name = lookup.get("name")
            if not lookup_name and planning_type:
                lookup_name = planning_type.get("name")

            default_planning_type = next(
                (ptype for ptype in DEFAULT_PROFILES if ptype.get("name") == lookup_name),
                None,
            )
            if not planning_type:
                return default_planning_type

            self.merge_planning_type(planning_type, default_planning_type)
            return planning_type
        except IndexError:
            return None

    def get(self, req, lookup):
        planning_types = list(super().get(req, lookup))
        merged_planning_types = []

        for default_planning_type in DEFAULT_PROFILES:
            planning_type = next(
                (p for p in planning_types if p.get("name") == default_planning_type.get("name")),
                None,
            )

            # If nothing is defined in database for this planning_type, use default
            if planning_type is None:
                merged_planning_types.append(default_planning_type)
            else:
                self.merge_planning_type(planning_type, default_planning_type)
                merged_planning_types.append(planning_type)

        if not planning_link_updates_to_coverage():
            coverage_type = [t for t in merged_planning_types if t["name"] == "coverage"][0]
            coverage_type["editor"]["no_content_linking"]["enabled"] = False

        return ListCursor(merged_planning_types)

    def merge_planning_type(self, planning_type, default_planning_type):
        # Update schema fields with database schema fields
        default_type = {"schema": {}, "editor": {}}
        updated_planning_type = deepcopy(default_planning_type or default_type)

        updated_planning_type.setdefault("groups", {})
        updated_planning_type["groups"].update(planning_type.get("groups", {}))

        if planning_type["name"] == "advanced_search":
            updated_planning_type["schema"].update(planning_type.get("schema", {}))
            updated_planning_type["editor"]["event"].update((planning_type.get("editor") or {}).get("event"))
            updated_planning_type["editor"]["planning"].update((planning_type.get("editor") or {}).get("planning"))
            updated_planning_type["editor"]["combined"].update((planning_type.get("editor") or {}).get("combined"))
        elif planning_type["name"] in ["event", "planning", "coverage"]:
            for config_type in ["editor", "schema"]:
                planning_type.setdefault(config_type, {})
                for field, options in updated_planning_type[config_type].items():
                    # If this field is none, then it is of type `schema.NoneField()`
                    # no need to copy any schema
                    if updated_planning_type[config_type][field]:
                        updated_planning_type[config_type][field].update(planning_type[config_type].get(field) or {})
        else:
            updated_planning_type["editor"].update(planning_type.get("editor", {}))
            updated_planning_type["schema"].update(planning_type.get("schema", {}))

        planning_type["schema"] = updated_planning_type["schema"]
        planning_type["editor"] = updated_planning_type["editor"]
        planning_type["groups"] = updated_planning_type["groups"]

        # Disable Event ``related_items`` field
        # if ``EVENT_RELATED_ITEM_SEARCH_PROVIDER_NAME`` config is not set
        if planning_type["name"] == "event":
            if not get_config_event_related_item_search_provider_name():
                planning_type["editor"].pop("related_items", None)
                planning_type["schema"].pop("related_items", None)
