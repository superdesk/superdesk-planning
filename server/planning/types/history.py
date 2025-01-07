from typing import Annotated, Any

from superdesk.core.resources import ResourceModelWithObjectId, fields
from superdesk.core.resources.validators import validate_data_relation_async


class HistoryResourceModel(ResourceModelWithObjectId):
    user_id: Annotated[fields.ObjectId, validate_data_relation_async("users")]
    operation: str
    update: dict[str, Any] | None = None


class PlanningHistoryResourceModel(HistoryResourceModel):
    planning_id: Annotated[fields.Keyword, validate_data_relation_async("planning")]


class EventsHistoryResourceModel(HistoryResourceModel):
    event_id: Annotated[fields.Keyword, validate_data_relation_async("events")]
