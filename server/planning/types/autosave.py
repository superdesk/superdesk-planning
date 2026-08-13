from pydantic import Field

from superdesk.core.resources import fields

from .base import BasePlanningModel
from .unified import PlanningItemType, LockFields


class AutosaveResourceModel(BasePlanningModel, LockFields):
    expired: bool = False
    item_type: PlanningItemType = Field(
        alias="type",
        description="Type of planning item represented by this resource",
    )
    files: list[fields.ObjectId | str] | None = None
    _unsaved_related_events: list[str] | None = None
