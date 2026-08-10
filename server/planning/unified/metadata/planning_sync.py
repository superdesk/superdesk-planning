from planning.types.unified import UnifiedPlanningResource, FieldTranslation, Subject, CVItem
from planning.content_profiles.utils import AllContentProfileData
from planning.common import TEMP_ID_PREFIX

from .common import SyncData, get_enabled_subjects


def get_normalised_field_value(
    item: UnifiedPlanningResource | None, field: str
) -> str | list[Subject] | list[CVItem] | None:
    if item is None:
        return None

    value = getattr(item, field, None)
    # value = item.get(field)
    if field in ["place", "anpa_category"]:
        # list of CV items, return their qcode
        return sorted([cv_item.qcode for cv_item in value or []])
    elif field == "subject":
        # list of subjects, return those without a scheme set
        return sorted([cv_item.qcode for cv_item in value or [] if cv_item.scheme is None])
    elif field == "custom_vocabularies":
        # list of subjects, return those WITH a scheme set
        return sorted([cv_item.qcode for cv_item in value or [] if cv_item.scheme is not None])
    else:
        # This should cater to the plain (or list of string) fields, such as:
        # "slugline", "internal_note", "name", "ednote", "definition_short",
        # "description_text", "priority", "language", "languages"
        return value


def _get_planning_field_from_event(field: str) -> str:
    return "description_text" if field == "definition_short" else field


def _sync_planning_field(sync_data: SyncData, field: str) -> None:
    original_value_normalised = get_normalised_field_value(sync_data.event.original, field)
    updated_value_normalised = get_normalised_field_value(sync_data.event.updates, field)

    if original_value_normalised == updated_value_normalised:
        # no changes to the value of this field
        return

    planning_value_normalised = get_normalised_field_value(
        sync_data.planning.original, _get_planning_field_from_event(field)
    )

    if planning_value_normalised != original_value_normalised:
        return

    # The Planning field has the same value as the Event field,
    # So we can copy the new value from the Event
    new_value = getattr(sync_data.event.updates, field, None)
    if field in ["subject", "custom_vocabularies"]:
        if not sync_data.planning.updates.subject:
            sync_data.planning.updates.subject = []
        if new_value is not None:
            sync_data.planning.updates.subject += new_value
    else:
        setattr(sync_data.planning.updates, field, new_value)
    sync_data.update_planning = True


def _sync_planning_multilingual_field(sync_data: SyncData, field: str, profiles: AllContentProfileData) -> None:
    planning_field = _get_planning_field_from_event(field)
    if (
        field not in sync_data.event.updated_translations
        or field not in profiles.events.multilingual_fields
        or planning_field not in profiles.planning.multilingual_fields
    ):
        return

    for language, updated_value in sync_data.event.updated_translations[field].items():
        try:
            original_value = sync_data.event.original_translations[field][language]
        except KeyError:
            original_value = ""

        try:
            planning_value = sync_data.planning.original_translations[planning_field][language]
        except KeyError:
            planning_value = ""

        if original_value == updated_value or planning_value != original_value:
            continue

        sync_data.planning.updated_translations.setdefault(planning_field, {})[language] = updated_value
        sync_data.update_translations = True


def _sync_coverage_field(sync_data: SyncData, field: str, profiles: AllContentProfileData) -> None:
    field_is_multilingual = (
        field in sync_data.event.updated_translations
        and field in profiles.events.multilingual_fields
        and field in profiles.planning.multilingual_fields
    )

    for coverage in sync_data.coverage_updates:
        if coverage.coverage_id.startswith(TEMP_ID_PREFIX):
            # This is a new Coverage, which it's metadata would have already been synced
            # We can safely skip this one
            continue

        # All supported fields are under the ``coverage.planning`` dictionary
        # coverage.planning
        # coverage.setdefault("planning", {})
        try:
            coverage_value = getattr(coverage.planning, field, None)
        except KeyError:
            coverage_value = ""

        coverage_language = coverage.planning.language
        original_value = getattr(sync_data.event.original, field, None)
        updated_value = getattr(sync_data.event.updates, field, None)

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
        setattr(coverage.planning, field, updated_value)
        sync_data.update_coverages = True


def sync_existing_planning_item(
    sync_data: SyncData,
    sync_fields: set[str],
    profiles: AllContentProfileData,
    coverage_sync_fields: set[str],
) -> None:
    for field in sync_fields:
        _sync_planning_field(sync_data, field)
        _sync_planning_multilingual_field(sync_data, field, profiles)
        if field in coverage_sync_fields:
            _sync_coverage_field(sync_data, field, profiles)

    if sync_data.planning.updates.subject:
        sync_data.planning.updates.subject = get_enabled_subjects(sync_data.planning.updates, profiles.planning)

    if sync_data.update_translations:
        translations: list[FieldTranslation] = []
        for field in sync_data.planning.updated_translations.keys():
            translations.extend(
                [
                    FieldTranslation(field=field, language=language, value=value)
                    for language, value in sync_data.planning.updated_translations[field].items()
                ]
            )
        sync_data.planning.updates.translations = translations
        sync_data.update_planning = True

    if sync_data.update_coverages:
        sync_data.planning.updates.coverages = sync_data.coverage_updates
        sync_data.update_planning = True
