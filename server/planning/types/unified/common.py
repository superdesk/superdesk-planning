from typing import Annotated

from pydantic import Field

from superdesk.core.resources import Dataclass, fields


SubjectItemTranslations = Annotated[
    dict[str, dict[str, str]],
    Field(
        description="Name translations for this subject",
        examples=[{"name": {"en": "example", "fr": "exemple"}}],
        json_schema_extra={
            "elastic_mapping": {
                "type": "object",
                "dynamic": False,
                "properties": {"name": {"type": "object", "dynamic": True}},
            }
        },
    ),
]


class Subject(Dataclass):
    qcode: fields.Keyword = Field(description="Qcode of the subject")
    name: fields.KeywordWithHTML = Field(description="Name of the subject")
    scheme: fields.Keyword | None = Field(description="Scheme of the subject (for custom vocabularies)", default=None)
    translations: SubjectItemTranslations | None = Field(default=None)
    parent: fields.Keyword | None = Field(description="ID of the parent subject item, if any", default=None)


CVItemTranslations = Annotated[
    dict[str, dict[str, str]],
    Field(
        description="Translations for this vocabulary item",
        examples=[{"name": {"en": "example", "fr": "exemple"}}],
        json_schema_extra={"type": "object", "enabled": False},
    ),
]


class CVItem(Dataclass):
    qcode: fields.Keyword = Field(description="Qcode of the item")
    name: fields.Keyword = Field(description="Name of the item")
    translations: CVItemTranslations | None = Field(default=None)


class LocationAddress(Dataclass):
    boundingbox: list[str] | None = Field(description="Bounding box of the address", default=None)
    city: fields.Keyword | None = Field(description="City of the address", default=None)
    state: fields.Keyword | None = Field(description="State of the address", default=None)
    country: fields.Keyword | None = Field(description="Country of the address", default=None)
    line: list[str] | None = Field(description="Line of the address", default=None)
    locality: fields.Keyword | None = Field(description="Locality of the address", default=None)
    title: str | None = Field(description="Title of the address", default=None)
    type: fields.Keyword | None = Field(description="Type of the address", default=None)
    extra: dict | None = Field(description="Extra details of the address", default=None)


class ItemLocation(Dataclass):
    name: fields.TextWithKeyword = Field(description="Name of the location")
    qcode: fields.Keyword | None = Field(description="Qcode of the location", default=None)
    address: Annotated[LocationAddress | None, fields.dynamic_mapping(True)] = Field(
        description="Address of the location", default=None
    )
    formatted_address: str | None = Field(description="Formatted address of the location", default=None)
    geo: str | None = Field(description="Geo of the location", default=None)
    location: fields.Geopoint | None = Field(description="Geographic location", default=None)
    extra: dict | None = Field(description="Extra details of the location", default=None)
    details: str | None = Field(description="Details of the location", default=None)
    translations: Annotated[dict | None, fields.mapping_disabled("object")] = Field(
        description="Translations of the location details",
        default=None,
    )
