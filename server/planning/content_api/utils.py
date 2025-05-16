# -- coding: utf-8; --
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import json
from typing import Set
from pydantic import BaseModel
from superdesk.core.types import SearchRequest, SearchArgs


class PlanningCAPIParams(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
    include_fields: str | None = None
    exclude_fields: str | None = None
    max_results: str | None = None
    page: str | None = None
    where: str | None = None
    q: str | None = None
    default_operator: str | None = None

    def to_search_request(self) -> SearchRequest:
        where_dict = {}
        if self.where:
            try:
                where_dict = json.loads(self.where) if isinstance(self.where, str) else self.where
            except Exception:
                pass

        args: SearchArgs = {}
        if self.q:
            args["q"] = self.q
        if self.default_operator:
            args["default_operator"] = self.default_operator
        if self.include_fields:
            args["filters"] = [{"_include": self.include_fields.split(",")}]
        if self.exclude_fields:
            args.setdefault("filters", []).append({"_exclude": self.exclude_fields.split(",")})
        if self.start_date:
            args.setdefault("filters", []).append({"start_date": self.start_date})
        if self.end_date:
            args.setdefault("filters", []).append({"end_date": self.end_date})

        return SearchRequest(
            args=args,
            where=where_dict,
            page=int(self.page) if self.page else 1,
            max_results=int(self.max_results) if self.max_results else 25,
        )


ALLOWED_PARAMS: Set[str] = {
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
