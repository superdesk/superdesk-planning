from typing import Annotated, Any, Literal

from pydantic import Field

from superdesk.core.resources import ResourceModelWithObjectId, fields
from superdesk.core.resources.validators import validate_data_relation_async

from .unified import PlanningItemType


class HistoryResourceModel(ResourceModelWithObjectId):
    operation: str
    # ``user_id`` can be ``None`` if the history item is created by the system (such as from an ingest)
    user_id: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = None
    update: dict[str, Any] | None = None


class UnifiedPlanningHistoryResource(HistoryResourceModel):
    item_id: Annotated[fields.Keyword, validate_data_relation_async("unified_planning")]
    item_type: PlanningItemType = Field(description="Type of planning item represented by this resource")


class AssignmentsHistoryResourceModel(HistoryResourceModel):
    item_id: Annotated[fields.ObjectId, validate_data_relation_async("assignments")]
    item_type: Literal["assignment"] = "assignment"
