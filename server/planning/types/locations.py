from datetime import datetime
from typing import Any, Annotated
from pydantic import Field

from planning.types.base import BasePlanningModelWithObjectId

from superdesk.utc import utcnow
from superdesk.core.resources import fields, dataclass
from superdesk.core.resources.validators import validate_data_relation_async, validate_iunique_value_async
from superdesk.core.utils import generate_guid, GUID_NEWSML


@dataclass
class Position:
    latitude: float | None = None
    longitude: float | None = None
    altitude: int | None = None
    gps_datum: str | None = None


@dataclass
class Address:
    title: str | None = None
    line: list[str] | None = None
    suburb: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    locality: str | None = None  # Aka city
    area: str | None = None
    external: dict | None = None
    boundingbox: list | None = None
    address_type: str | None = Field(alias="type", default=None)


class LocationResourceModel(BasePlanningModelWithObjectId):
    guid: Annotated[
        fields.Keyword,
        validate_iunique_value_async("locations", "guid"),
        Field(default_factory=lambda: generate_guid(type=GUID_NEWSML)),
    ]
    unique_id: Annotated[int, validate_iunique_value_async("locations", "unique_id")] | None = None
    unique_name: Annotated[fields.Keyword, validate_iunique_value_async("locations", "unique_name")] | None = None
    version: int | None = None
    ingest_id: fields.Keyword | None = None

    # Audit Information
    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)

    # Ingest Details
    ingest_provider: Annotated[fields.ObjectId, validate_data_relation_async("ingest_providers")] | None = None
    source: fields.Keyword | None = None
    original_source: fields.Keyword | None = None
    ingest_provider_sequence: fields.Keyword | None = None

    # Location Details
    # NewsML-G2 Event properties See:
    #    https://iptc.org/std/NewsML-G2/2.23/specification/XML-Schema-Doc-Core/ConceptItem.html#LinkC5
    name: str | None = None
    translations: dict[str, Any] | None = None
    location_type: str = Field(alias="type", default="Unclassified")

    # Position Details
    # NewsML-G2 poiDetails properties See IPTC-G2-Implementation_Guide 12.6.3
    # or https://iptc.org/std/NewsML-G2/2.23/specification/XML-Schema-Doc-Power/ConceptItem.html#LinkAA
    position: Position | None = None

    # Address Details
    address: Address | None = None

    # Other Location Info
    access: list[str] | None = None
    details: list[str] | None = None
    created: datetime | None = None
    ceased_to_exist: datetime | None = None
    open_hours: str | None = None
    capacity: str | None = None
    contact_info: list[str] | None = None
    is_active: bool = Field(
        default=True, description="Flag indicates if the location is active and should be shown in the UI"
    )
