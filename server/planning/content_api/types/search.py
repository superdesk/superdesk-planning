# -- coding: utf-8; --
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Literal
import functools

from pydantic import Field, field_validator, model_validator, computed_field

from superdesk.core.types import SearchRequest, SearchArgs, Request, DefaultOperator
from superdesk.core import get_config
from superdesk.core.resources import BaseModel, fields

from planning.types import SearchItemType, SearchDateRange
from planning.search.queries.elastic import ElasticQuery
from planning.search.queries.events import search_dates as search_event_dates
from planning.search.queries.planning import search_dates as search_planning_dates

from .events import ContentAPIEventResource
from .planning import ContentAPIPlanningResource


class PlanningCAPIParams(BaseModel):
    @computed_field  # type: ignore[prop-decorator]
    @property
    def item_type(self) -> SearchItemType:
        raise NotImplementedError

    start_date: fields.DateWithOptionalTime | None = Field(default=None, description="Start date for filtering")
    end_date: fields.DateWithOptionalTime | None = Field(default=None, description="End date for filtering")
    date_filter: SearchDateRange | None = Field(default=None, description="Filter using pre-defined date ranges")
    time_zone: str | None = Field(
        default=None,
        description="Time zone used for date math",
        examples=[
            "+01:00",
            "-08:00",
            "Europe/Prague",
        ],
    )
    start_of_week: int | None = Field(
        default=None,
        description="Change start day of week for filtering, 0=Sunday, 1=Monday ... 6=Saturday (defaults to system config)",
        ge=0,
        le=6,
    )

    include_fields: set[str] = Field(
        default_factory=set, description="Fields to include in the response", examples=["name,subject,extra"]
    )
    exclude_fields: set[str] = Field(
        default_factory=set, description="Fields to exclude from the response", examples=["products,location"]
    )
    max_results: int = Field(default=25, description="Maximum number of results to return")
    page: int = Field(default=1, description="Page number for pagination")
    where: str | None = Field(
        default=None,
        description="Filter criteria (internally uses Elasticsearch 'term' queries)",
        examples=["slugline==test-event-1", '{"source":"external_supplier"}'],
    )
    q: str | None = Field(default=None, description="Search query")
    default_operator: DefaultOperator = Field(default="AND", description="Default operator for search queries")

    @field_validator("include_fields", "exclude_fields", mode="before")
    @classmethod
    def parse_projection_fields(cls, value: str | set[str]) -> set[str]:
        if value is None or not value:
            return set()
        elif isinstance(value, str):
            value = set(value.split(","))

        strip_items = functools.partial(map, lambda s: s.strip())  # type: ignore
        remove_empty = functools.partial(filter, None)  # type: ignore

        return set(remove_empty(strip_items(value)))

    @model_validator(mode="after")
    def validate_params(self) -> "PlanningCAPIParams":
        if self.exclude_fields and self.include_fields:
            raise ValueError("Cannot both include and exclude content fields at the same time.")

        # Validate ``include_fields`` and ``exclude_fields`` against supported fields
        if self.include_fields or self.exclude_fields:
            if self.item_type == SearchItemType.EVENT:
                supported_fields = ContentAPIEventResource.get_field_names()
            elif self.item_type == SearchItemType.PLANNING:
                supported_fields = ContentAPIPlanningResource.get_field_names()
            else:
                # This should never happen
                raise ValueError(f"Unsupported item type: {self.item_type}")

            err_msg = "Unknown content field to include ({})."
            for field in self.include_fields:
                if field not in supported_fields:
                    raise ValueError(err_msg.format(field))

            err_msg = "Unknown content field to exclude ({})."
            for field in self.exclude_fields:
                if field not in supported_fields:
                    raise ValueError(err_msg.format(field))

        return self

    def to_search_request(self, request: Request) -> SearchRequest:
        args: SearchArgs = {}
        if self.q:
            args["q"] = self.q
        if self.default_operator:
            args["default_operator"] = self.default_operator

        must: list[dict] = self._get_date_filter()

        token_id = request.storage.request.get("user")
        must.append({"term": {"subscribers": token_id}})
        args["source"] = {"query": {"bool": {"must": must}}}

        projection: set[str] | dict[str, Literal[False]] | None = None
        if self.include_fields:
            projection = self.include_fields
        elif self.exclude_fields:
            projection = {field: False for field in self.exclude_fields}

        return SearchRequest(
            args=args,
            where=self.where,
            page=int(self.page) if self.page else 1,
            max_results=int(self.max_results) if self.max_results else 25,
            projection=projection,
        )

    def _get_date_filter(self) -> list[dict]:
        if self.start_of_week is None:
            self.start_of_week = get_config(int, "START_OF_WEEK", 0)

        date_query = ElasticQuery()
        params = self.to_dict()
        if not any((self.start_date, self.end_date, self.date_filter)):
            # If no date filters were supplied, tell underlying date utils to not apply default
            # date filter
            params["exclude_dates"] = True

        if self.item_type == SearchItemType.EVENT:
            search_event_dates(params, date_query)
        else:
            search_planning_dates(params, date_query)

        return date_query.filter


ALLOWED_PARAMS: set[str] = {
    "start_date",
    "end_date",
    "include_fields",
    "exclude_fields",
    "max_results",
    "page",
    "where",
    "q",
    "default_operator",
}


MONGO_PREFIX = "CONTENTAPI_MONGO"
