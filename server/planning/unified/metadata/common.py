# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from quart_babel import gettext

from superdesk.core.resources import Dataclass
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError

from planning.types.unified import (
    UnifiedPlanningResource,
    Subject,
    CoverageItem,
    CVItem,
    NewsCoverageStatus,
    FieldTranslation,
)
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


class VocabsSyncData(Dataclass):
    coverage_states: dict[str, NewsCoverageStatus]
    genres: dict[str, CVItem]


async def load_vocabs_data() -> VocabsSyncData:
    vocabs_service = get_resource_service("vocabularies")
    newscoveragestatus = await vocabs_service.find_one_async(req=None, _id="newscoveragestatus")
    genre = await vocabs_service.find_one_async(req=None, _id="genre")

    if not newscoveragestatus:
        raise SuperdeskApiError.internalError(gettext("NewsCoverageStatus CV not found"))
    if not genre:
        raise SuperdeskApiError.internalError(gettext("Genre CV not found"))

    return VocabsSyncData(
        coverage_states={item["qcode"]: NewsCoverageStatus(**item) for item in newscoveragestatus.get("items") or []},
        genres={item["qcode"]: CVItem(**item) for item in genre.get("items") or []},
    )


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
