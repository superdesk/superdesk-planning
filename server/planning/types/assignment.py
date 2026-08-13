from pydantic import Field
from typing import Annotated
from datetime import datetime

from superdesk.utc import utcnow
from superdesk.core.resources import fields, dataclass
from superdesk.core.resources.validators import validate_data_relation_async

from .base import BasePlanningModelWithObjectId
from .common import AssignmentCoverage
from .enums import AssignmentPublishedState, AssignmentWorkflowState
from .unified import LockFields


@dataclass
class CoverageProvider:
    qcode: fields.Keyword | None = None
    name: fields.Keyword | None = None
    contact_type: fields.Keyword | None = None


@dataclass
class AssignedTo:
    desk: fields.Keyword | None = None
    user: fields.Keyword | None = None
    contact: fields.Keyword | None = None
    assignor_desk: fields.Keyword | None = None
    assignor_user: fields.Keyword | None = None
    assigned_date_desk: datetime | None = None
    assigned_date_user: datetime | None = None
    state: AssignmentWorkflowState | None = None
    revert_state: AssignmentWorkflowState | None = None
    coverage_provider: CoverageProvider | None = None


class AssignmentResourceModel(BasePlanningModelWithObjectId, LockFields):
    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)

    priority: int | None = None
    coverage_item: fields.Keyword | None = None
    planning_item: Annotated[fields.Keyword, validate_data_relation_async("planning")]
    scheduled_update_id: fields.Keyword | None = None

    assigned_to: AssignedTo | None = None
    planning: AssignmentCoverage | None = None

    name: str | None = None
    description_text: fields.HTML | None = None
    accepted: bool = False
    to_delete: bool = Field(default=False, alias="_to_delete")

    published_at: datetime | None = None
    published_state: AssignmentPublishedState | None = None

    # TODO-ASYNC: this field was in the original schema but we're not sure if it's really required
    # also it would clash with the computed property `type` from ResourceModel
    # leaving it here for now until we know if it is required or we can get rid of it
    # item_type: Annotated[fields.Keyword, Field(alias="type")] = "assignment"
