from datetime import datetime
from pydantic import Field, model_validator
from typing import Any, Annotated
from typing_extensions import Self

from superdesk.core.resources import fields, Dataclass, BaseModel
from superdesk.core.resources.validators import validate_data_relation_async

from .unified import CVItem
from .unified.system import AuditInformation
from .unified.coverage import NewsCoverageStatus, PlanningExtendedProperty, NewsContentCharacteristics


class AssignmentCoverage(AuditInformation, BaseModel):
    contact: fields.Keyword | None = None
    news_coverage_status: NewsCoverageStatus = Field(default_factory=NewsCoverageStatus)
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
    service: list[CVItem] = Field(default_factory=list)
    news_content_characteristics: list[NewsContentCharacteristics] = Field(default_factory=list)
    planning_ext_property: list[PlanningExtendedProperty] = Field(default_factory=list)

    # # Metadata hints.  See IPTC-G2-Implementation_Guide 16.5.1.1
    by: list[str] = Field(default_factory=list)
    credit_line: list[str] = Field(default_factory=list)
    dateline: list[str] = Field(default_factory=list)

    description_text: fields.HTML | None = None
    genre: list[CVItem] = Field(default_factory=list)
    headline: fields.HTML = ""

    keyword: list[str] = Field(default_factory=list)
    language: fields.Keyword | None = None
    slugline: fields.Slugline | None = None
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
    multiple_content: bool = Field(
        default=False,
        description="If enabled, will allow multiple content items to be linked to this Coverage/Assignment",
    )

    @model_validator(mode="before")
    @classmethod
    def normalize_genre(cls, values: dict[str, Any] | Self) -> dict[str, Any] | Self:
        if isinstance(values, dict) and values.get("genre") is None:
            values["genre"] = []

        return values


class MatchingProduct(Dataclass):
    code: fields.ObjectId
    name: str
