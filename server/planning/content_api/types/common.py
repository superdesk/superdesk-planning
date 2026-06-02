from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import ResourceModel, fields, Dataclass, default_model_config, BaseModel

from planning.types import (
    PlanningSchedule,
    SubjectListType,
    SlugLineField,
    PostStates,
    Place,
    MatchingProduct,
    KeywordQCodeName,
)


planning_capi_model_config: dict = {
    **default_model_config,
    "extra": "ignore",
}


class GetItemArgs(BaseModel):
    item_id: str


class BaseContentAPIDataclass(Dataclass):
    model_config = planning_capi_model_config


class ContactPhoneNumber(BaseContentAPIDataclass):
    number: str
    usage: str | None = None


class ContactLocationEntity(BaseContentAPIDataclass):
    name: str
    qcode: fields.Keyword
    translations: dict[str, str] | None = None


class ContactsResource(BaseContentAPIDataclass):
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
    return "Content API / Event" if "Event" in item.__name__ else "Content API / Planning"


class BasePlanningContentAPIResource(ResourceModel):
    model_config = {
        **planning_capi_model_config,
        "model_title_generator": generate_title,
    }

    id: Annotated[str, Field(alias="_id")]

    # Override some base fields to exclude them from docs
    created: Annotated[datetime | None, Field(alias="_created"), fields.exclude_from_docs()] = None
    updated: Annotated[datetime | None, Field(alias="_updated"), fields.exclude_from_docs()] = None
    etag: Annotated[str | None, Field(alias="_etag"), fields.exclude_from_docs()] = None

    firstcreated: datetime | None = None
    versioncreated: datetime | None = None
    products: list[MatchingProduct] | None = Field(
        default=None, description="List of Superdesk publish Product IDs that matched the item"
    )
    subscribers: Annotated[list[fields.ObjectId], fields.exclude_from_docs()]

    # This is an extra field so that we can sort in the combined view of events and planning.
    # It will store the dates.start of the event.
    # Exclude from API response & docs
    planning_schedule: Annotated[
        list[PlanningSchedule],
        fields.nested_list(),
        Field(alias="_planning_schedule", default_factory=list),
        fields.exclude_from_docs(),
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
