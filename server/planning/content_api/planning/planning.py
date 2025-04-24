# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning.types import PlanningResourceModel
from superdesk.core.resources import ModelWithVersions
from typing import Any
from pydantic import Field
from superdesk.core.resources import fields
from superdesk.types.base import CVItem
from datetime import datetime


class ContentAPIPlanningResourceModel(PlanningResourceModel, ModelWithVersions):
    init_version: int | None = None
    byline: str | None = None
    located: str | None = None
    usageterms: str | None = None
    body_html: fields.HTML | None = None
    firstpublished: datetime | None = None
    annotations: list[dict[str, Any]] = Field(default_factory=list)
    service: list[CVItem] = Field(default_factory=list)
    description_html: fields.HTML | None = None
    charcount: int | None = None
    readtime: int | None = None
    authors: list[dict[str, Any]] = Field(default_factory=list)
