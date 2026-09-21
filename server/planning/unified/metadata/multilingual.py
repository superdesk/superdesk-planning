from planning.types.unified import FieldTranslation
from planning.content_profiles.utils import AllContentProfileData

from .common import SyncData


def get_translated_fields(translations: list[FieldTranslation] | None) -> dict[str, dict[str, str]]:
    if not translations:
        return {}

    fields: dict[str, dict[str, str]] = {}
    for translation in translations:
        fields.setdefault(translation.field, {})
        fields[translation.field][translation.language] = translation.value
    return fields


def _sync_planning_multilingual_field(sync_data: SyncData, field: str, profiles: AllContentProfileData) -> bool:
    if (
        field not in sync_data.event.updated_translations
        or field not in profiles.events.multilingual_fields
        or field not in profiles.planning.multilingual_fields
    ):
        return False

    translations_updated = False
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

        sync_data.planning.updated_translations.setdefault(field, {})[language] = updated_value
        translations_updated = True

    if translations_updated:
        sync_data.update_translations = translations_updated

    return translations_updated
