from typing import Annotated
from datetime import datetime

from pydantic import Field, model_serializer

from superdesk.core.resources import fields, Dataclass, default_model_config

from planning.types import KeywordQCodeName
from planning.types.event import EventDates, OccurStatus, EventLocation
from .common import BasePlanningContentAPIResource, ContactsResource


class RelatedItem(Dataclass):
    Config = {"extra": "ignore"}

    guid: str
    type: str | None = None
    version: int | None = None
    source: str | None = None
    headline: fields.HTML | None = None
    slugline: str | None = None
    versioncreated: datetime | None = None
    pubstatus: str | None = None
    language: str | None = None
    word_count: int | None = None


class ContentAPIEventResource(BasePlanningContentAPIResource):
    item_type: Annotated[fields.Keyword, Field(alias="type")] = "event"

    definition_short: Annotated[
        str | None, Field(title="Definition Short", description="Short description of the Event")
    ] = None
    definition_long: str | None = None
    registration_details: str | None = None
    invitation_details: str | None = None
    accreditation_info: str | None = None
    accreditation_deadline: datetime | None = None
    reference: str | None = None
    links: list[str] | None = None

    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.4.3
    # TODO-PR: Use ninjs v3 date object for API response
    dates: EventDates | None = None
    occur_status: OccurStatus | None = None
    location: list[EventLocation] | None = None
    event_contact_info: list[ContactsResource] | None = None

    calendars: list[KeywordQCodeName] | None = None
    related_items: list[RelatedItem] | None = None
