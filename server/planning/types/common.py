from datetime import date, datetime
from pydantic import Field, TypeAdapter
from typing import Any, Annotated, Literal, TypeAlias

from superdesk.utc import utcnow
from superdesk.core.resources import dataclass, fields, Dataclass
from superdesk.core.elastic.mapping import json_schema_to_elastic_mapping
from superdesk.core.resources.validators import validate_data_relation_async

from .enums import LinkType


class NameAnalyzedField(str, fields.CustomStringField):
    elastic_mapping = {
        "type": "keyword",
        "fields": {
            "analyzed": {"type": "text", "analyzer": "html_field_analyzer"},
        },
    }


class SlugLineField(str, fields.CustomStringField):
    elastic_mapping = {
        "type": "text",
        "fielddata": True,
        "fields": {
            "phrase": {
                "type": "text",
                "analyzer": "phrase_prefix_analyzer",
                "fielddata": True,
            },
            "keyword": {
                "type": "keyword",
            },
            "text": {"type": "text", "analyzer": "html_field_analyzer"},
        },
    }


TimeToBeConfirmedType: TypeAlias = Annotated[bool, Field(alias="_time_to_be_confirmed")]

Translations: TypeAlias = Annotated[
    dict[str, Any],
    fields.elastic_mapping(
        {
            "type": "object",
            "dynamic": False,
            "properties": {
                "name": {
                    "type": "object",
                    "dynamic": True,
                }
            },
        }
    ),
]


@dataclass
class RelationshipItem:
    broader: str | None = None
    narrower: str | None = None
    related: str | None = None


class PlanningSchedule(Dataclass):
    scheduled: datetime | None = None
    coverage_id: fields.Keyword | None = None


@dataclass
class UpdatesSchedule:
    scheduled: date | None = None
    scheduled_update_id: fields.Keyword | None = None


@dataclass
class CoverageStatus:
    qcode: str
    name: str


@dataclass
class KeywordQCodeName:
    qcode: fields.Keyword
    name: fields.Keyword


@dataclass
class KeywordNameValue:
    name: fields.Keyword
    value: fields.Keyword


@dataclass
class ExtProperty(KeywordQCodeName):
    value: fields.Keyword


@dataclass
class Subject:
    qcode: fields.Keyword
    name: NameAnalyzedField
    scheme: fields.Keyword
    translations: Translations | None = None


SubjectListType = Annotated[list[Subject], fields.nested_list(include_in_parent=True)]


@dataclass
class Place:
    scheme: fields.Keyword | None = None
    qcode: fields.Keyword | None = None
    code: fields.Keyword | None = None
    name: fields.Keyword | None = None
    locality: fields.Keyword | None = None
    state: fields.Keyword | None = None
    country: fields.Keyword | None = None
    world_region: fields.Keyword | None = None
    locality_code: fields.Keyword | None = None
    state_code: fields.Keyword | None = None
    country_code: fields.Keyword | None = None
    world_region_code: fields.Keyword | None = None
    feature_class: fields.Keyword | None = None
    location: fields.Geopoint | None = None
    rel: fields.Keyword | None = None


@dataclass
class RelatedEvent:
    id: Annotated[fields.Keyword, validate_data_relation_async("events")] = Field(alias="_id")
    recurrence_id: fields.Keyword | None = None
    link_type: LinkType | None = None


@dataclass
class CoverageInternalPlanning:
    ednote: fields.HTML | None = None
    g2_content_type: fields.Keyword | None = None
    coverage_provider: fields.Keyword | None = None
    contact_info: Annotated[fields.Keyword | None, validate_data_relation_async("contacts")] = None
    item_class: fields.Keyword | None = None
    item_count: fields.Keyword | None = None
    scheduled: datetime | None = None
    files: Annotated[list[fields.ObjectId], validate_data_relation_async("planning_fields")] = Field(
        default_factory=list
    )
    xmp_file: Annotated[fields.ObjectId | None, validate_data_relation_async("planning_files")] = None
    service: list[KeywordQCodeName] = Field(default_factory=list)
    news_content_characteristics: list[KeywordNameValue] = Field(default_factory=list)
    planning_ext_property: list[ExtProperty] = Field(default_factory=list)

    # # Metadata hints.  See IPTC-G2-Implementation_Guide 16.5.1.1
    by: list[str] = Field(default_factory=list)
    credit_line: list[str] = Field(default_factory=list)
    dateline: list[str] = Field(default_factory=list)

    description_text: fields.HTML | None = None
    genre: list[KeywordQCodeName] = Field(default_factory=list)
    headline: fields.HTML | None = None

    keyword: list[str] = Field(default_factory=list)
    language: fields.Keyword | None = None
    slugling: SlugLineField | None = None
    subject: Annotated[
        list[dict[str, Any]],
        fields.elastic_mapping(
            {
                "type": "nested",
                "include_in_parent": True,
                "dynamic": False,
                "properties": {
                    "qcode": {"type": "keyword"},
                    "name": {"type": "keyword"},
                    "scheme": {"type": "keyword"},
                },
            }
        ),
    ] = Field(default_factory=list)

    internal_note: fields.HTML | None = None
    workflow_status_reason: str | None = None
    priority: int | None = None


@dataclass
class NewsCoverageStatus:
    # allows unknown
    qcode: str | None = None
    name: str | None = None
    label: str | None = None


@dataclass
class CoverageAssignedTo:
    assignment_id: fields.Keyword | None = None
    state: fields.Keyword | None = None
    contact: fields.Keyword | None = None

    @classmethod
    def to_elastic_properties(cls) -> dict[Literal["properties"], Any]:
        """Generates the elastic mapping properties for the current dataclass"""

        json_schema = TypeAdapter(cls).json_schema()
        return json_schema_to_elastic_mapping(json_schema)


@dataclass
class CoverageFlags:
    # allows unknown
    no_content_linking: bool = False


@dataclass
class ScheduledUpdatePlanning:
    internal_note: fields.HTML | None = None
    contact_info: Annotated[fields.ObjectId | None, validate_data_relation_async("contacts")] = None
    scheduled: datetime | None = None
    genre: list[KeywordQCodeName] = Field(default_factory=list)
    workflow_status_reason: str | None = None


@dataclass
class ScheduledUpdate:
    scheduled_update_id: fields.Keyword | None = None
    coverage_id: fields.Keyword | None = None
    workflow_status: fields.Keyword | None = None
    previous_status: fields.Keyword | None = None

    assigned_to: CoverageAssignedTo | None = None
    news_coverage_status: NewsCoverageStatus = Field(default_factory=NewsCoverageStatus)
    planning: ScheduledUpdatePlanning = Field(default_factory=ScheduledUpdatePlanning)


@dataclass
class PlanningCoverage:
    # Identifiers
    coverage_id: fields.Keyword | None = None
    original_coverage_id: fields.Keyword | None = None
    guid: fields.Keyword | None = None

    # Audit Information
    original_creator: Annotated[fields.ObjectId, validate_data_relation_async("users")] = None
    version_creator: Annotated[fields.ObjectId, validate_data_relation_async("users")] = None
    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)

    # News Coverage Details
    # See IPTC-G2-Implementation_Guide 16.4
    planning: CoverageInternalPlanning = Field(default_factory=CoverageInternalPlanning)
    news_coverage_status: NewsCoverageStatus = Field(default_factory=NewsCoverageStatus)

    workflow_status: str | None = None
    previous_status: str | None = None
    assigned_to: CoverageAssignedTo = Field(default_factory=CoverageAssignedTo)
    flags: CoverageFlags = Field(default_factory=CoverageFlags)
    time_to_be_confirmed: TimeToBeConfirmedType = False
    scheduled_updates: list[ScheduledUpdate] = Field(default_factory=list)


class LockFieldsMixin:
    lock_user: Annotated[fields.ObjectId, validate_data_relation_async("users")] | None = None
    lock_time: datetime | None = None
    lock_session: Annotated[fields.ObjectId, validate_data_relation_async("users")] | None = None
    lock_action: fields.Keyword | None = None
