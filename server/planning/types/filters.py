from pydantic import Field
from typing import Annotated
from datetime import datetime

from superdesk.core.resources import fields, Dataclass
from superdesk.core.resources.validators import validate_data_relation_async, validate_iunique_value_async

from .base import BasePlanningModelWithObjectId
from .enums import LockState, SpikedState, SearchItemType, SearchScheduleFrequency, SearchWeekDay, SearchDateRange


class CVItem(Dataclass):
    qcode: str
    name: str


class CVItemInt(Dataclass):
    qcode: int
    name: str


class G2ContentType(CVItem):
    content_item_type: str | None = Field(None, alias="content item type")


class SourceItem(Dataclass):
    id: Annotated[fields.ObjectId, validate_data_relation_async("ingest_providers")]
    name: str


class Schedule(Dataclass):
    frequency: SearchScheduleFrequency
    desk: Annotated[fields.ObjectId, validate_data_relation_async("desks")]
    article_template: Annotated[fields.ObjectId | None, validate_data_relation_async("content_templates")] = None
    template: str | None = None
    _last_sent: datetime | None = None
    hour: int = -1
    hours: list[str] | None = None
    day: int = -1
    week_days: list[SearchWeekDay] | None = None


class FilterParams(Dataclass):
    # Common Fields
    item_ids: list[str] | None = None
    name: str | None = None
    tz_offset: str | None = None
    time_zone: str | None = None
    full_text: str | None = None
    anpa_category: list[CVItem] | None = None
    subject: list[CVItem] | None = None
    posted: bool | None = None
    place: list[CVItem] | None = None
    language: str | None = None
    state: list[CVItem] | None = None
    spike_state: SpikedState | None = None
    include_killed: bool | None = None
    date_filter: SearchDateRange | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    only_future: bool | None = None
    start_of_week: int | None = None
    slugline: str | None = None
    lock_state: LockState | None = None
    recurrence_id: str | None = None
    max_results: int | None = None

    # Event Specific Fields
    reference: str | None = None
    source: list[SourceItem] | None = None
    location: CVItem | None = None
    calendars: list[CVItem] | None = None
    no_calendar_assigned: bool | None = None

    # Planning Specific Fields
    agendas: Annotated[list[fields.ObjectId] | None, validate_data_relation_async("agenda")] = None
    no_agenda_assigned: bool | None = None
    ad_hoc_planning: bool | None = None
    exclude_rescheduled_and_cancelled: bool | None = None
    no_coverage: bool | None = None
    urgency: CVItemInt | None = None
    g2_content_type: G2ContentType | None = None
    featured: bool | None = None
    include_scheduled_updates: bool | None = None
    event_item: Annotated[list[str] | None, validate_data_relation_async("events")] = None
    coverage_assignment_status: str | None = None


class EventPlanningFilter(BasePlanningModelWithObjectId):
    name: Annotated[str, validate_iunique_value_async("events_planning_filters", "name")]
    item_type: SearchItemType = Field(default=SearchItemType.COMBINED)
    params: FilterParams = Field(default_factory=FilterParams)
    schedules: list[Schedule] | None = None
