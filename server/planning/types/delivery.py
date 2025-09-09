from pydantic import Field
from typing import Annotated
from datetime import datetime

from superdesk.core.resources import ResourceModelWithObjectId, fields
from superdesk.core.resources.validators import validate_data_relation_async


class DeliveryResourceModel(ResourceModelWithObjectId):
    planning_id: Annotated[fields.Keyword, validate_data_relation_async("planning")]
    coverage_id: str | None = None
    assignment_id: Annotated[fields.ObjectId, validate_data_relation_async("assignments")]
    item_id: str | None = None
    item_state: str | None = None
    sequence_no: int = Field(default=0)
    publish_time: datetime | None = None
    scheduled_update_id: str | None = None
