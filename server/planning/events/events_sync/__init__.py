# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Dict, Optional, List
from copy import deepcopy
import pytz

from eve.utils import str_to_date
from superdesk import get_resource_service

from planning.types import Event, EmbeddedPlanning, StringFieldTranslation
from planning.common import get_config_event_fields_to_sync_with_planning
from planning.content_profiles.utils import AllContentProfileData

from .common import VocabsSyncData, SyncItemData, SyncData
from .embedded_planning import (
    create_new_plannings_from_embedded_planning,
    get_existing_plannings_from_embedded_planning,
)
from .planning_sync import sync_existing_planning_item

COVERAGE_SYNC_FIELDS = ["slugline", "internal_note", "ednote", "priority", "language"]


def get_translated_fields(translations: List[StringFieldTranslation]) -> Dict[str, Dict[str, str]]:
    fields: Dict[str, Dict[str, str]] = {}
    for translation in translations:
        fields.setdefault(translation["field"], {})
        fields[translation["field"]][translation["language"]] = translation["value"]
    return fields


def sync_event_metadata_with_planning_items(
    original: Optional[Event], updates: Event, embedded_planning: List[EmbeddedPlanning]
):
    profiles = AllContentProfileData()

    if original is None:
        original = {}
    event_updated = deepcopy(original)
    event_updated.update(updates)

    if isinstance(event_updated["dates"]["start"], str):
        event_updated["dates"]["start"] = str_to_date(event_updated["dates"]["start"])
    if event_updated["dates"]["start"].tzinfo is None:
        event_updated["dates"]["start"] = event_updated["dates"]["start"].replace(tzinfo=pytz.utc)

    vocabs_service = get_resource_service("vocabularies")
    vocabs = VocabsSyncData(
        coverage_states={
            item["qcode"]: item
            for item in (vocabs_service.find_one(req=None, _id="newscoveragestatus") or {}).get("items") or []
        },
        genres={
            item["qcode"]: item for item in (vocabs_service.find_one(req=None, _id="genre") or {}).get("items") or []
        },
    )

    event_sync_data = SyncItemData(
        original=original,
        updates=updates,
        original_translations=get_translated_fields(original.get("translations") or []),
        updated_translations=get_translated_fields(updates.get("translations") or []),
    )
    event_translations = deepcopy(event_sync_data.updated_translations or event_sync_data.original_translations)

    # Create any new Planning items (and their coverages), based on the ``embedded_planning`` Event field
    create_new_plannings_from_embedded_planning(event_updated, event_translations, embedded_planning, profiles, vocabs)

    if not original:
        # If this was from the creation of a new Event, then no need to sync metadata with existing items
        # as there aren't any yet.
        return

    planning_service = get_resource_service("planning")
    sync_fields_config = get_config_event_fields_to_sync_with_planning()
    sync_fields = set(field for field in sync_fields_config if field in updates)

    if not len(sync_fields):
        # There are no fields to sync with the Event
        # So only update the Planning items based on the ``embedded_planning`` Event field
        for planning_original, planning_updates, update_required in get_existing_plannings_from_embedded_planning(
            event_updated, event_translations, embedded_planning, profiles, vocabs
        ):
            if update_required:
                planning_service.patch(planning_original["_id"], planning_updates)
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
    processed_planning_ids: List[str] = []
    for planning_original, planning_updates, update_required in get_existing_plannings_from_embedded_planning(
        event_updated, event_translations, embedded_planning, profiles, vocabs
    ):
        translated_fields = get_translated_fields(planning_original.get("translations") or [])
        sync_data = SyncData(
            event=event_sync_data,
            planning=SyncItemData(
                original=planning_original,
                updates=planning_updates,
                original_translations=translated_fields,
                updated_translations=deepcopy(translated_fields),
            ),
            coverage_updates=deepcopy(planning_updates.get("coverages") or planning_original.get("coverages") or []),
            update_translations=False,
            update_coverages=update_required,
            update_planning=update_required,
        )

        sync_existing_planning_item(
            sync_data,
            sync_fields,
            profiles,
            coverage_sync_fields,
        )
        processed_planning_ids.append(planning_original["_id"])
        if sync_data.update_planning:
            planning_service.patch(sync_data.planning.original["_id"], sync_data.planning.updates)

    # Sync all the Planning items that were NOT provided in the ``embedded_planning`` field
    where = {"$and": [{"event_item": event_updated.get("_id")}, {"_id": {"$nin": processed_planning_ids}}]}
    for item in planning_service.find(where=where):
        translated_fields = get_translated_fields(item.get("translations") or [])
        sync_data = SyncData(
            event=event_sync_data,
            planning=SyncItemData(
                original=item,
                updates={},
                original_translations=translated_fields,
                updated_translations=deepcopy(translated_fields),
            ),
            coverage_updates=deepcopy(item.get("coverages") or []),
            update_translations=False,
            update_coverages=False,
            update_planning=False,
        )
        sync_existing_planning_item(
            sync_data,
            sync_fields,
            profiles,
            coverage_sync_fields,
        )
        if sync_data.update_planning:
            planning_service.patch(sync_data.planning.original["_id"], sync_data.planning.updates)
