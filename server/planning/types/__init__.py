# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2023 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import TypedDict, Dict, Any
from datetime import datetime

from .content_profiles import ContentFieldSchema, ContentFieldEditor, ContentProfile  # noqa


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
    ednote: str
    internal_note: str
    priority: int


class EmbeddedPlanning(TypedDict, total=False):
    planning_id: str
    coverages: Dict[str, EmbeddedCoverageItem]


# TODO: Implement proper types for these next 3
Event = Dict[str, Any]
Planning = Dict[str, Any]
Coverage = Dict[str, Any]
