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
from werkzeug.datastructures import MultiDict
from eve.utils import ParsedRequest
from content_api.errors import UnexpectedParameterError


def check_for_unknown_params(req: ParsedRequest, whitelist: Set[str], allow_filtering: bool = True) -> None:
    """Validate request parameters against allowed whitelist."""
    if not req.args:
        return

    for param in req.args:
        if param not in whitelist and not (allow_filtering and param.startswith("filter")):
            raise UnexpectedParameterError(f"Unexpected parameter: {param}")


def set_fields_filter(req: ParsedRequest) -> None:
    """Set fields projection based on include/exclude parameters."""
    if req.args:
        if "include_fields" in req.args:
            req.projection = json.loads(req.args["include_fields"])
        if "exclude_fields" in req.args:
            if not hasattr(req, "projection"):
                req.projection = {}
            for field in json.loads(req.args["exclude_fields"]):
                req.projection[field] = 0


def set_default_sort(req: ParsedRequest, default_sort: list) -> None:
    """Apply default sorting if not specified."""
    if not req.sort:
        req.sort = json.dumps(default_sort)


def set_search_field(args: MultiDict, orig_args: MultiDict) -> None:
    """Configure search parameters."""
    if "q" in orig_args:
        args["q"] = orig_args["q"]
    if "default_operator" in orig_args:
        args["default_operator"] = orig_args["default_operator"]
