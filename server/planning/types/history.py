from typing import Annotated, Any

from superdesk.core.resources import ResourceModelWithObjectId, fields
from superdesk.core.resources.validators import validate_data_relation_async


class HistoryResourceModel(ResourceModelWithObjectId):
    operation: str
    # ``user_id`` can be ``None`` if the history item is created by the system (such as from an ingest)
    user_id: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = None
    update: dict[str, Any] | None = None


class PlanningHistoryResourceModel(HistoryResourceModel):
    planning_id: Annotated[fields.Keyword, validate_data_relation_async("unified_planning")]


class EventsHistoryResourceModel(HistoryResourceModel):
    event_id: Annotated[fields.Keyword, validate_data_relation_async("unified_planning")]


class AssignmentsHistoryResourceModel(HistoryResourceModel):
    assignment_id: Annotated[fields.ObjectId, validate_data_relation_async("assignments")]
