from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import fields, Dataclass
from superdesk.core.resources.validators import validate_data_relation_async

from planning.types import PlanningResourceModel, PlanningCoverage, CoverageProvider, LinkType
from .common import MatchingProduct


class AgendaItem(Dataclass):
    _id: fields.ObjectId
    name: str


class RelatedEvent(Dataclass):
    uri: fields.Keyword
    name: str
    literal: fields.Keyword
    rel: LinkType


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


class CoverageDelivery(Dataclass):
    item_id: str | None = None
    item_state: str | None = None
    sequence_no: int = 0
    publish_time: datetime | None = None
    scheduled_update_id: str | None = None


class PlanningCoverageItem(PlanningCoverage):
    workflow_status: fields.Keyword | None = None
    coverage_provider: CoverageProvider | None = None
    coverage_provider_contact_info: CoverageContactInfo | None = None
    assigned_user: CoverageAssignedUser | None = None
    assigned_desk: CoverageAssignedDesk | None = None
    deliveries: list[CoverageDelivery] | None = None


class ContentAPIPlanningResource(PlanningResourceModel):
    agendas: list[AgendaItem] = Field(default_factory=list)
    products: list[MatchingProduct] | None = None
    events: list[RelatedEvent] | None = None
    coverages: Annotated[list[PlanningCoverageItem], fields.nested_list(), Field(default_factory=list)]
    event_item: str | None = None
    subscribers: Annotated[list[fields.ObjectId], validate_data_relation_async("subscribers")]
