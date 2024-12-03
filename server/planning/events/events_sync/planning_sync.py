# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List, Set

from planning.types import StringFieldTranslation
from planning.content_profiles.utils import AllContentProfileData

from .common import SyncData, get_enabled_subjects


def get_normalised_field_value(item, field):
    value = item.get(field)
    if field in ["place", "anpa_category"]:
        # list of CV items, return their qcode
        return sorted([cv_item.get("qcode") for cv_item in value or []])
    elif field == "subject":
        # list of subjects, return those without a scheme set
        return sorted([cv_item.get("qcode") for cv_item in value or [] if cv_item.get("scheme") is None])
    elif field == "custom_vocabularies":
        # list of subjects, return those WITH a scheme set
        return sorted([cv_item.get("qcode") for cv_item in value or [] if cv_item.get("scheme") is not None])
    else:
        # This should cater to the plain (or list of string) fields, such as:
        # "slugline", "internal_note", "name", "ednote", "definition_short",
        # "description_text", "priority", "language", "languages"
        return value


def _sync_planning_field(sync_data: SyncData, field: str):
    original_value_normalised = get_normalised_field_value(sync_data.event.original, field)
    updated_value_normalised = get_normalised_field_value(sync_data.event.updates, field)

    if original_value_normalised == updated_value_normalised:
        # no changes to the value of this field
        return

    planning_value_normalised = get_normalised_field_value(
        sync_data.planning.original, "description_text" if field == "definition_short" else field
    )

    if planning_value_normalised != original_value_normalised:
        return

    # The Planning field has the same value as the Event field,
    # So we can copy the new value from the Event
    new_value = sync_data.event.updates.get(field)
    if field in ["subject", "custom_vocabularies"]:
        sync_data.planning.updates.setdefault("subject", [])
        if new_value is not None:
            sync_data.planning.updates["subject"] += new_value
    else:
        sync_data.planning.updates[field] = new_value
    sync_data.update_planning = True


def _sync_planning_multilingual_field(sync_data: SyncData, field: str, profiles: AllContentProfileData):
    if (
        field not in sync_data.event.updated_translations
        or field not in profiles.events.multilingual_fields
        or field not in profiles.planning.multilingual_fields
    ):
        return

    for language, updated_value in sync_data.event.updated_translations[field].items():
        try:
            original_value = sync_data.event.original_translations[field][language]
        except KeyError:
            original_value = ""

        try:
            planning_value = sync_data.planning.original_translations[field][language]
        except KeyError:
            planning_value = ""

        if original_value == updated_value or planning_value != original_value:
            continue

        sync_data.planning.updated_translations.setdefault(field, {})
        sync_data.planning.updated_translations[field][language] = updated_value
        sync_data.update_translations = True


def _sync_coverage_field(sync_data: SyncData, field: str, profiles: AllContentProfileData):
    field_is_multilingual = (
        field in sync_data.event.updated_translations
        and field in profiles.events.multilingual_fields
        and field in profiles.planning.multilingual_fields
    )

    for coverage in sync_data.coverage_updates:
        if not coverage.get("coverage_id"):
            # This is a new Coverage, which it's metadata would have already been synced
            # We can safely skip this one
            continue

        # All supported fields are under the ``coverage.planning`` dictionary
        coverage.setdefault("planning", {})
        try:
            coverage_value = coverage["planning"][field]
        except KeyError:
            coverage_value = ""

        coverage_language = coverage["planning"].get("language")
        original_value = sync_data.event.original.get(field)
        updated_value = sync_data.event.updates.get(field)

        if field_is_multilingual and coverage_language is not None:
            try:
                original_value = sync_data.event.original_translations[field][coverage_language]
            except KeyError:
                pass

            try:
                updated_value = sync_data.event.updated_translations[field][coverage_language]
            except KeyError:
                pass

        if coverage_value != original_value:
            continue

        # The Coverage field has the same value as the Event field
        # So we can copy the new value from the Event
        coverage["planning"][field] = updated_value
        sync_data.update_coverages = True


def sync_existing_planning_item(
    sync_data: SyncData,
    sync_fields: Set[str],
    profiles: AllContentProfileData,
    coverage_sync_fields: Set[str],
):
    for field in sync_fields:
        _sync_planning_field(sync_data, field)
        _sync_planning_multilingual_field(sync_data, field, profiles)
        if field in coverage_sync_fields:
            _sync_coverage_field(sync_data, field, profiles)

    if sync_data.planning.updates.get("subject"):
        sync_data.planning.updates["subject"] = get_enabled_subjects(sync_data.planning.updates, profiles.planning)

    if sync_data.update_translations:
        translations: List[StringFieldTranslation] = []
        for field in sync_data.planning.updated_translations.keys():
            translations.extend(
                [
                    {
                        "field": field,
                        "language": language,
                        "value": value,
                    }
                    for language, value in sync_data.planning.updated_translations[field].items()
                ]
            )
        sync_data.planning.updates["translations"] = translations
        sync_data.update_planning = True

    if sync_data.update_coverages:
        sync_data.planning.updates["coverages"] = sync_data.coverage_updates
        sync_data.update_planning = True
