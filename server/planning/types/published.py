from typing import Any
from pydantic import Field
from superdesk.core.resources import ResourceModel


class PublishedPlanningModel(ResourceModel):
    item_id: str | None = None
    version: int | None = None
    item_type: str | None = Field(alias="type")
    published_item: dict[str, Any] = Field(default_factory=dict)
