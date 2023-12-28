# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List, Iterator, Tuple, Dict
from copy import deepcopy
import logging

from superdesk import get_resource_service

from planning.types import Event, EmbeddedPlanning, EmbeddedCoverageItem, Planning, Coverage, StringFieldTranslation
from planning.content_profiles.utils import AllContentProfileData

from .common import VocabsSyncData

logger = logging.getLogger(__name__)


def create_new_plannings_from_embedded_planning(
    event: Event, embedded_planning: List[EmbeddedPlanning], profiles: AllContentProfileData, vocabs: VocabsSyncData
):
    if not len(embedded_planning):
        return

    new_plannings: List[Planning] = []
    planning_fields = set(
        field
        for field in [
            "slugline",
            "internal_note",
            "name",
            "place",
            "subject",
            "anpa_category",
            "ednote",
            "language",
            "priority",
        ]
        if field in profiles.planning.enabled_fields
    )
    multilingual_enabled = profiles.events.is_multilingual and profiles.planning.is_multilingual
    translations: List[StringFieldTranslation] = []
    event_translations: List[StringFieldTranslation] = event.get("translations") or []
    if multilingual_enabled and "language" in planning_fields and len(event_translations):
        planning_fields.add("languages")

        def map_event_to_planning_translation(translation: StringFieldTranslation):
            if translation["field"] == "definition_short":
                translation["field"] = "description_text"
            return translation

        translations = [
            map_event_to_planning_translation(translation)
            for translation in event_translations
            if (
                translation.get("field") is not None
                and (
                    (
                        translation["field"] == "definition_short"
                        and "description_text" in profiles.planning.enabled_fields
                    )
                    or translation["field"] in profiles.planning.enabled_fields
                )
            )
        ]

    for plan in embedded_planning:
        if plan.get("planning_id"):
            # Skip this item, as it's an existing Planning item
            continue

        new_planning: Planning = {
            "agendas": [],
            "item_class": "plinat:newscoverage",
            "state": "draft",
            "type": "planning",
            "planning_date": event["dates"]["start"],
            "event_item": event["_id"],
            "coverages": [],
        }

        if event.get("recurrence_id"):
            new_planning["recurrence_id"] = event["recurrence_id"]

        for field in planning_fields:
            new_planning[field] = event.get(field)

        if "description_text" in profiles.planning.enabled_fields:
            new_planning["description_text"] = event.get("definition_short")

        if translations:
            new_planning["translations"] = translations

        for coverage_id, coverage in (plan.get("coverages") or {}).items():
            new_planning["coverages"].append(
                create_new_coverage_from_event_and_planning(event, new_planning, coverage, profiles, vocabs)
            )

        new_plannings.append(new_planning)

    if len(new_plannings):
        get_resource_service("planning").post(new_plannings)


def create_new_coverage_from_event_and_planning(
    event: Event,
    planning: Planning,
    coverage: EmbeddedCoverageItem,
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
) -> Coverage:
    try:
        news_coverage_status = coverage["news_coverage_status"]
    except KeyError:
        news_coverage_status = "ncostat:int"
    new_coverage: Coverage = {
        "original_creator": planning.get("original_creator") or event.get("original_creator"),
        "version_creator": (
            planning.get("version_creator")
            or event.get("version_creator")
            or planning.get("original_creator")
            or event.get("original_creator")
        ),
        "firstcreated": planning.get("firstcreated") or event.get("firstcreated"),
        "versioncreated": planning.get("versioncreated") or event.get("versioncreated"),
        "news_coverage_status": vocabs.coverage_states.get(news_coverage_status) or {"qcode": news_coverage_status},
        "workflow_status": "draft",
        "flags": {"no_content_linking": False},
        "assigned_to": {
            "desk": coverage.get("desk"),
            "user": coverage.get("user"),
        },
        "planning": {},
    }

    coverage_planning_fields = set(
        field
        for field in [
            "ednote",
            "g2_content_type",
            "scheduled",
            "slugline",
            "internal_note",
            "priority",
        ]
        if field in profiles.coverages.enabled_fields
    )
    for field in coverage_planning_fields:
        new_coverage["planning"][field] = coverage.get(field) or planning.get(field) or event.get(field)  # type: ignore

    if "genre" in profiles.coverages.enabled_fields and coverage.get("genre") is not None:
        new_coverage["planning"]["genre"] = [vocabs.genres.get(coverage["genre"]) or {"qcode": coverage["genre"]}]

    if "language" in profiles.coverages.enabled_fields:
        # If ``language`` is enabled for Coverages but not defined in ``embedded_planning``
        # then fallback to the language from the Planning item or Event
        if coverage.get("language"):
            new_coverage["planning"]["language"] = coverage["language"]
        elif len(planning.get("languages", [])):
            new_coverage["planning"]["language"] = planning["languages"][0]
        elif planning.get("language"):
            new_coverage["planning"]["language"] = planning["language"]
        elif len(event.get("languages", [])):
            new_coverage["planning"]["language"] = event["languages"][0]
        elif event.get("language"):
            new_coverage["planning"]["language"] = event["language"]

    return new_coverage


def get_existing_plannings_from_embedded_planning(
    event: Event,
    embedded_planning: List[EmbeddedPlanning],
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
) -> Iterator[Tuple[Planning, Planning, bool]]:
    existing_planning_ids: List[str] = [plan["planning_id"] for plan in embedded_planning if plan.get("planning_id")]

    if not len(existing_planning_ids):
        return

    existing_plannings: Dict[str, Planning] = {
        item["_id"]: item
        for item in get_resource_service("planning").get_from_mongo(
            req=None, lookup={"_id": {"$in": existing_planning_ids}}
        )
    }

    coverage_planning_fields = set(
        field
        for field in [
            "g2_content_type",
            "scheduled",
            "language",
            "slugline",
            "internal_note",
            "priority",
            "ednote",
        ]
        if field in profiles.coverages.enabled_fields
    )
    for embedded_plan in embedded_planning:
        planning_id = embedded_plan.get("planning_id")
        if not planning_id:
            # This is a new Planning item, which should have already been handled in
            # ``create_new_plannings_from_embedded_planning``
            continue

        try:
            existing_planning = existing_plannings[planning_id]
        except KeyError:
            logger.warning(f"Failed to find planning item '{planning_id}' from embedded coverage")
            continue

        updated_coverage_ids = [
            coverage["coverage_id"]
            for coverage in existing_planning.get("coverages") or []
            if coverage.get("coverage_id") and embedded_plan["coverages"].get(coverage["coverage_id"])
        ]
        update_required = len(existing_planning.get("coverages") or []) != len(embedded_plan["coverages"])
        updates = {
            "coverages": [
                coverage
                for coverage in deepcopy(existing_planning.get("coverages") or [])
                if coverage.get("coverage_id") in updated_coverage_ids
            ]
        }
        for existing_coverage in updates["coverages"]:
            try:
                embedded_coverage: EmbeddedCoverageItem = embedded_plan["coverages"][existing_coverage["coverage_id"]]
            except KeyError:
                # Coverage not found in Event's EmbeddedCoverages
                # We can safely skip this one
                continue

            try:
                coverage_planning = existing_coverage["planning"]
            except KeyError:
                coverage_planning = None

            if coverage_planning is not None:
                for field in coverage_planning_fields:
                    try:
                        if coverage_planning.get(field) != embedded_coverage[field]:  # type: ignore
                            coverage_planning[field] = embedded_coverage[field]  # type: ignore
                            update_required = True
                    except KeyError:
                        pass

                try:
                    if (
                        "genre" in profiles.coverages.enabled_fields
                        and coverage_planning.get("genre") != embedded_coverage["genre"]
                    ):
                        coverage_planning["genre"] = [
                            vocabs.genres.get(embedded_coverage["genre"]) or {"qcode": embedded_coverage["genre"]}
                        ]
                        update_required = True
                except KeyError:
                    pass

            try:
                if (
                    existing_coverage.get("news_coverage_status", {}).get("qcode")
                    != embedded_coverage["news_coverage_status"]
                ):
                    existing_coverage["news_coverage_status"] = vocabs.coverage_states.get(
                        embedded_coverage["news_coverage_status"]
                    ) or {"qcode": embedded_coverage["news_coverage_status"]}
                    update_required = True
            except KeyError:
                pass

            try:
                if existing_coverage.get("assigned_to", {}).get("desk") != embedded_coverage["desk"]:
                    existing_coverage["assigned_to"]["desk"] = embedded_coverage["desk"]
                    update_required = True
            except KeyError:
                pass

            try:
                if existing_coverage.get("assigned_to", {}).get("user") != embedded_coverage["user"]:
                    existing_coverage["assigned_to"]["user"] = embedded_coverage["user"]
                    update_required = True
            except KeyError:
                pass

        # Create new Coverages from the ``embedded_planning`` Event field
        for coverage_id, embedded_coverage in embedded_plan["coverages"].items():
            if coverage_id in updated_coverage_ids:
                # This coverage already exists in the Planning item
                # No need to create a new one
                continue

            updates["coverages"].append(
                create_new_coverage_from_event_and_planning(
                    event, existing_planning, embedded_coverage, profiles, vocabs
                )
            )
            update_required = True

        yield existing_planning, updates if update_required else {}, update_required
