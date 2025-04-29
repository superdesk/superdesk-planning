from superdesk.core.resources import fields, Dataclass
from pydantic import Field
from superdesk.utc import utcnow
from datetime import datetime
from planning.types import PlanningResourceModel, PLANNING_EVENT_LINK_METHOD


class AgendaItem(Dataclass):
    qcode: fields.Keyword
    name: str


class MatchingProduct(Dataclass):
    code: fields.Keyword
    name: str


class RelatedEvent(Dataclass):
    _id: fields.Keyword
    recurrence_id: str | None = None
    link_type: PLANNING_EVENT_LINK_METHOD | None = None


class CoverageAssignedTo(Dataclass):
    user: fields.Keyword | None = None
    desk: fields.Keyword | None = None
    contact: fields.Keyword | None = None
    assignment_id: fields.Keyword | None = None
    coverage_provider: dict | None = None


class CoveragePlanning(Dataclass):
    slugline: str | None = None
    ednote: str | None = None
    keyword: list[str] | None = None
    genre: dict | None = None
    internal_note: str | None = None
    language: fields.Keyword | None = None
    headline: str | None = None
    byline: str | None = None
    dateline: str | None = None
    scheduled: datetime = Field(default_factory=utcnow)


class PlanningCoverageItem(Dataclass):
    coverage_id: fields.Keyword
    planning: CoveragePlanning
    assigned_to: CoverageAssignedTo
    workflow_status: fields.Keyword | None = None
    news_coverage_status: dict | None = None
    original_creator: fields.Keyword | None = None


class ContentAPIPlanningResourceModel(PlanningResourceModel):
    agendas: list[AgendaItem] = Field(default_factory=list)
    products: list[MatchingProduct] | None = None
    events: list[RelatedEvent] | None = None
    coverages: list[PlanningCoverageItem] = Field(default_factory=list)
    event_item: list[str] | None = None
