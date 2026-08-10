# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.core.resources import Dataclass

from planning.types.unified import UnifiedPlanningResource, Subject, CoverageItem, CVItem, NewsCoverageStatus
from planning.content_profiles.utils import ContentProfileData


class SyncItemData(Dataclass):
    original: UnifiedPlanningResource | None
    updates: UnifiedPlanningResource
    original_translations: dict[str, dict[str, str]]
    updated_translations: dict[str, dict[str, str]]


class SyncData(Dataclass):
    event: SyncItemData
    planning: SyncItemData
    coverage_updates: list[CoverageItem]
    update_translations: bool
    update_coverages: bool
    update_planning: bool


# TODO-UNIFIED: Make sure these are loaded properly, as the correct type/dataclass instance
class VocabsSyncData(Dataclass):
    coverage_states: dict[str, NewsCoverageStatus]
    genres: dict[str, CVItem]


def get_enabled_subjects(item: UnifiedPlanningResource, profile: ContentProfileData) -> list[Subject]:
    """Returns the list of subjects (including custom_vocabularies) if they're enabled in Planning profile

    :param item: The source item where the subjects are coming from
    :param profile: The Planning ContentProfile to determine enabled fields & vocabularies
    :return: A list containing the supported subjects and custom_vocabularies for Planning items
    """

    if not item.subject or not {"subject", "custom_vocabularies"} & profile.enabled_fields:
        return []

    try:
        cv_schemes = profile.profile["schema"]["custom_vocabularies"]["vocabularies"] or []
    except (KeyError, TypeError):
        cv_schemes = []

    return [subject for subject in item.subject if not subject.scheme or subject.scheme in cv_schemes]
