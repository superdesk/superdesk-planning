from typing import Annotated
from pydantic import Field

from superdesk.core.resources import fields

from .base import BasePlanningModel
from .common import LockFieldsMixin


class BaseAutosaveResourceModel(BasePlanningModel, LockFieldsMixin):
    expired: bool = False
    files: list[fields.ObjectId] | None = None
    _unsaved_related_events: list[str] | None = None


class EventAutosaveResourceModel(BaseAutosaveResourceModel):
    item_type: Annotated[str, Field(alias="type")] = "event"


class PlanningAutosaveResourceModel(BaseAutosaveResourceModel):
    item_type: Annotated[str, Field(alias="type")] = "planning"
