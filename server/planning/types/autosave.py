from typing import Annotated
from pydantic import Field

from superdesk.core.resources import fields

from .base import BasePlanningModel
from .common import LockFieldsMixin
from .unified import PlanningItemType


class BaseAutosaveResourceModel(BasePlanningModel, LockFieldsMixin):
    expired: bool = False
    files: list[fields.ObjectId | str] | None = None
    _unsaved_related_events: list[str] | None = None


class EventAutosaveResourceModel(BaseAutosaveResourceModel):
    item_type: Annotated[PlanningItemType, Field(alias="type")] = PlanningItemType.EVENT


class PlanningAutosaveResourceModel(BaseAutosaveResourceModel):
    item_type: Annotated[PlanningItemType, Field(alias="type")] = PlanningItemType.PLANNING
