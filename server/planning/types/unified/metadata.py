from typing import Annotated
from datetime import datetime

from pydantic import Field

from superdesk.core.resources import Dataclass, fields
from superdesk.core.resources.validators import validate_data_relation_async

from .common import CVItem, Subject, ItemLocation


class Place(Dataclass):
    scheme: fields.Keyword | None = Field(description="The scheme of the place", default=None)
    qcode: fields.Keyword | None = Field(description="The qcode of the place", default=None)
    code: fields.Keyword | None = Field(description="The code of the place", default=None)
    name: fields.Keyword | None = Field(description="The name of the place", default=None)
    locality: fields.Keyword | None = Field(description="The locality of the place", default=None)
    state: fields.Keyword | None = Field(description="The state of the place", default=None)
    country: fields.Keyword | None = Field(description="The country of the place", default=None)
    world_region: fields.Keyword | None = Field(description="The world region of the place", default=None)
    locality_code: fields.Keyword | None = Field(description="The locality code of the place", default=None)
    state_code: fields.Keyword | None = Field(description="The state code of the place", default=None)
    country_code: fields.Keyword | None = Field(description="The country code of the place", default=None)
    world_region_code: fields.Keyword | None = Field(description="The world region code of the place", default=None)
    feature_class: fields.Keyword | None = Field(description="The feature class of the place", default=None)
    location: fields.Geopoint | None = Field(description="The location of the place", default=None)
    rel: fields.Keyword | None = Field(description="The relationship of the place", default=None)


class ItemDescription:
    slugline: fields.Slugline | None = Field(
        description="Short editorial identifier or slugline for the item", default=None
    )
    name: str | None = Field(description="Display name or title of the item", default=None)
    definition_short: str | None = Field(description="Brief definition or summary of the item", default=None)
    definition_long: str | None = Field(description="Detailed definition or description of the item", default=None)
    abstract: fields.HTML | None = Field(description="HTML-formatted abstract or summary of the item", default=None)
    headline: fields.HTML | None = Field(description="HTML-formatted headline for the item", default=None)
    internal_note: str | None = Field(description="Internal note visible to editorial users", default=None)
    ednote: str | None = Field(description="Editorial note associated with the item", default=None)


class ItemMetadata:
    subject: Annotated[list[Subject] | None, fields.nested_list(include_in_parent=True, dynamic=False)] = Field(
        description="Item subjects", default=None
    )
    anpa_category: list[CVItem] | None = Field(description="Item ANPA categories", default=None)
    priority: int | None = Field(description="Priority of the item", default=None)
    urgency: int | None = Field(description="Urgency of the item", default=None)
    language: fields.Keyword | None = Field(description="Language of the item", default=None)
    languages: list[fields.Keyword] | None = Field(description="Languages of the item", default=None)
    calendars: list[CVItem] | None = Field(description="Calendars of the item", default=None)
    agendas: Annotated[list[fields.ObjectId] | None, validate_data_relation_async("agenda")] = Field(
        description="IDs for the agendas of the item",
        default=None,
    )
    genre: list[CVItem] | None = Field(description="List of genres of the item", default=None)
    place: Annotated[list[Place] | None, fields.elastic_mapping({"type": "object", "dynamic": False})] = Field(
        description="List of places of the item", default=None
    )
    keywords: list[fields.HTML] | None = Field(description="List of keywords of the item", default=None)


class FieldTranslation(Dataclass):
    field: fields.Keyword = Field(description="The field that this translation is for")
    language: fields.Keyword = Field(description="The language that this translation is in")
    value: fields.Slugline = Field(description="The value of the translation")


class ItemRelationships(Dataclass):
    broader: fields.Keyword | None = Field(description="Broader relationship of the item", default=None)
    narrower: fields.Keyword | None = Field(description="Narrower relationship of the item", default=None)
    related: fields.Keyword | None = Field(description="Reference to the related item", default=None)


class CompanyCode(Dataclass):
    qcode: fields.Keyword = Field(description="The qcode of the company code")
    name: fields.Keyword = Field(description="The name of the company code")
    security_exchange: fields.Keyword | None = Field(
        description="The security exchange of the company code", default=None
    )


class ItemExtraDetails:
    registration: str | None = Field(description="Registration details of the item", default=None)
    access_status: list[CVItem] | None = Field(description="Access status of the item", default=None)
    registration_details: str | None = Field(
        description="Details about the registration of the item",
        default=None,
    )
    invitation_details: str | None = Field(
        description="Details about the invitation of the item",
        default=None,
    )
    accreditation_info: str | None = Field(
        description="Details about the accreditation of the item",
        default=None,
    )
    accreditation_deadline: datetime | None = Field(
        description="Deadline for accreditation of the item",
        default=None,
    )
    reference: str | None = Field(
        description="External reference for the item, for example a court case reference number",
        default=None,
    )
    links: list[str] | None = Field(
        description="Links to external resources related to the item",
        default=None,
    )
    files: Annotated[list[fields.ObjectId] | None, validate_data_relation_async("planning_files")] = Field(
        description="IDs of the file(s) attached to the item",
        default=None,
    )
    location: Annotated[list[ItemLocation] | None, fields.dynamic_mapping(False)] = Field(
        description="List of locations related to the item",
        default=None,
    )
    translations: Annotated[list[FieldTranslation] | None, fields.nested_list()] = Field(
        description="List of translations for the item", default=None
    )

    # TODO: These doesn't seem to be used in Planning
    word_count: int | None = Field(description="The word count of the item", default=None)
    relationships: ItemRelationships | None = Field(description="Relationship for the item", default=None)
    company_codes: list[CompanyCode] | None = Field(
        description="List of company codes related to the item", default=None
    )
    item_class: fields.Keyword | None = Field(
        description="The class of the item",
        default=None,  # currently defaults to "plinat:newscoverage" for Planning items
    )


class ItemContactDetails:
    event_contact_info: Annotated[list[fields.ObjectId] | None, validate_data_relation_async("contacts")] = Field(
        description="List of contact IDs related to the item",
        default=None,
    )
    participant: list[CVItem] | None = Field(
        description="List of participants related to the item",
        default=None,
    )
    participant_requirement: list[CVItem] | None = Field(
        description="List of participant requirements related to the item",
        default=None,
    )
    organizer: list[CVItem] | None = Field(description="List of organizers for the item", default=None)
