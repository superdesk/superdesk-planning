# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Set
from superdesk import get_resource_service
from planning.types import ContentProfile


def get_planning_schema(resource: str) -> ContentProfile:
    return get_resource_service("planning_types").find_one(req=None, name=resource)


def is_field_enabled(field: str, profile: ContentProfile) -> bool:
    try:
        return profile["editor"][field]["enabled"]
    except (KeyError, TypeError):
        return False


def get_enabled_fields(profile: ContentProfile) -> Set[str]:
    return set(field for field in profile["editor"].keys() if is_field_enabled(field, profile))


def is_field_editor_3(field: str, profile: ContentProfile) -> bool:
    try:
        return is_field_enabled(field, profile) and profile["schema"][field]["field_type"] == "editor_3"
    except (KeyError, TypeError):
        return False


def is_multilingual_enabled(field: str, profile: ContentProfile) -> bool:
    try:
        return profile["schema"][field]["multilingual"]
    except (KeyError, TypeError):
        return False


def get_multilingual_fields_from_profile(profile: ContentProfile) -> Set[str]:
    return (
        set()
        if not is_multilingual_enabled("language", profile)
        else set(
            field_name
            for field_name, field_schema in profile["schema"].items()
            if (
                is_field_enabled(field_name, profile)
                and field_name != "language"
                and is_multilingual_enabled(field_name, profile)
            )
        )
    )


def get_multilingual_fields(resource: str) -> Set[str]:
    return get_multilingual_fields_from_profile(get_planning_schema(resource))


def get_editor3_fields(resource: str) -> Set[str]:
    profile = get_planning_schema(resource)
    return set(field_name for field_name in profile["schema"].keys() if is_field_editor_3(field_name, profile))


class ContentProfileData:
    profile: ContentProfile
    is_multilingual: bool
    multilingual_fields: Set[str]
    enabled_fields: Set[str]

    def __init__(self, resource: str):
        self.profile = get_planning_schema(resource)
        self.enabled_fields = get_enabled_fields(self.profile)
        self.is_multilingual = is_multilingual_enabled("language", self.profile)
        self.multilingual_fields = get_multilingual_fields_from_profile(self.profile)


class AllContentProfileData:
    events: ContentProfileData
    planning: ContentProfileData
    coverages: ContentProfileData

    def __init__(self):
        self.events = ContentProfileData("event")
        self.planning = ContentProfileData("planning")
        self.coverages = ContentProfileData("coverage")
