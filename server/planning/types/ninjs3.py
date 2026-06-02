from datetime import datetime
from enum import Enum, unique

from pydantic import Field

from superdesk.core.resources import BaseModel, Dataclass
from superdesk.core.resources.fields import DateWithOptionalTime


@unique
class RecurrenceRulesFrequency(str, Enum):
    """The FREQ rule part identifies the type of recurrence rule."""

    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class RecurrenceRulesObject(Dataclass):
    """Date(s) (and optionally times) on which the event occurs."""

    frequency: RecurrenceRulesFrequency
    interval: int = Field(
        description="The INTERVAL rule part contains a positive integer representing how often the recurrence rule repeats."
    )
    until: datetime | None = Field(
        description="The UNTIL rule part defines a date-time value which bounds the recurrence rule in an inclusive manner.",
        default=None,
    )
    count: int | None = Field(
        description="The COUNT rule part defines the number of occurrences at which to range-bound the recurrence.",
        default=None,
    )
    byday: str | None = Field(
        description="Days of week for weekly recurrence",
        default=None,
    )


class RecurrenceObject(Dataclass):
    """Specifies recurrence information about the event."""

    recurrenceRules: list[RecurrenceRulesObject]


class DatesObject(BaseModel):
    startDate: datetime | None = Field(
        title="Start Date",
        description="The date and time at which the event starts.",
        default=None,
    )
    endDate: datetime | None = Field(
        title="End Date",
        description="The date and time at which the event ends.",
        default=None,
    )
    expectedStartDate: DateWithOptionalTime | None = Field(
        title="The approximate date (and optionally time) at which the event or coverage is expected to start.",
        default=None,
    )
    expectedEndDate: DateWithOptionalTime | None = Field(
        title="The approximate date (and optionally time) at which the event or coverage is expected to end.",
        default=None,
    )
    recurrence: RecurrenceObject | None = None
    timezone: str | None = Field(
        description="The timezone where the event takes place.",
        default=None,
    )
