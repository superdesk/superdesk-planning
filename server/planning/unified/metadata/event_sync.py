from copy import deepcopy

from planning.types.unified import UnifiedPlanningResource, EmbeddedPlanningItem, RelatedEventLinkType
from planning.common import get_config_event_fields_to_sync_with_planning
from planning.content_profiles.utils import AllContentProfileData
from planning.unified.common import get_related_planning_for_events

from .common import SyncItemData, SyncData, load_vocabs_data
from .multilingual import get_translated_fields
from .embedded_planning import (
    create_new_plannings_from_embedded_planning,
    get_existing_plannings_from_embedded_planning,
)
from .planning_sync import sync_existing_planning_item

COVERAGE_SYNC_FIELDS = ["slugline", "internal_note", "ednote", "priority", "language"]


def _field_in_updates(original: UnifiedPlanningResource | None, updates: UnifiedPlanningResource, field: str) -> bool:
    """
    Determines if a specified field exists in the updates dictionary or among translated fields.

    Checks if the given field is either directly present in the dictionary or indirectly
    present in the list of translated fields within the dictionary.

    :param updates: A dictionary containing update information.
                    It may include a list of translated fields under the key 'translations'.
    :param field: The name of the field to search for within the updates dictionary or the translated fields.
    :return: True if the specified field exists in the updates dictionary or among the translated fields; otherwise, False.
    """

    if original is None and getattr(updates, field, None):
        return True
    elif original and getattr(updates, field, None) != getattr(original, field, None):
        return True

    original_translations = {} if not original else get_translated_fields(original.translations).get(field) or {}
    updated_translations = get_translated_fields(updates.translations).get(field) or {}

    for language, value in updated_translations.items():
        if value != original_translations.get(language):
            return True

    return False


async def sync_event_metadata_with_planning_items(
    original: UnifiedPlanningResource | None,
    updates: UnifiedPlanningResource,
    embedded_planning: list[EmbeddedPlanningItem],
):
    profiles = await AllContentProfileData.load_all()

    if original is None:
        event_updated = updates.clone()
    else:
        event_updated = original.clone_with(updates.to_dict())

    vocabs = await load_vocabs_data()
    event_sync_data = SyncItemData(
        original=original,
        updates=updates,
        original_translations=get_translated_fields(original.translations if original else []),
        updated_translations=get_translated_fields(updates.translations),
    )
    event_translations = deepcopy(event_sync_data.updated_translations or event_sync_data.original_translations)

    # Create any new Planning items (and their coverages), based on the ``embedded_planning`` Event field
    await create_new_plannings_from_embedded_planning(
        event_updated, event_translations, embedded_planning, profiles, vocabs
    )

    if not original:
        # If this was from the creation of a new Event, then no need to sync metadata with existing items
        # as there aren't any yet.
        return

    planning_service = UnifiedPlanningResource.get_service()
    sync_fields_config = get_config_event_fields_to_sync_with_planning()
    sync_fields = set(field for field in sync_fields_config if _field_in_updates(original, updates, field))

    if not len(sync_fields):
        # There are no fields to sync from the Event
        # So only update the Planning items based on the ``embedded_planning`` Event field
        async for planning_original, planning_updates, update_required in get_existing_plannings_from_embedded_planning(
            event_updated, event_translations, embedded_planning, profiles, vocabs
        ):
            if update_required:
                await planning_service.update(planning_original.id, planning_updates)
        return

    coverage_sync_fields = set(field for field in sync_fields if field in COVERAGE_SYNC_FIELDS)
    if (
        profiles.events.is_multilingual
        and profiles.planning.is_multilingual
        and "language" in sync_fields_config
        and "languages" in updates
    ):
        # If multilingual is enabled for both Event & Planning, then add ``languages`` to the list
        # of fields to sync
        sync_fields.add("languages")
        try:
            # And turn off syncing of Coverage language
            coverage_sync_fields.remove("language")
        except KeyError:
            pass

    # Sync all the Planning items that were provided in the ``embedded_planning`` field
    processed_planning_ids: list[str] = []
    async for planning_original, planning_updates, update_required in get_existing_plannings_from_embedded_planning(
        event_updated, event_translations, embedded_planning, profiles, vocabs
    ):
        translated_fields = get_translated_fields(planning_original.translations or [])
        updated_planning = planning_original.clone_with(planning_updates)
        sync_data = SyncData(
            event=event_sync_data,
            planning=SyncItemData(
                original=planning_original,
                updates=updated_planning,
                original_translations=translated_fields,
                updated_translations=deepcopy(translated_fields),
            ),
            coverage_updates=deepcopy(planning_updates.get("coverages") or planning_original.coverages or []),
            update_translations=False,
            update_coverages=update_required,
            update_planning=update_required,
        )

        planning_updates = sync_existing_planning_item(
            sync_data,
            sync_fields,
            profiles,
            coverage_sync_fields,
        )
        processed_planning_ids.append(planning_original.id)
        if sync_data.update_planning:
            await planning_service.update(planning_original.id, planning_updates)

    # Sync all the Planning items that were NOT provided in the ``embedded_planning`` field
    cursor = await get_related_planning_for_events(
        [event_updated.id], RelatedEventLinkType.PRIMARY, processed_planning_ids
    )
    async for item in cursor:
        translated_fields = get_translated_fields(item.translations)
        sync_data = SyncData(
            event=event_sync_data,
            planning=SyncItemData(
                original=item,
                updates=item,
                original_translations=translated_fields,
                updated_translations=deepcopy(translated_fields),
            ),
            coverage_updates=deepcopy(item.coverages or []),
            update_translations=False,
            update_coverages=False,
            update_planning=False,
        )
        planning_updates = sync_existing_planning_item(
            sync_data,
            sync_fields,
            profiles,
            coverage_sync_fields,
        )
        if sync_data.update_planning:
            await planning_service.update(item.id, planning_updates)
