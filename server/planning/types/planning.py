from datetime import datetime
from typing import Annotated, Any
from pydantic import Field, model_validator

from content_api.items.model import CVItem, Place

from superdesk.utc import utcnow
from superdesk.core.resources import fields, dataclass
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.core.resources.validators import validate_data_relation_async

from .event import Translation
from .base import BasePlanningModel
from .enums import PostStates, UpdateMethods, WorkflowState
from .common import (
    CoverageAssignedTo,
    LockFieldsMixin,
    PlanningSchedule,
    RelatedEvent,
    SlugLineField,
    SubjectListType,
    PlanningCoverage,
    TimeToBeConfirmedType,
    UpdatesSchedule,
)


@dataclass
class Flags:
    marked_for_not_publication: bool = False
    # TODO: double check if we can fix this typo `overide` -> `override`
    overide_auto_assign_to_workflow: bool = False


class PlanningResourceModel(BasePlanningModel, LockFieldsMixin):
    guid: Annotated[fields.Keyword, Field(default_factory=lambda: generate_guid(type=GUID_NEWSML))]
    unique_id: fields.Keyword | None = None

    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)

    # Ingest Details
    ingest_provider: Annotated[fields.ObjectId, validate_data_relation_async("ingest_providers")] | None = None
    source: fields.Keyword | None = None
    original_source: fields.Keyword | None = None
    ingest_provider_sequence: fields.Keyword | None = None
    ingest_firstcreated: datetime = Field(default_factory=utcnow)
    ingest_versioncreated: datetime = Field(default_factory=utcnow)

    # Agenda Item details
    agendas: list[Annotated[fields.ObjectId, validate_data_relation_async("agenda")]] = Field(default_factory=list)
    related_events: list[RelatedEvent] = Field(default_factory=list)
    recurrence_id: fields.Keyword | None = None
    planning_recurrence_id: fields.Keyword | None = None

    # Planning Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 16
    # Planning Item Metadata - See IPTC-G2-Implementation_Guide 16.1
    item_class: str = Field(default="plinat:newscoverage")

    ednote: fields.HTML | None = None
    description_text: fields.HTML | None = None
    internal_note: fields.HTML | None = None

    anpa_category: list[CVItem] = Field(default_factory=list)
    subject: SubjectListType = Field(default_factory=list)
    genre: list[CVItem] = Field(default_factory=list)
    company_codes: list[CVItem] = Field(default_factory=list)

    # Content Metadata - See IPTC-G2-Implementation_Guide 16.2
    language: fields.Keyword | None = None
    languages: list[fields.Keyword] = Field(default_factory=list)
    translations: Annotated[list[Translation], fields.nested_list()] = Field(default_factory=list)

    abstract: fields.HTML | None = None
    headline: fields.HTML | None = None
    slugline: SlugLineField | None = None
    keywords: list[fields.HTML] = Field(default_factory=list)

    word_count: int | None = None
    priority: int | None = None
    urgency: int | None = None
    profile: str | None = None

    # These next two are for spiking/unspiking and purging of planning/agenda items
    state: WorkflowState = WorkflowState.DRAFT
    expiry: datetime | None = None
    expired: bool = False
    featured: bool = False

    coverages: Annotated[
        list[PlanningCoverage],
        fields.elastic_mapping(
            {
                "type": "nested",
                "properties": {
                    "coverage_id": {"type": "keyword"},
                    "planning": {
                        "type": "object",
                        "properties": {
                            "slugline": SlugLineField.elastic_mapping,
                        },
                    },
                    "assigned_to": {
                        "type": "object",
                        "properties": CoverageAssignedTo.to_elastic_properties(),
                    },
                    "original_creator": {
                        "type": "keyword",
                    },
                },
            }
        ),
    ] = Field(default_factory=list)

    # field to sync coverage scheduled information
    # to be used for sorting/filtering on scheduled
    planning_schedule: Annotated[list[PlanningSchedule], fields.nested_list()] = Field(
        default_factory=list, alias="_planning_schedule"
    )

    # field to sync scheduled_updates scheduled information
    # to be used for sorting/filtering on scheduled
    updates_schedule: Annotated[list[UpdatesSchedule], fields.nested_list()] = Field(
        default_factory=list, alias="updates_schedule"
    )

    planning_date: datetime
    flags: Flags = Field(default_factory=Flags)
    pubstatus: PostStates | None = None
    revert_state: WorkflowState | None = None

    place: list[Place] = Field(default_factory=list)
    name: str | None = None
    files: Annotated[list[fields.ObjectId], validate_data_relation_async("planning_files")] = Field(
        default_factory=list
    )

    # Reason (if any) for the current state (cancelled, postponed, rescheduled)
    state_reason: str | None = None
    time_to_be_confirmed: TimeToBeConfirmedType = False
    extra: Annotated[dict[str, Any], fields.dynamic_mapping()] = Field(default_factory=dict)

    versionposted: datetime | None = None
    update_method: UpdateMethods | None = None

    # TODO-ASYNC: check why do we have `type` and `_type`
    _type: str | None = None

    @model_validator(mode="before")
    @classmethod
    def parse_dict(cls, values) -> dict[str, Any]:
        if not values.get("guid") and values.get("_id"):
            # Make sure there is a ``guid``
            values["guid"] = values["_id"]
        elif not values.get("_id") and values.get("guid"):
            # Make sure there is a ``_id``
            values["_id"] = values["guid"]

        return values
