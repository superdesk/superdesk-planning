from pydantic import Field
from typing import Annotated
from datetime import datetime
from enum import Enum, unique

from superdesk.core.resources import fields, Dataclass
from superdesk.core.resources.validators import validate_data_relation_async, validate_iunique_value_async

from planning.types import BasePlanningModel


@unique
class ItemType(str, Enum):
    EVENT = "events"
    PLANNING = "planning"
    COMBINED = "combined"


@unique
class ScheduleFrequency(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


@unique
class WeekDay(str, Enum):
    SUNDAY = "Sunday"
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"


@unique
class LockState(str, Enum):
    LOCKED = "locked"
    UNLOCKED = "unlocked"


@unique
class SpikedState(str, Enum):
    BOTH = "both"
    NOT_SPIKED = "draft"
    SPIKED = "spiked"


@unique
class DateRange(str, Enum):
    TODAY = "today"
    TOMORROW = "tomorrow"
    THIS_WEEK = "this_week"
    NEXT_WEEK = "next_week"
    LAST_24 = "last24"
    FOR_DATE = "for_date"


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
    frequency: ScheduleFrequency
    desk: Annotated[fields.ObjectId, validate_data_relation_async("desks")]
    article_template: Annotated[fields.ObjectId, validate_data_relation_async("content_templates")] | None = None
    template: str | None = None
    _last_sent: datetime | None = None
    hour: int = -1
    day: int = -1
    week_days: list[WeekDay] = Field(default_factory=list)


class FilterParams(Dataclass):
    # Common Fields
    item_ids: list[str] = Field(default_factory=list)
    name: str | None = None
    tz_offset: str | None = None
    time_zone: str | None = None
    full_text: str | None = None
    anpa_category: list[CVItem] = Field(default_factory=list)
    subject: list[CVItem] = Field(default_factory=list)
    posted: bool | None = None
    place: list[CVItem] = Field(default_factory=list)
    language: str | None = None
    state: list[CVItem] = Field(default_factory=list)
    spike_state: SpikedState | None = None
    include_killed: bool | None = None
    date_filter: DateRange | None = None
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
    source: list[SourceItem] = Field(default_factory=list)
    location: CVItem | None = None
    calendars: list[CVItem] = Field(default_factory=list)
    no_calendar_assigned: bool | None = None

    # Planning Specific Fields
    agendas: Annotated[list[str], validate_data_relation_async("agenda")] = Field(default_factory=list)
    no_agenda_assigned: bool | None = None
    ad_hoc_planning: bool | None = None
    exclude_rescheduled_and_cancelled: bool | None = None
    no_coverage: bool | None = None
    urgency: CVItemInt | None = None
    g2_content_type: G2ContentType | None = None
    featured: bool | None = None
    include_scheduled_updates: bool | None = None
    event_item: Annotated[list[str], validate_data_relation_async("events")] = Field(default_factory=list)
    coverage_assignment_status: str | None = None


class EventPlanningFilter(BasePlanningModel):
    name: Annotated[str, validate_iunique_value_async("events_planning_filters", "name")]
    item_type: ItemType = Field(default=ItemType.COMBINED)
    params: FilterParams = Field(default_factory=FilterParams)
    schedules: list[Schedule] = Field(default_factory=list)
