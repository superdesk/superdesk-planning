from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import ResourceModel, fields, Dataclass, default_model_config

from planning.types import (
    PlanningSchedule,
    SubjectListType,
    SlugLineField,
    PostStates,
    Place,
    MatchingProduct,
    KeywordQCodeName,
)


class ContactPhoneNumber(Dataclass):
    number: str
    usage: str
    public: bool


class ContactLocationEntity(Dataclass):
    name: str
    qcode: fields.Keyword
    translations: dict[str, str]


class ContactsResource(Dataclass):
    uri: fields.Keyword | None = None
    organisation: fields.TextWithKeyword | None = None
    first_name: fields.TextWithKeyword | None = None
    last_name: fields.TextWithKeyword | None = None
    honorific: str | None = None
    job_title: str | None = None
    mobile: list[ContactPhoneNumber] | None = None
    contact_phone: list[ContactPhoneNumber] | None = None
    fax: str | None = None
    contact_email: list[fields.Keyword] | None = None
    twitter: str | None = None
    facebook: str | None = None
    instagram: str | None = None
    website: str | None = None
    contact_address: list[str] | None = None
    locality: list[str] | None = None
    city: list[str] | None = None
    contact_state: ContactLocationEntity | None = None
    postcode: fields.Keyword | None = None
    country: ContactLocationEntity | None = None
    notes: str | None = None
    contact_type: str | None = None


def generate_title(item: type["BasePlanningContentAPIResource"]) -> str:
    return "Event" if "event" in item.__name__ else "Planning"


class BasePlanningContentAPIResource(ResourceModel):
    model_config = {
        **default_model_config,
        "extra": "allow",
        "model_title_generator": generate_title,
    }

    id: Annotated[str, Field(alias="_id")]
    firstcreated: datetime | None = None
    versioncreated: datetime | None = None
    products: list[MatchingProduct] | None = None
    subscribers: list[fields.ObjectId] | None = None

    # This is an extra field so that we can sort in the combined view of events and planning.
    # It will store the dates.start of the event.
    # Exclude from API response & docs
    planning_schedule: Annotated[
        list[PlanningSchedule], fields.nested_list(), Field(alias="_planning_schedule", default_factory=list)
    ]

    # What about these 2? Not available on Planning item
    version: int | None = None
    ingest_id: fields.Keyword | None = None

    recurrence_id: fields.Keyword | None = None

    # The value is copied from the ingest_providers vocabulary
    source: fields.Keyword | None = None
    # This value is extracted from the ingest
    original_source: fields.Keyword | None = None

    name: str | None = None
    anpa_category: list[KeywordQCodeName] | None = None
    priority: int | None = None

    subject: SubjectListType | None = None
    slugline: SlugLineField | None = None

    language: fields.Keyword | None = None

    pubstatus: PostStates | None = None
    place: list[Place] | None = None
    ednote: fields.HTML | None = None

    extra: dict | None = None
