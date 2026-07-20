from typing import Annotated
from datetime import datetime
from enum import Enum, unique

from pydantic import Field

from superdesk.core.resources import Dataclass, fields


@unique
class RecurringFrequency(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"


@unique
class RecurringEndMode(str, Enum):
    COUNT = "count"
    UNTIL = "until"


class ItemRecurringDates(Dataclass):
    frequency: RecurringFrequency = Field(description="The frequency of the recurring item")
    interval: int = Field(description="The interval of the recurring item", default=1)
    end_repeat_mode: RecurringEndMode = Field(
        alias="endRepeatMode", description="The end repeat mode of the recurring item", default=RecurringEndMode.COUNT
    )
    until: datetime | None = Field(description="The end date and time of the recurring item", default=None)
    count: int | None = Field(description="The end count of the recurring item", default=None)
    created_externally: bool = Field(
        description="Whether the item was created externally", default=False, alias="_created_externally"
    )


class ItemDates(Dataclass):
    start: datetime = Field(description="Scheduled start date, and optional time, of the item")
    end: datetime | None = Field(description="Scheduled end date, and optional time, of the item", default=None)
    tz: fields.Keyword | None = Field(
        description="An optional timezone of the item, in IANA format",
        examples=["Europe/Prague", "Australia/Sydney"],
        default=None,
    )
    all_day: bool = Field(description="Whether the item is an all-day event", default=False)
    no_end_time: bool = Field(description="Whether the item has no end time", default=False)
    recurring_rule: ItemRecurringDates | None = Field(description="The recurring rule of the item", default=None)


class ItemScheduleEntry(Dataclass):
    scheduled: datetime = Field(description="The scheduled date of the item schedule entry")
    coverage_id: fields.Keyword | None = Field(
        description="The coverage ID of the item schedule entry (if this schedule entry is for a Coverage)",
        default=None,
    )


class ItemUpdateScheduleEntry(Dataclass):
    scheduled: datetime = Field(description="The scheduled date of the item schedule entry")
    scheduled_update_id: fields.Keyword | None = Field(
        description="The coverage ID of the item schedule entry (if this schedule entry is for a Coverage)",
        default=None,
    )


@unique
class OccurStatusCodes(str, Enum):
    UNPLANNED = "eocstat:eos0"
    PLANNED = "eocstat:eos1"
    HIGHLY_UNCERTAIN = "eocstat:eos2"
    MAY_OCCUR = "eocstat:eos3"
    HIGHLY_LIKELY = "eocstat:eos4"
    CERTAINLY = "eocstat:eos5"
    PLANNED_THEN_CANCELLED = "eocstat:eos6"


class OccurStatus(Dataclass):
    qcode: OccurStatusCodes = Field(description="The occur status of the item")
    name: fields.Keyword = Field(description="The name of the occur status")
    label: fields.Keyword = Field(description="The label of the occur status")


class ItemSchedule:
    dates: ItemDates = Field(description="The dates of the item")
    occur_status: OccurStatus | None = Field(description="The occur status of the item", default=None)
    time_to_be_confirmed: bool = Field(
        alias="_time_to_be_confirmed",
        description="Whether the item's schedule is to be confirmed",
        default=False,
    )
    completed: bool = Field(
        description="Whether the item is marked as completed",
        default=False,
    )
    planning_schedule: Annotated[list[ItemScheduleEntry], fields.nested_list()] = Field(
        alias="_planning_schedule",
        description="Internal field used for storing item dates, for filtering and sorting",
        default_factory=list,
    )
    updates_schedule: Annotated[list[ItemUpdateScheduleEntry] | None, fields.nested_list()] = Field(
        alias="_updates_schedule",
        description="Internal field used for storing update item dates",
        default=None,
    )
