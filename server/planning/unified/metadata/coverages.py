from typing import Any

import logging

from superdesk.core import get_config

from planning.types import UnifiedPlanningResource, CoverageItem, CoverageProfile
from planning.content_profiles.utils import (
    get_coverage_schema,
    get_custom_vocabulary_fields_from_profile,
    get_enabled_fields,
)

from .multilingual import get_translated_fields

logger = logging.getLogger(__name__)


def _get_enabled_fields(schema: CoverageProfile) -> tuple[set[str], set[str]]:
    supported_fields = {
        "anpa_category",
        "subject",
        "priority",
        "location",
        "headline",
        "slugline",
        "name",
        "abstract",
        "calendars",
        "agendas",
        "place",
        "definition_short",
        "definition_long",
        "keyword",
        "urgency",
    }

    custom_vocabulary_fields = get_custom_vocabulary_fields_from_profile(schema)
    enabled_fields = {
        field
        for field in get_enabled_fields(schema)
        if field in supported_fields and field not in custom_vocabulary_fields
    }
    return enabled_fields, custom_vocabulary_fields


async def sync_item_to_coverage(item: UnifiedPlanningResource, coverage: CoverageItem) -> None:
    """
    Inherit planning metadata fields to coverage if not explicitly set in coverage profile.
    The fields inherited are those overlapping metadata fields from the planning schema and coverage schema
    """

    schema = await get_coverage_schema(coverage.profile)
    if coverage.profile and coverage.profile != schema.id:
        logger.warning(
            "Issue copying Planning metadata to Coverage, CoverageProfile not found",
            extra=dict(
                coverage_id=coverage.coverage_id,
                profile=coverage.profile,
            ),
        )

    enabled_fields, custom_vocabulary_fields = _get_enabled_fields(schema.to_dict())
    translations = get_translated_fields(item.translations)
    language = coverage.planning.language or get_config(str, "DEFAULT_LANGUAGE")

    for field in enabled_fields:
        updated_value: Any

        if field == "subject":
            continue
        elif field == "keyword":
            # In Coverages the field is `keyword`, but in Events/Planning it's `keywords`
            field = "keywords"
            updated_value = item.keywords
        else:
            translated_value = translations.get(field, {}).get(language)
            updated_value = translated_value or getattr(item, field, None)

        if updated_value and not getattr(coverage.planning, field, None):
            setattr(coverage.planning, field, updated_value)

    if item.subject and not coverage.planning.subject:
        # Copy ``Subject`` and ``Custom Vocabulary`` fields that are enabled in both Planning and Coverage profiles
        coverage.planning.subject = [
            subject
            for subject in item.subject
            if ((not subject.scheme and "subject" in enabled_fields) or (subject.scheme in custom_vocabulary_fields))
        ]
