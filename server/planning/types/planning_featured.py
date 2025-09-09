from datetime import datetime
from pydantic import Field, model_validator
from typing import Annotated, Union

from eve_elastic.elastic import parse_date

from superdesk.utc import utcnow, utc_to_local
from superdesk.core import get_config
from superdesk.core.resources import fields
from superdesk.core.resources.validators import validate_data_relation_async

from .base import BasePlanningModel

ID_DATE_FORMAT = "%Y%m%d"


class PlanningFeaturedResourceModel(BasePlanningModel):
    id: Annotated[str, Field(alias="_id")]
    date: datetime = Field(default_factory=utcnow)
    items: list[str] = Field(default_factory=list)
    tz: str | None = None
    posted: bool = False
    last_posted_time: datetime | None = None
    last_posted_by: Annotated[fields.ObjectId | None, validate_data_relation_async("users")] = None
    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)
    item_type: str = Field(
        alias="type", default="planning_featured", description="Item type used by superdesk publishing"
    )

    @model_validator(mode="before")
    @classmethod
    def set_id(
        cls, values: Union[dict, "PlanningFeaturedResourceModel"]
    ) -> Union[dict, "PlanningFeaturedResourceModel"]:
        values.setdefault("tz", get_config(str, "DEFAULT_TIMEZONE"))

        if not values.get("date"):
            values["date"] = utcnow()
        elif isinstance(values["date"], str):
            values["date"] = parse_date(values["date"])

        date = utc_to_local(values["tz"], values["date"])
        values["_id"] = date.strftime(ID_DATE_FORMAT)
        return values
