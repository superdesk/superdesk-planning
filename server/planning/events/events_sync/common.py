# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List, Dict, Any
from dataclasses import dataclass

from planning.content_profiles.utils import ContentProfileData


@dataclass
class SyncItemData:
    original: Dict[str, Any]
    updates: Dict[str, Any]
    original_translations: Dict[str, Dict[str, str]]
    updated_translations: Dict[str, Dict[str, str]]


@dataclass
class SyncData:
    event: SyncItemData
    planning: SyncItemData
    coverage_updates: List[Dict[str, Any]]
    update_translations: bool
    update_coverages: bool
    update_planning: bool


@dataclass
class VocabsSyncData:
    coverage_states: Dict[str, Dict[str, str]]
    genres: Dict[str, Dict[str, str]]


def get_enabled_subjects(item: Dict[str, Any], profile: ContentProfileData) -> List[Dict[str, Any]]:
    """Returns the list of subjects (including custom_vocabularies) if they're enabled in Planning profile

    :param item: The source item where the subjects are coming from
    :param profile: The Planning ContentProfile to determine enabled fields & vocabularies
    :return: A list containing the supported subjects and custom_vocabularies for Planning items
    """

    if not item.get("subject") or not {"subject", "custom_vocabularies"} & profile.enabled_fields:
        return []

    try:
        cv_schemes = profile.profile["schema"]["custom_vocabularies"]["vocabularies"]
    except (KeyError, TypeError):
        cv_schemes = []

    return [subject for subject in item["subject"] if not subject.get("scheme") or subject.get("scheme") in cv_schemes]
