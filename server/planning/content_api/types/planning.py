from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import fields

from planning.types import SlugLineField, LinkType, NewsCoverageStatus, AgendaItem, KeywordQCodeName
from .common import BasePlanningContentAPIResource, BaseContentAPIDataclass


class CoverageDelivery(BaseContentAPIDataclass):
    item_id: str | None = None
    item_state: str | None = None
    sequence_no: int = 0
    publish_time: datetime | None = None


class CoverageAssignedUser(BaseContentAPIDataclass):
    display_name: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class CoverageAssignedDesk(BaseContentAPIDataclass):
    name: str
    email: str | None = None


class ContentAPICoveragePlanning(BaseContentAPIDataclass):
    ednote: fields.HTML | None = None
    g2_content_type: fields.Keyword | None = None
    genre: list[KeywordQCodeName] | None = None
    headline: fields.HTML | None = None
    keyword: list[str] | None = None
    language: fields.Keyword | None = None
    slugline: SlugLineField | None = None
    workflow_status_reason: str | None = None
    priority: int | None = None
    scheduled: datetime | None = None


class ContentAPICoverageResource(BaseContentAPIDataclass):
    coverage_id: fields.Keyword
    news_coverage_status: NewsCoverageStatus | None = None
    workflow_status: fields.Keyword | None = None
    assigned_user: CoverageAssignedUser | None = None
    assigned_desk: CoverageAssignedDesk | None = None
    deliveries: list[CoverageDelivery] | None = None
    planning: ContentAPICoveragePlanning | None = None


class RelatedEvent(BaseContentAPIDataclass):
    uri: fields.Keyword
    name: str
    literal: fields.Keyword
    rel: LinkType


class ContentAPIPlanningResource(BasePlanningContentAPIResource):
    planning_date: datetime
    item_type: Annotated[fields.Keyword, Field(alias="type")] = "planning"
    description_text: fields.HTML | None = None
    agendas: list[AgendaItem] | None = None
    headline: fields.HTML | None = None
    urgency: int | None = None
    events: list[RelatedEvent] | None = None
    coverages: Annotated[list[ContentAPICoverageResource], fields.nested_list(), Field(default_factory=list)]
