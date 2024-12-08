from typing import List, Literal, TypeAlias
from datetime import datetime, date

from pydantic.fields import Field

from superdesk.core.resources import dataclass, fields, Dataclass


# NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.4.3

RepeatModeType: TypeAlias = Literal["count", "until"]


class RecurringRule(Dataclass):
    frequency: str | None = None
    interval: int | None = None
    end_repeat_mode: RepeatModeType | None = Field(default=None, alias="endRepeatMode")
    until: datetime | None = None
    count: int | None = None
    bymonth: str | None = None
    byday: str | None = None
    byhour: str | None = None
    byminute: str | None = None
    _created_externally: bool | None = False


@dataclass
class ExRule:
    frequency: str
    interval: str
    until: datetime | None = None
    count: int | None = None
    bymonth: str | None = None
    byday: str | None = None
    byhour: str | None = None
    byminute: str | None = None


@dataclass
class OccurStatus:
    qcode: fields.Keyword | None = None
    name: fields.Keyword | None = None
    label: fields.Keyword | None = None


class EventDates(Dataclass):
    # TODO-ASYNC: double check which ones are mandatory
    start: datetime | None = None
    end: datetime | None = None
    tz: str | None = None
    end_tz: str | None = None
    all_day: bool = False
    no_end_time: bool = False
    duration: str | None = None
    confirmation: str | None = None
    recurring_date: List[date] | None = None
    recurring_rule: RecurringRule | None = None
    occur_status: OccurStatus | None = None
    ex_date: List[date] = Field(default_factory=list)
    ex_rule: ExRule | None = None
