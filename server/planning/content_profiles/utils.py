# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from bson import ObjectId

from superdesk.errors import SuperdeskApiError

from planning.types import BaseProfile, ContentProfile, CoverageProfile, PlanningProfileResource


async def get_planning_schema(resource: str) -> ContentProfile:
    profile = await PlanningProfileResource.get_service().find_one(type=resource)
    if profile:
        return profile.to_dict()

    raise SuperdeskApiError.notFoundError()


async def get_coverage_schema(schema_id: ObjectId | str) -> CoverageProfile | None:
    profile = await PlanningProfileResource.get_service().find_one(_id=ObjectId(schema_id))
    if profile:
        return profile.to_dict()

    raise SuperdeskApiError.notFoundError()


def is_field_enabled(field: str, profile: BaseProfile) -> bool:
    try:
        return profile["editor"][field]["enabled"]
    except (KeyError, TypeError):
        return False


def get_enabled_fields(profile: BaseProfile) -> set[str]:
    return set(field for field in profile["editor"].keys() if is_field_enabled(field, profile))


def is_field_editor_3(field: str, profile: BaseProfile) -> bool:
    try:
        return is_field_enabled(field, profile) and profile["schema"][field]["field_type"] == "editor_3"
    except (KeyError, TypeError):
        return False


def is_field_custom_vocabulary(field: str, profile: BaseProfile) -> bool:
    try:
        return is_field_enabled(field, profile) and profile["schema"][field]["type"] == "custom_vocabulary"
    except (KeyError, TypeError):
        return False


def is_multilingual_enabled(field: str, profile: BaseProfile) -> bool:
    try:
        return profile["schema"][field]["multilingual"]
    except (KeyError, TypeError):
        return False


def get_multilingual_fields_from_profile(profile: BaseProfile) -> set[str]:
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


def get_custom_vocabulary_fields_from_profile(profile: BaseProfile) -> set[str]:
    return set(field_name for field_name in profile["schema"].keys() if is_field_custom_vocabulary(field_name, profile))


async def get_multilingual_fields(resource: str) -> set[str]:
    return get_multilingual_fields_from_profile(await get_planning_schema(resource))


async def get_editor3_fields(resource: str) -> set[str]:
    profile = await get_planning_schema(resource)
    return set(field_name for field_name in profile["schema"].keys() if is_field_editor_3(field_name, profile))


class ContentProfileData:
    profile: BaseProfile
    is_multilingual: bool
    multilingual_fields: set[str]
    enabled_fields: set[str]

    @classmethod
    async def get(cls, resource: str):
        self = cls()
        self.profile = await get_planning_schema(resource)
        self.enabled_fields = get_enabled_fields(self.profile)
        self.is_multilingual = is_multilingual_enabled("language", self.profile)
        self.multilingual_fields = get_multilingual_fields_from_profile(self.profile)
        return self


class AllContentProfileData:
    events: ContentProfileData
    planning: ContentProfileData
    coverages: ContentProfileData

    @classmethod
    async def get(cls):
        self = cls()
        self.events = await ContentProfileData.get("event")
        self.planning = await ContentProfileData.get("planning")
        self.coverages = await ContentProfileData.get("coverage")
        return self


async def is_post_planning_with_event_enabled() -> bool:
    try:
        return (await get_planning_schema("event"))["schema"]["related_plannings"]["planning_auto_publish"] is True
    except (KeyError, TypeError):
        return False


async def is_cancel_planning_with_event_enabled() -> bool:
    try:
        return (await get_planning_schema("event"))["schema"]["related_plannings"]["cancel_plan_with_event"] is True
    except (KeyError, TypeError):
        return True
