# -- coding: utf-8; --
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Set
from pydantic import BaseModel


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

DEFAULT_SORT = [("versioncreated", -1)]
