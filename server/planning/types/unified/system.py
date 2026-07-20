from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import Dataclass, fields
from superdesk.core.resources.validators import validate_data_relation_async
from superdesk.utc import utcnow

from ..enums import WorkflowState, PostStates, LinkType


class AuditInformation:
    original_creator: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = Field(
        description="ID of the user who originally created the item, `null` if was created by the system", default=None
    )
    version_creator: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = Field(
        description="ID of the user who last updated this item, `null` if it was updated by the system", default=None
    )
    firstcreated: datetime = Field(default_factory=utcnow, description="Date and time when the item was first created")
    versioncreated: datetime = Field(default_factory=utcnow, description="Date and time when the item was last updated")


class IngestDetails:
    ingest_id: fields.Keyword | None = Field(description="The ID provided by the ingest provider", default=None)
    ingest_provider: Annotated[fields.ObjectId | None, validate_data_relation_async("ingest_providers")] = Field(
        description="The internal ID of the ingest provider", default=None
    )
    ingest_provider_sequence: fields.Keyword | None = Field(
        description="The sequence number provided by the ingest provider", default=None
    )
    ingest_firstcreated: datetime | None = Field(
        description="Date and time when the item was first created by the ingest provider", default=None
    )
    ingest_versioncreated: datetime | None = Field(
        description="Date and time when the item was last updated by the ingest provider", default=None
    )
    ingest_pubstatus: PostStates | None = Field(
        description="The publication status of the item provided by the ingest provider", default=None
    )


class LockFields:
    lock_user: Annotated[fields.ObjectId, validate_data_relation_async("users")] | None = Field(
        description="The internal ID of the user who has locked the item", default=None
    )
    lock_time: datetime | None = Field(description="Date and time when the item was locked", default=None)
    lock_session: Annotated[fields.ObjectId, validate_data_relation_async("auth")] | None = Field(
        description="The internal ID of the session that has locked the item", default=None
    )
    lock_action: fields.Keyword | None = Field(description="The action that has locked the item", default=None)


class SourceDetails:
    # TODO: Should these be keywords?
    source: str | None = Field(description="The name of the source of the item", default=None)
    original_source: str | None = Field(description="The name of the original source of the item", default=None)


class PlanningFlags(Dataclass):
    marked_for_not_publication: bool = Field(
        description="Flag indicating if the item is marked for not publication",
        default=False,
    )
    overide_auto_assign_to_workflow: bool = Field(
        description="Flag indicating if the item should override auto assignment to workflow",
        default=False,
    )


class RelatedPlanningItem(Dataclass):
    item_id: fields.Keyword = Field(alias="_id", description="ID of the related item")
    link_type: LinkType = Field(description="Type of the link between the item and the related item")
    recurrence_id: fields.Keyword | None = Field(
        description="ID of the recurrence of the related item",
        default=None,
    )


class RelatedContentItem(Dataclass):
    guid: fields.Keyword = Field(description="GUID of the related item")
    type: fields.Keyword = Field(description="Type of the related item")
    state: fields.Keyword = Field(description="State of the related item")
    version: int | None = Field(description="Version of the related item", default=None)
    headline: fields.Keyword | None = Field(description="Headline of the related item", default=None)
    slugline: fields.Keyword | None = Field(description="Slugline of the related item", default=None)
    versioncreated: datetime | None = Field(
        description="Date and time when the related item was last updated", default=None
    )
    search: fields.Keyword | None = Field(description="Search term of the related item", default=None)
    search_provider: fields.Keyword | None = Field(description="Search provider of the related item", default=None)
    pubstatus: fields.Keyword | None = Field(description="Publication status of the related item", default=None)
    language: fields.Keyword | None = Field(description="Language of the related item", default=None)
    word_count: int | None = Field(description="Word count of the related item", default=None)


class ItemSystemFields:
    guid: fields.Keyword | None = Field(description="Global unique identifier of the item", default=None)
    recurrence_id: fields.Keyword | None = Field(
        description="Global unique identifier of the recurrence of the item",
        default=None,
    )
    previous_recurrence_id: fields.Keyword | None = Field(
        description="Global unique identifier of the previous recurrence of the item",
        default=None,
    )
    # TODO: We should use recurrence_id instead, needs investigation
    planning_recurrence_id: fields.Keyword | None = Field(
        description="Global unique identifier of the planning recurrence of the item",
        default=None,
    )

    # TODO: These seem specific to Events, could we use this for ingested Planning too?
    event_created: datetime | None = Field(
        description="Date and time when the item was created",
        default=None,
    )
    event_lastmodified: datetime | None = Field(
        description="Date and time when the item was last modified",
        default=None,
    )

    version: int | None = Field(description="Version of the item", default=None)
    state: WorkflowState = Field(description="Workflow state of the item", default=WorkflowState.DRAFT)
    state_reason: str | None = Field(
        description="Reason for the workflow state of the item, such as when cancelled",
        default=None,
    )
    expiry: datetime | None = Field(description="Date and time when the item is to expire", default=None)
    expired: bool = Field(
        description="Whether the item has expired and should no longer be used",
        default=False,
    )
    pubstatus: PostStates | None = Field(description="Publication status of the item", default=None)
    revert_state: WorkflowState | None = Field(
        description="Workflow state of the item before it's current state",
        default=None,
    )
    duplicate_from: fields.Keyword | None = Field(
        description="ID of the item that this item was duplicated from",
        default=None,
    )
    duplicate_to: list[fields.Keyword] | None = Field(
        description="List of item IDs that was duplicated from this item", default=None
    )
    reschedule_from: fields.Keyword | None = Field(
        description="ID of the item that this item was rescheduled from", default=None
    )
    reschedule_to: fields.Keyword | None = Field(
        description="ID of the item that this item was rescheduled to", default=None
    )
    reschedule_from_schedule: datetime | None = Field(
        alias="_reschedule_from_schedule",
        description="The date and time that this item was rescheduled from",
        default=None,
    )
    actioned_date: datetime | None = Field(
        description="The date and time that this item was actioned",
        default=None,
    )
    profile: fields.ObjectId | None = Field(
        description="ID of the content profile for this item",
        default=None,
    )

    template: fields.ObjectId | None = Field(
        description="ID of the template that was used to create this item",
        default=None,
    )

    # TODO: This requires global uniqueness, do we really need that?
    unique_id: fields.Keyword | None = Field(description="Unique ID of the item", default=None)
    unique_name: fields.Keyword | None = Field(description="Unique name of the item", default=None)

    flags: PlanningFlags = Field(description="Flags to control logic for this item", default_factory=PlanningFlags)
    versionposted: datetime | None = Field(
        description="The date and time that this item was posted",
        default=None,
    )
    featured: bool = Field(
        description="Whether the item can be included in list of featured planning items",
        default=False,
    )

    related_planning: Annotated[list[RelatedPlanningItem] | None, fields.nested_list()] = Field(
        description="List of related Events or Planning items",
        default=None,
    )
    related_content: Annotated[
        list[RelatedContentItem] | None,
        fields.elastic_mapping({"dynamic": False, "properties": {"guid": {"type": "keyword"}}}),
    ] = Field(description="List of related Content items", default=None)
