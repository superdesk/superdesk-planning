from superdesk.core.resources import fields, Dataclass
from planning.types import EventResourceModel
from pydantic import Field
from typing import Annotated
from .common import MatchingProduct
from superdesk.core.resources.validators import validate_data_relation_async


class ItemFile(Dataclass):
    media: fields.Keyword
    name: fields.TextWithKeyword
    length: int
    mime_type: fields.Keyword


class ContactPhoneNumber(Dataclass):
    number: str
    usage: str
    public: bool


class ContactLocationEntity(Dataclass):
    name: str
    qcode: fields.Keyword
    translations: dict[str, str]


class ContactsResource(Dataclass):
    is_active: bool = True
    public: bool = True
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


class ContentAPIEventResource(EventResourceModel):
    products: list[MatchingProduct] | None = None
    event_contact_info: list[ContactsResource] = Field(default_factory=list)
    files: list[ItemFile] = Field(default_factory=list)
    subscribers: Annotated[list[fields.ObjectId], validate_data_relation_async("subscribers")]
