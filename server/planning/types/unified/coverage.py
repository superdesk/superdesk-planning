from typing import Annotated
from datetime import datetime
from enum import Enum, unique

from pydantic import Field

from superdesk.core.resources import BaseModel, Dataclass, fields
from superdesk.core.resources.validators import validate_data_relation_async

from ..enums import WorkflowState, AssignmentWorkflowState
from .common import CVItem, Subject, ItemLocation
from .system import AuditInformation


@unique
class NewsCoverageQcodes(str, Enum):
    INTENDED = "ncostat:int"
    NOT_INTENDED = "ncostat:notint"
    NOT_DECIDED = "ncostat:notdec"
    ON_REQUEST = "ncostat:onreq"


class NewsCoverageStatus(Dataclass):
    qcode: NewsCoverageQcodes = Field(description="Qcode of the news coverage status")
    name: fields.Keyword = Field(description="Name of the news coverage status")
    label: fields.Keyword = Field(description="Label for news coverage status")


class CoverageFlags(Dataclass):
    no_content_linking: bool = Field(
        description="If True, content linking will be skipped for this coverage",
        default=False,
    )


class CoverageAssignedTo(Dataclass):
    assignment_id: Annotated[fields.ObjectId | None, validate_data_relation_async("assignments")] = Field(
        description="ID of the Assignment for this Coverage", default=None
    )
    state: AssignmentWorkflowState = Field(
        description="The workflow status of the assignment", default=AssignmentWorkflowState.DRAFT
    )
    contact: Annotated[fields.ObjectId | None, validate_data_relation_async("contacts")] = Field(
        description="ID of the Contact for this Coverage", default=None
    )
    user: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = Field(
        description="ID of the User for this Coverage", default=None
    )
    desk: Annotated[fields.ObjectId | None, validate_data_relation_async("desks")] = Field(
        description="ID of the Desk for this Coverage", default=None
    )


class NewsContentCharacteristics(Dataclass):
    name: fields.Keyword = Field(description="Name of the news content characteristic")
    value: fields.Keyword = Field(description="Value of the news content characteristic")


class PlanningExtendedProperty(Dataclass):
    qcode: fields.Keyword = Field(description="Qcode of the planning extended property")
    value: fields.Keyword = Field(description="Value of the planning extended property")
    name: fields.Keyword = Field(description="Name of the planning extended property")


class CustomCoverageField(Dataclass):
    field: fields.Keyword = Field(description="Name of the custom Coverage field")
    value: fields.HTML = Field(description="Value of the custom Coverage field")


class CoveragePlanning(Dataclass):
    g2_content_type: fields.Keyword = Field(description="G2 Content Type of the Coverage")
    scheduled: datetime = Field(description="Due date and time for this Coverage")
    genre: list[CVItem] | None = Field(description="Genre(s) associated with this Coverage", default=None)
    slugline: fields.Slugline | None = Field(description="Slugline associated with this Coverage", default=None)
    headline: fields.HTML | None = Field(description="Headline associated with this Coverage", default=None)
    ednote: str | None = Field(description="Editorial note for this Coverage", default=None)
    internal_note: str | None = Field(description="Internal note for this Coverage", default=None)
    keyword: list[str] | None = Field(description="Keyword(s) associated with this Coverage", default=None)
    language: fields.Keyword | None = Field(description="Language associated with this Coverage", default=None)
    coverage_provider: fields.Keyword | None = Field(
        description="The external provider for this Coverage", default=None
    )
    contact_info: Annotated[fields.ObjectId | None, validate_data_relation_async("contacts")] = Field(
        description="ID of the Contact for this Coverage", default=None
    )
    subject: Annotated[list[Subject] | None, fields.nested_list(include_in_parent=True, dynamic=False)] = Field(
        description="Subject(s) associated with this Coverage", default=None
    )
    workflow_status_reason: str | None = Field(
        description="Reason for the current workflow status of this Coverage", default=None
    )
    priority: int | None = Field(description="Priority of this Coverage", default=None)
    anpa_category: list[CVItem] | None = Field(
        description="List of ANPA categories associated with this Coverage", default=None
    )
    multiple_content: bool = Field(
        description="Indicates if this Coverage contains multiple content items", default=False
    )
    custom_fields: list[CustomCoverageField] | None = Field(
        alias="fields", description="List of custom fields associated with this Coverage", default=None
    )
    location: Annotated[list[ItemLocation] | None, fields.dynamic_mapping(False)] = Field(
        description="List of locations related to the item", default=None
    )
    files: Annotated[list[fields.ObjectId] | None, validate_data_relation_async("planning_files")] = Field(
        description="List of file IDs associated with this Coverage", default=None
    )
    xmp_file: Annotated[fields.ObjectId | None, validate_data_relation_async("planning_files")] = Field(
        description="ID of the XMP file associated with this Coverage", default=None
    )

    # TODO: Are these next lot used anywhere?
    item_class: fields.Keyword | None = Field(description="Class for the Coverage", default=None)
    item_count: int | None = Field(description="Count of items in the Coverage", default=None)
    service: list[CVItem] | None = Field(description="Service(s) associated with this Coverage", default=None)
    news_content_characteristics: list[NewsContentCharacteristics] | None = Field(
        description="News content characteristics associated with this Coverage", default=None
    )
    planning_ext_property: list[PlanningExtendedProperty] | None = Field(
        description="Planning extended properties associated with this Coverage", default=None
    )
    by: list[str] | None = Field(description="Byline(s) associated with this Coverage", default=None)
    credit_line: list[str] | None = Field(description="Credit line(s) associated with this Coverage", default=None)
    dateline: list[str] | None = Field(description="Dateline(s) associated with this Coverage", default=None)
    description_text: fields.HTML | None = Field(
        description="Description text associated with this Coverage", default=None
    )


class CoverageScheduledUpdatePlanning(Dataclass):
    scheduled: datetime = Field(
        description="Due date and time for this Coverage",
    )
    genre: list[CVItem] | None = Field(description="Genre(s) associated with this Coverage", default=None)
    internal_note: str | None = Field(description="Internal note for this Coverage", default=None)
    contact_info: Annotated[fields.ObjectId | None, validate_data_relation_async("contacts")] = Field(
        description="ID of the Contact for this Coverage", default=None
    )
    workflow_status_reason: str | None = Field(
        description="Reason for the current workflow status of this Coverage", default=None
    )
    multiple_content: bool = Field(
        description="Indicates if this Coverage contains multiple content items", default=False
    )


class CoverageScheduledUpdate(Dataclass):
    scheduled_update_id: fields.Keyword = Field(description="Scheduled update ID")
    coverage_id: fields.Keyword = Field(description="Parent Coverage ID")
    news_coverage_status: NewsCoverageStatus = Field(description="The news coverage status of the item")
    workflow_status: WorkflowState = Field(description="The workflow status of the item", default=WorkflowState.DRAFT)
    assigned_to: CoverageAssignedTo = Field(
        description="The Assignment and Contact for this Update Coverage", default_factory=CoverageAssignedTo
    )
    previous_status: WorkflowState | None = Field(
        description="The previous workflow status of the item",
        default=None,
    )
    planning: CoverageScheduledUpdatePlanning = Field(
        description="The planning information for this Update Coverage", default_factory=CoverageScheduledUpdatePlanning
    )


class CoverageItem(AuditInformation, BaseModel):
    coverage_id: fields.Keyword = Field(description="Coverage ID")
    original_coverage_id: fields.Keyword | None = Field(description="Original Coverage ID")
    guid: fields.Keyword | None = Field(description="Coverage GUID", default=None)  # is this used anywhere?
    profile: Annotated[fields.Keyword | None, validate_data_relation_async("coverage_profiles")] = Field(
        description="ID of the Coverage profile", default=None
    )
    news_coverage_status: NewsCoverageStatus = Field(description="The news coverage status of the item")
    workflow_status: WorkflowState = Field(description="The workflow status of the item", default=WorkflowState.DRAFT)
    previous_status: WorkflowState | None = Field(
        description="The previous workflow status of the item",
        default=None,
    )
    flags: CoverageFlags = Field(description="Flags for the coverage item", default_factory=CoverageFlags)
    assigned_to: CoverageAssignedTo = Field(
        description="The Assignment and Contact for this Coverage", default_factory=CoverageAssignedTo
    )
    planning: CoveragePlanning = Field(
        description="The planning information for this Coverage", default_factory=CoveragePlanning
    )
    time_to_be_confirmed: bool = Field(
        alias="_time_to_be_confirmed",
        description="Whether the item's schedule is to be confirmed",
        default=False,
    )
    scheduled_updates: list[CoverageScheduledUpdate] | None = Field(
        description="The scheduled updates for this Coverage", default=None
    )

    # TODO: This should not be stored in the database
    add_coverage_to_workflow: bool = Field(description="If True the item will be added to workflow", default=False)


class ItemCoverage:
    news_coverage_status: NewsCoverageStatus | None = Field(
        description="The news coverage status of the item", default=None
    )
    coverages: Annotated[list[CoverageItem] | None, fields.nested_list()] = Field(
        description="List of coverages associated with the unified planning resource", default=None
    )
