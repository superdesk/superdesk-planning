from enum import Enum, unique

from pydantic import Field

from superdesk.core.resources import ResourceModel, fields
from superdesk.core.utils import generate_guid, GUID_NEWSML

from ..enums import UpdateMethods
from .system import AuditInformation, IngestDetails, LockFields, SourceDetails, ItemSystemFields
from .schedule import ItemSchedule
from .metadata import ItemDescription, ItemMetadata, ItemExtraDetails, ItemContactDetails
from .coverage import ItemCoverage


class FieldsNotStored:
    update_method: UpdateMethods | None = None
    planning_ids: list[fields.Keyword] | None = None
    failed_planning_ids: list[fields.Keyword] | None = None
    planning_item: fields.Keyword | None = Field(
        alias="_planning_item",
        description="Used when an Event is created from a Planning item, so we can link on the backend",
        default=None,
    )
    embedded_planning: list[dict] | None = Field(
        description="Used from the EmbeddedCoverage form in the Event editor", default=None
    )
    associated_plannings: list[dict] | None = Field(
        description="Used to create an Event and Planning together in the one request", default=None
    )


@unique
class PlanningItemType(str, Enum):
    EVENT = "event"
    PLANNING = "planning"


class UnifiedPlanningResource(
    AuditInformation,
    IngestDetails,
    LockFields,
    SourceDetails,
    ItemSchedule,
    ItemDescription,
    ItemMetadata,
    ItemExtraDetails,
    ItemContactDetails,
    ItemSystemFields,
    ItemCoverage,
    ResourceModel,
):
    model_resource_name = "UnifiedPlanningResource"

    id: str = Field(alias="_id", default_factory=lambda: generate_guid(type=GUID_NEWSML))
    item_type: PlanningItemType = Field(
        alias="type",
        description="Type of planning item represented by this resource",
    )
    extra: dict | None = Field(
        description="Additional custom data associated with the planning resource",
        default=None,
    )
