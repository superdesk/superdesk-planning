# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import TypedDict, Dict, Any, Literal
from datetime import datetime

from .content_profiles import ContentFieldSchema, ContentFieldEditor, ContentProfile  # noqa


UPDATE_METHOD = Literal["single", "future", "all"]
PLANNING_RELATED_EVENT_LINK_TYPE = Literal["primary", "secondary"]
PLANNING_EVENT_LINK_METHOD = Literal["one_primary", "many_secondary", "one_primary_many_secondary"]


class StringFieldTranslation(TypedDict):
    field: str
    language: str
    value: str


class EmbeddedCoverageItem(TypedDict, total=False):
    coverage_id: str
    g2_content_type: str
    desk: str
    user: str
    language: str
    news_coverage_status: str
    scheduled: datetime
    genre: str
    slugline: str
    headline: str
    ednote: str
    internal_note: str
    priority: int


class EmbeddedPlanning(TypedDict, total=False):
    planning_id: str
    update_method: UPDATE_METHOD
    coverages: Dict[str, EmbeddedCoverageItem]


# TODO: Implement proper types for the following
ArchiveItem = Dict[str, Any]
Event = Dict[str, Any]
Planning = Dict[str, Any]
Coverage = Dict[str, Any]
Assignment = Dict[str, Any]


class EventRelatedItem(TypedDict, total=False):
    guid: str
    type: str
    state: str
    version: str
    headline: str
    slugline: str
    versioncreated: datetime
    source: str
    search_provider: str
    pubstatus: str
    language: str
    word_count: int


class PlanningRelatedEventLinkBase(TypedDict):
    _id: str
    link_type: PLANNING_RELATED_EVENT_LINK_TYPE


class PlanningRelatedEventLink(PlanningRelatedEventLinkBase, total=False):
    recurrence_id: str
