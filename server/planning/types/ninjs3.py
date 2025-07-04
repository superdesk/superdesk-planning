from datetime import datetime
from enum import Enum, unique

from pydantic import Field

from superdesk.core.resources import BaseModel, Dataclass


partial_datetime_regex = "^(-?(?:[1-9][0-9]*)?[0-9]{4})(-(1[0-2]|0[1-9])(-(3[01]|0[1-9]|[12][0-9])(T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z|[+-](?:2[0-3]|[01][0-9]):[0-5][0-9])?)?)?)?$"
partial_datetime_description = "Allows any of year (xs:gYear, YYYY), year/month (xs:gYearMonth, YYYY-MM), year/month/day (xs:date YYYY-MM-DD), and full datetime (xs:dateTime, YYYY-MM-DDTHH:MM:SS+HH:MM), all with an optional timezone suffix. Note that this does NOT include ISO8601 month of year (xs:gMonth, --MM) or yearly day (xs:gMonthDay, --MM-DD)"


@unique
class RecurrenceRulesFrequency(str, Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"


class RecurrenceRulesObject(Dataclass):
    """Date(s) (and optionally times) on which the event occurs."""

    frequency: RecurrenceRulesFrequency = Field(
        title="Frequency", description="The FREQ rule part identifies the type of recurrence rule."
    )
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
    expectedStartDate: str | None = Field(
        title="Expected Start Date",
        description=partial_datetime_description,
        pattern=partial_datetime_regex,
        default=None,
    )
    expectedEndDate: str | None = Field(
        title="Expected End Date",
        description=partial_datetime_description,
        pattern=partial_datetime_regex,
        default=None,
    )
    recurrence: RecurrenceObject | None = Field(
        description="Specifies recurrence information about the event.",
        default=None,
    )
    timezone: str | None = Field(
        title="Timezone",
        description="The timezone where the event takes place.",
        default=None,
    )
