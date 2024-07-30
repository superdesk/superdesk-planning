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

from planning.types import (
    Event,
    EmbeddedPlanning,
    EmbeddedCoverageItem,
    Planning,
    Coverage,
    StringFieldTranslation,
    PlanningRelatedEventLink,
)
from planning.content_profiles.utils import AllContentProfileData

from .common import VocabsSyncData

logger = logging.getLogger(__name__)


def create_new_plannings_from_embedded_planning(
    event: Event,
    event_translations: Dict[str, Dict[str, str]],
    embedded_planning: List[EmbeddedPlanning],
    profiles: AllContentProfileData,
    vocabs: VocabsSyncData,
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
            "anpa_category",
            "ednote",
            "language",
            "priority",
        ]
        if field in profiles.planning.enabled_fields
    )

    planning_fields.add("subject")

    multilingual_enabled = profiles.events.is_multilingual and profiles.planning.is_multilingual
    translations: List[StringFieldTranslation] = []
    if multilingual_enabled and "language" in planning_fields and len(event.get("translations") or []):
        planning_fields.add("languages")

        def map_event_to_planning_translation(translation: StringFieldTranslation):
            if translation["field"] == "definition_short":
                translation["field"] = "description_text"
            return translation

        translations = [
            map_event_to_planning_translation(translation)
            for translation in event["translations"]
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

    related_event = PlanningRelatedEventLink(_id=event["_id"], link_type="primary")
    if event.get("recurrence_id"):
        related_event["recurrence_id"] = event["recurrence_id"]

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
            "related_events": [related_event],
            "coverages": [],
        }

        try:
            new_planning["update_method"] = plan["update_method"]
        except KeyError:
            pass

        if event.get("recurrence_id"):
            new_planning["recurrence_id"] = event["recurrence_id"]

        for field in planning_fields:
            if event.get(field):
                # The Event item contains a value for this field (excluding ``None``), use that
                new_planning[field] = event.get(field)

        if "description_text" in profiles.planning.enabled_fields and event.get("definition_short"):
            new_planning["description_text"] = event.get("definition_short")

        if translations:
            new_planning["translations"] = translations

        for coverage_id, coverage in (plan.get("coverages") or {}).items():
            new_planning["coverages"].append(
                create_new_coverage_from_event_and_planning(
                    event, event_translations, new_planning, coverage, profiles, vocabs
                )
            )

        new_plannings.append(new_planning)

    if len(new_plannings):
        get_resource_service("planning").post(new_plannings)


def create_new_coverage_from_event_and_planning(
    event: Event,
    event_translations: Dict[str, Dict[str, str]],
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
        "planning": {},
    }

    if coverage.get("desk") or coverage.get("user"):
        new_coverage["assigned_to"] = {}
        if coverage.get("desk"):
            new_coverage["assigned_to"]["desk"] = coverage["desk"]
        if coverage.get("user"):
            new_coverage["assigned_to"]["user"] = coverage["user"]

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

    try:
        coverage_language = new_coverage["planning"]["language"]
    except (KeyError, TypeError):
        coverage_language = None

    coverage_planning_fields = set(
        field
        for field in [
            "ednote",
            "g2_content_type",
            "scheduled",
            "slugline",
            "headline",
            "internal_note",
            "priority",
        ]
        if field in profiles.coverages.enabled_fields
    )
    for field in coverage_planning_fields:
        if coverage.get(field):
            # If the value (excluding ``None``) is already provided in the Coverage, then use that
            new_coverage["planning"][field] = coverage.get(field)
            continue

        if coverage_language is not None:
            # If the Coverage has a language defined, then try and get the value
            # from the Event's translations array for this field
            try:
                new_coverage["planning"][field] = event_translations[field][coverage_language]
                continue
            except (KeyError, TypeError):
                pass

        if planning.get(field):
            # Planning item contains the value for this field (excluding ``None``), use that
            new_coverage["planning"][field] = planning[field]
        elif event.get(field):
            # Event item contains the value for this field (excluding ``None``), use that
            new_coverage["planning"][field] = event[field]

        # Was unable to determine what value to give this field, leave it out of the new coverage
        # otherwise we would be setting the value to ``None``, which is not supported in all fields (like slugline)

    if "genre" in profiles.coverages.enabled_fields and coverage.get("genre") is not None:
        new_coverage["planning"]["genre"] = [vocabs.genres.get(coverage["genre"]) or {"qcode": coverage["genre"]}]

    return new_coverage


def get_existing_plannings_from_embedded_planning(
    event: Event,
    event_translations: Dict[str, Dict[str, str]],
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
            "headline",
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
        updates: Planning = {
            "coverages": [
                coverage
                for coverage in deepcopy(existing_planning.get("coverages") or [])
                if coverage.get("coverage_id") in updated_coverage_ids
            ]
        }

        try:
            updates["update_method"] = embedded_plan["update_method"]
        except KeyError:
            pass

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
                        if field not in embedded_coverage:
                            continue
                        elif coverage_planning.get(field) != embedded_coverage[field]:  # type: ignore
                            coverage_planning[field] = embedded_coverage[field]  # type: ignore
                            update_required = True

                            if coverage_planning[field] is None and field in [
                                "slugline",
                                "headline",
                                "internal_note",
                                "ednote",
                            ]:
                                coverage_planning[field] = ""
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
                    existing_coverage.setdefault("assigned_to", {})
                    existing_coverage["assigned_to"]["desk"] = embedded_coverage["desk"]
                    update_required = True
            except KeyError:
                pass

            try:
                if existing_coverage.get("assigned_to", {}).get("user") != embedded_coverage["user"]:
                    existing_coverage.setdefault("assigned_to", {})
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
                    event, event_translations, existing_planning, embedded_coverage, profiles, vocabs
                )
            )
            update_required = True

        yield existing_planning, updates if update_required else {}, update_required
