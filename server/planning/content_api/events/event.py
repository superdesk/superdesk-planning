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
