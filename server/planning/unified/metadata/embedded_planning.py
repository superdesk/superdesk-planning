from collections.abc import AsyncGenerator
import logging
from copy import deepcopy

from quart_babel import gettext

from superdesk.core import get_config
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.errors import SuperdeskApiError

from planning.types import WorkflowState
from planning.types.unified import (
    UnifiedPlanningResource,
    EmbeddedPlanningItem,
    FieldTranslation,
    RelatedEventLink,
    RelatedEventLinkType,
    EmbeddedPlanningCoverage,
    CoverageItem,
    CoverageAssignedTo,
    PlanningItemType,
    ItemDates,
    CoveragePlanning,
)
from planning.content_profiles.utils import AllContentProfileData
from planning.utils import get_planning_event_link_method

from .common import VocabsSyncData, get_enabled_subjects

logger = logging.getLogger(__name__)

PLANNING_FIELDS_TO_SYNC = {
    "slugline",
    "internal_note",
    "name",
    "place",
    "anpa_category",
    "ednote",
    "language",
    "definition_short",
    "definition_long",
    "agendas",
    "headline",
    "urgency",
    "priority",
    "location",
    "event_contact_info",
    "links",
    "reference",
    "calendars",
    "registration_details",
    "invitation_details",
    "accreditation_info",
    "accreditation_deadline",
    "keywords",
}

COVERAGE_PLANNING_FIELDS_TO_SYNC = {
    "ednote",
    "slugline",
    "headline",
    "internal_note",
    "priority",
    "anpa_category",
    "keyword",
    "location",
    "name",
    "urgency",
    "calendars",
    "agendas",
    "place",
    "definition_long",
    "definition_short",
}


async def create_new_plannings_from_embedded_planning(
    event: UnifiedPlanningResource,
    event_translations: dict[str, dict[str, str]],
    embedded_planning: list[EmbeddedPlanningItem],
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
) -> None:
    if not len(embedded_planning):
        return

    new_plannings: list[UnifiedPlanningResource] = []
    planning_fields = set(
        field for field in PLANNING_FIELDS_TO_SYNC if field in profiles.planning.enabled_fields
    )

    multilingual_enabled = profiles.events.is_multilingual and profiles.planning.is_multilingual
    translations: list[FieldTranslation] = []
    if multilingual_enabled and "language" in planning_fields and len(event.translations or []):
        planning_fields.add("languages")

        translations = [
            translation
            for translation in event.translations or []
            if translation.field is not None and translation.field in profiles.planning.enabled_fields
        ]

    event_link_method = get_planning_event_link_method()
    link_type: RelatedEventLinkType = (
        RelatedEventLinkType.SECONDARY if event_link_method == "many_secondary" else RelatedEventLinkType.PRIMARY
    )
    related_event = RelatedEventLink(_id=event.id, link_type=link_type)

    if event.recurrence_id:
        related_event.recurrence_id = event.recurrence_id

    for plan in embedded_planning:
        if plan.planning_id:
            # Skip this item, as it's an existing Planning item
            continue

        new_planning = UnifiedPlanningResource(
            agendas=[],
            item_class="plinat:newscoverage",
            state=WorkflowState.DRAFT,
            type=PlanningItemType.PLANNING,
            language=event.language,
            languages=event.languages,
            dates=ItemDates(
                start=event.dates.start,
                all_day=get_config(bool, "PLANNING_PLANNING_ALL_DAY", False)
            ),
            related_events=[related_event],
            coverages=[]
        )

        try:
            new_planning.update_method = plan.update_method
        except KeyError:
            pass

        if event.recurrence_id:
            new_planning.recurrence_id = event.recurrence_id

        for field in planning_fields:
            event_value = getattr(event, field, None)
            if event_value:
                # The Event item contains a value for this field (excluding ``None``), use that
                setattr(new_planning, field, event_value)

        new_planning.subject = get_enabled_subjects(event, profiles.planning)

        if translations:
            new_planning.translations = translations

        if plan.coverages:
            new_planning.coverages = []
            for embedded_coverage in plan.coverages:
                # Make sure to create a new tempId here so the service knows this is a new Coverage
                embedded_coverage.coverage_id = f"tempId-{generate_guid(type=GUID_NEWSML)}"
                new_planning.coverages.append(
                    create_new_coverage_from_event_and_planning(
                        event, event_translations, new_planning, embedded_coverage, profiles, vocabs
                    )
                )

        new_plannings.append(new_planning)

    if len(new_plannings):
        await UnifiedPlanningResource.get_service().create(new_plannings)


def create_new_coverage_from_event_and_planning(
    event: UnifiedPlanningResource,
    event_translations: dict[str, dict[str, str]],
    planning: UnifiedPlanningResource,
    coverage: EmbeddedPlanningCoverage,
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
) -> CoverageItem:
    try:
        news_coverage_status_qcode = coverage.news_coverage_status
    except KeyError:
        news_coverage_status_qcode = "ncostat:int"

    news_coverage_status = vocabs.coverage_states.get(news_coverage_status_qcode)
    if not news_coverage_status:
        raise SuperdeskApiError.badRequestError(gettext(f"Invalid news_coverage_status '{news_coverage_status_qcode}'"))

    new_coverage = CoverageItem(
        original_creator=planning.original_creator or event.original_creator,
        version_creator=(
            planning.version_creator or event.version_creator or planning.original_creator or event.original_creator
        ),
        firstcreated=planning.firstcreated or event.firstcreated,
        versioncreated=planning.versioncreated or event.versioncreated,
        news_coverage_status=news_coverage_status,
        workflow_status=WorkflowState.DRAFT,
        planning=CoveragePlanning(
            scheduled=coverage.scheduled or planning.dates.start,
            g2_content_type=coverage.g2_content_type,
        ),
    )

    if coverage.desk or coverage.user or coverage.coverage_provider:
        new_coverage.assigned_to = CoverageAssignedTo(
            desk=coverage.desk,
            user=coverage.user,
            coverage_provider=coverage.coverage_provider,
        )

    coverage_profile = profiles.get_coverage_profile(coverage.g2_content_type)
    if "language" in coverage_profile.enabled_fields:
        # If ``language`` is enabled for Coverages but not defined in ``embedded_planning``
        # then fallback to the language from the Planning item or Event
        if coverage.language:
            new_coverage.planning.language = coverage.language
        elif len(planning.languages or []):
            new_coverage.planning.language = planning.languages[0]
        elif planning.language:
            new_coverage.planning.language = planning.language
        elif len(event.languages or []):
            new_coverage.planning.language = event.languages[0]
        elif event.language:
            new_coverage.planning.language = event.language

    try:
        coverage_language = new_coverage.planning.language
    except (KeyError, TypeError):
        coverage_language = None

    coverage_planning_fields = set(
        field for field in COVERAGE_PLANNING_FIELDS_TO_SYNC if field in coverage_profile.enabled_fields
    )
    for field in coverage_planning_fields:
        if field == "keyword":
            # The CoverageProfile uses `keyword` for the config while the storage layer uses `keywords`
            # This minimises the changes required on the front-end
            field = "keywords"

        coverage_value = getattr(coverage, field, None)
        if coverage_value:
            # If the value (excluding ``None``) is already provided in the Coverage, then use that
            setattr(new_coverage.planning, field, coverage_value)
            continue

        if coverage_language is not None:
            # If the Coverage has a language defined, then try and get the value
            # from the Event's translations array for this field
            try:
                setattr(new_coverage.planning, field, event_translations[field][coverage_language])
                continue
            except (KeyError, TypeError):
                pass

        parent_item_value = getattr(planning, field) or getattr(event, field)
        if parent_item_value:
            # Planning or Event item contains the value for this field (excluding ``None``), use that
            setattr(new_coverage.planning, field, parent_item_value)

        # Was unable to determine what value to give this field, leave it out of the new coverage
        # otherwise we would be setting the value to ``None``, which is not supported in all fields (like slugline)

    if "genre" in coverage_profile.enabled_fields and coverage.genre is not None:
        genre = vocabs.genres.get(coverage.genre)
        if genre:
            new_coverage.planning.genre = [genre]

    return new_coverage


async def get_existing_plannings_from_embedded_planning(
    event: UnifiedPlanningResource,
    event_translations: dict[str, dict[str, str]],
    embedded_planning: list[EmbeddedPlanningItem],
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
) -> AsyncGenerator[tuple[UnifiedPlanningResource, dict, bool], None]:
    existing_planning_ids: list[str] = [plan.planning_id for plan in embedded_planning if plan.planning_id]

    if not len(existing_planning_ids):
        return

    existing_plannings: dict[str, UnifiedPlanningResource] = {
        item.id: item for item in await UnifiedPlanningResource.get_service().find_by_ids(existing_planning_ids)
    }

    for embedded_plan in embedded_planning:
        planning_id = embedded_plan.planning_id
        if not planning_id:
            # This is a new Planning item, which should have already been handled in
            # ``create_new_plannings_from_embedded_planning``
            continue

        try:
            existing_planning = existing_plannings[planning_id]
        except KeyError:
            logger.warning(f"Failed to find planning item '{planning_id}' from embedded coverage")
            continue

        existing_coverage_ids = {coverage.coverage_id for coverage in existing_planning.coverages or []}
        existing_embedded_coverages = {
            coverage.coverage_id: coverage
            for coverage in embedded_plan.coverages
            if not coverage.coverage_id.startswith("tempId-")
            and coverage.coverage_id in existing_coverage_ids
        }
        update_required = len(existing_planning.coverages or []) != len(embedded_plan.coverages)
        updated_coverages: list[CoverageItem] = [
            coverage
            for coverage in deepcopy(existing_planning.coverages or [])
            if coverage.coverage_id in existing_embedded_coverages
        ]

        for existing_coverage in updated_coverages:
            try:
                embedded_coverage: EmbeddedPlanningCoverage = existing_embedded_coverages[existing_coverage.coverage_id]
            except KeyError:
                # Coverage not found in Event's EmbeddedCoverages
                # We can safely skip this one
                continue

            try:
                coverage_planning = existing_coverage.planning
            except KeyError:
                coverage_planning = None

            if coverage_planning is not None:
                coverage_profile = profiles.get_coverage_profile(existing_coverage.planning.g2_content_type)
                coverage_planning_fields = set(
                    field for field in COVERAGE_PLANNING_FIELDS_TO_SYNC | {"g2_content_type", "scheduled"}
                    if field in coverage_profile.enabled_fields
                )
                for field in coverage_planning_fields:
                    try:
                        if field not in embedded_coverage.model_fields_set:
                            # This field was not provided through the API, skip it
                            continue
                        elif getattr(coverage_planning, field) != getattr(embedded_coverage, field):  # type: ignore
                            setattr(coverage_planning, field, getattr(embedded_coverage, field))  # type: ignore
                            update_required = True

                            if getattr(coverage_planning, field, None) is None and field in [
                                "slugline",
                                "headline",
                                "internal_note",
                                "ednote",
                            ]:
                                setattr(coverage_planning, field, "")
                    except KeyError:
                        pass

                try:
                    if (
                        "genre" in coverage_profile.enabled_fields
                        and coverage_planning.genre != embedded_coverage.genre
                        and embedded_coverage.genre
                        and vocabs.genres.get(embedded_coverage.genre)
                    ):
                        if not embedded_coverage.genre:
                            coverage_planning.genre = None
                        elif vocabs.genres.get(embedded_coverage.genre):
                            coverage_planning.genre = [vocabs.genres[embedded_coverage.genre]]
                        update_required = True
                except KeyError:
                    pass

            try:
                if existing_coverage.news_coverage_status.qcode != embedded_coverage.news_coverage_status:
                    if vocabs.coverage_states.get(embedded_coverage.news_coverage_status):
                        existing_coverage.news_coverage_status = vocabs.coverage_states[
                            embedded_coverage.news_coverage_status
                        ]
                    update_required = True
            except KeyError:
                pass

            try:
                current_desk = None if not existing_coverage.assigned_to else existing_coverage.assigned_to.desk
                if current_desk != embedded_coverage.desk:
                    if not existing_coverage.assigned_to:
                        existing_coverage.assigned_to = CoverageAssignedTo()
                    existing_coverage.assigned_to.desk = embedded_coverage.desk
                    update_required = True
            except KeyError:
                pass

            try:
                if (
                    "" if not existing_coverage.assigned_to else existing_coverage.assigned_to.user
                ) != embedded_coverage.user:
                    if not existing_coverage.assigned_to:
                        existing_coverage.assigned_to = CoverageAssignedTo()
                    existing_coverage.assigned_to.user = embedded_coverage.user
                    update_required = True
            except KeyError:
                pass

            try:
                if (
                    "" if not existing_coverage.assigned_to else existing_coverage.assigned_to.coverage_provider
                ) != embedded_coverage.coverage_provider:
                    if not existing_coverage.assigned_to:
                        existing_coverage.assigned_to = CoverageAssignedTo()
                    existing_coverage.assigned_to.coverage_provider = embedded_coverage.coverage_provider
                    update_required = True
            except KeyError:
                pass

        # Create new Coverages from the ``embedded_planning`` Event field
        for embedded_coverage in embedded_plan.coverages:
            if embedded_coverage.coverage_id in existing_embedded_coverages:
                # This coverage already exists in the Planning item
                # No need to create a new one
                continue

            updated_coverages.append(
                create_new_coverage_from_event_and_planning(
                    event, event_translations, existing_planning, embedded_coverage, profiles, vocabs
                )
            )
            update_required = True

        updates: dict = {}
        if update_required:
            updates["coverages"] = [coverage.to_dict() for coverage in updated_coverages]
            if embedded_plan.update_method is not None:
                updates["update_method"] = embedded_plan.update_method

        yield existing_planning, updates, update_required
