# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.core.resources import ModelWithVersions
from planning.types import EventResourceModel
from superdesk.core.resources import fields
from superdesk.types.base import CVItem
from pydantic import Field
from typing import Any


class ContentAPIEventResourceModel(EventResourceModel, ModelWithVersions):
    headline: fields.HTML | None = None
    description_text: str | None = None
    description_html: fields.HTML | None = None
    byline: str | None = None
    usageterms: str | None = None
    annotations: list[dict[str, Any]] = Field(default_factory=list)
    profile: str | None = None
    service: list[CVItem] = Field(default_factory=list)
    genre: list[CVItem] = Field(default_factory=list)
    authors: list[dict[str, Any]] = Field(default_factory=list)
    charcount: int | None = None
    wordcount: int | None = None
    readtime: int | None = None
    located: str | None = None
