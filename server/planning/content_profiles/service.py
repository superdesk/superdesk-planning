# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Any
from copy import deepcopy
from eve.utils import ParsedRequest

from superdesk.eve_async import AsyncBaseService, AsyncListCursor

from planning.common import planning_link_updates_to_coverage, get_config_event_related_item_search_provider_name
from .profiles import DEFAULT_PROFILES, DEFAULT_COVERAGE_PROFILE


class PlanningTypesService(AsyncBaseService):
    """Planning types service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    async def find_one_async(self, req, **lookup):
        try:
            planning_type = await super().find_one_async(req, **lookup)

            # lookup name from either **lookup of planning_item(if lookup has only '_id')
            lookup_name = lookup.get("name")
            if not lookup_name and planning_type:
                lookup_name = planning_type.get("name")

            default_planning_type = deepcopy(
                next(
                    (ptype for ptype in DEFAULT_PROFILES if ptype.get("name") == lookup_name),
                    {},
                )
            )
            if not planning_type:
                self._remove_unsupported_fields(default_planning_type)
                return default_planning_type

            self.merge_planning_type(planning_type, default_planning_type)
            return planning_type
        except IndexError:
            return None

    async def get_async(self, req, lookup):
        planning_types = await (await super().get_async(req, lookup)).to_list()
        merged_planning_types = []

        for default_planning_type in deepcopy(DEFAULT_PROFILES):
            planning_type = next(
                (p for p in planning_types if p.get("name") == default_planning_type.get("name")),
                None,
            )

            # If nothing is defined in database for this planning_type, use default
            if planning_type is None:
                self._remove_unsupported_fields(default_planning_type)
                merged_planning_types.append(default_planning_type)
            else:
                self.merge_planning_type(planning_type, default_planning_type)
                merged_planning_types.append(planning_type)

        return AsyncListCursor(merged_planning_types)

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
            updated_planning_type["editor"]["assignments"].update(
                (planning_type.get("editor") or {}).get("assignments", {})
            )
        elif planning_type["name"] in ["event", "planning", "coverage"]:
            for config_type in ["editor", "schema"]:
                planning_type.setdefault(config_type, {})
                for field, options in updated_planning_type[config_type].items():
                    # If this field is none, then it is of type `schema.NoneField()`
                    # no need to copy any schema
                    if updated_planning_type[config_type][field]:
                        updated_planning_type[config_type][field].update(planning_type[config_type].get(field) or {})
                for field, options in planning_type[config_type].items():
                    if field not in updated_planning_type[config_type]:
                        updated_planning_type[config_type][field] = options

        else:
            updated_planning_type["editor"].update(planning_type.get("editor", {}))
            updated_planning_type["schema"].update(planning_type.get("schema", {}))

        planning_type["schema"] = updated_planning_type["schema"]
        planning_type["editor"] = updated_planning_type["editor"]
        planning_type["groups"] = updated_planning_type["groups"]
        self._remove_unsupported_fields(planning_type)

    def _remove_unsupported_fields(self, planning_type: Dict[str, Any]):
        # Disable Event ``related_items`` field
        # if ``EVENT_RELATED_ITEM_SEARCH_PROVIDER_NAME`` config is not set
        if planning_type.get("name") == "event" and not get_config_event_related_item_search_provider_name():
            planning_type["editor"].pop("related_items", None)
            planning_type["schema"].pop("related_items", None)

        # Disable Coverage ``no_content_linking`` field
        # if ``PLANNING_LINK_UPDATES_TO_COVERAGES`` config is not ``True``
        if planning_type.get("name") == "coverage" and not planning_link_updates_to_coverage():
            planning_type["editor"].pop("no_content_linking", None)
            planning_type["schema"].pop("no_content_linking", None)


class ContentProfilesService(AsyncBaseService):
    async def get_async(self, req: ParsedRequest, lookup: dict[str, Any] | None) -> AsyncListCursor:
        """Get all content profiles with default fields merged in.

        Retrieves content profiles from the database and merges each one with DEFAULT_COVERAGE_PROFILE
        to ensure that any new fields added to the default profile become available in existing
        database entries while preserving customizations.

        Args:
            req: The request object
            lookup: Database lookup parameters

        Returns:
            AsyncListCursor: Cursor containing merged content profiles
        """
        content_profiles = await (await super().get_async(req, lookup)).to_list()
        merged_content_profiles = []

        for content_profile in content_profiles:
            self.merge_content_profile(content_profile, DEFAULT_COVERAGE_PROFILE)
            merged_content_profiles.append(content_profile)

        return AsyncListCursor(merged_content_profiles)

    def merge_content_profile(self, db_content_profile: dict[str, Any], default_coverage_profile: dict[str, Any]):
        """Merge database content profile with default coverage profile to add any new fields.

        This method ensures that database content profiles get any new fields from the default
        coverage profile while preserving existing customizations. For each field in the default
        profile's editor and schema sections:
        - If the field doesn't exist in the database profile, it's added from the default
        - If the field exists in both, they're merged with database values taking precedence

        Args:
            content_profile (dict): The content profile from the database to be updated
            default_coverage_profile (dict): The default coverage profile to merge from
        """
        updated_content_profile = deepcopy(default_coverage_profile)

        for config_type in ["editor", "schema"]:
            db_content_profile.setdefault(config_type, {})
            for field, options in updated_content_profile[config_type].items():
                # if this field exists in default but not in database, add it
                if field not in db_content_profile[config_type]:
                    db_content_profile[config_type][field] = options

                # if field exists in both, merge the options (database take precedence)
                elif updated_content_profile[config_type][field]:
                    merged_options = deepcopy(updated_content_profile[config_type][field])
                    merged_options.update(db_content_profile[config_type][field])
                    db_content_profile[config_type][field] = merged_options
