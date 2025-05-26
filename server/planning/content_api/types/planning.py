from pydantic import Field
from typing import Annotated
from superdesk.core.resources import fields, Dataclass
from planning.types import (
    PlanningResourceModel,
    PlanningCoverage,
    CoverageProvider,
    DeliveryResourceModel,
    PLANNING_EVENT_LINK_METHOD,
)
from planning.types.common import SlugLineField, CoverageAssignedTo
from .common import MatchingProduct
from superdesk.core.resources.validators import validate_data_relation_async


class AgendaItem(Dataclass):
    _id: fields.ObjectId
    name: str


class RelatedEvent(Dataclass):
    uri: fields.Keyword
    name: str
    literal: fields.Keyword
    rel: PLANNING_EVENT_LINK_METHOD


class CoverageContactInfo(Dataclass):
    first_name: str
    last_name: str


class CoverageAssignedUser(Dataclass):
    first_name: str
    last_name: str
    display_name: str
    email: str | None = None


class CoverageAssignedDesk(Dataclass):
    name: str
    email: str | None = None


class PlanningCoverageItem(PlanningCoverage):
    workflow_status: fields.Keyword | None = None
    coverage_provider: CoverageProvider | None = None
    coverage_provider_contact_info: CoverageContactInfo | None = None
    assigned_user: CoverageAssignedUser | None = None
    assigned_desk: CoverageAssignedDesk | None = None
    deliveries: list[DeliveryResourceModel] | None = None


class ContentAPIPlanningResource(PlanningResourceModel):
    agendas: list[AgendaItem] = Field(default_factory=list)
    products: list[MatchingProduct] | None = None
    events: list[RelatedEvent] | None = None
    coverages: Annotated[list[PlanningCoverageItem], fields.nested_list(), Field(default_factory=list)]
    event_item: str | None = None
    subscribers: Annotated[list[fields.ObjectId], validate_data_relation_async("subscribers")]
