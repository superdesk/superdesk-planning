# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any, Dict, List, Optional
from pydantic import Field, validator, root_validator
from superdesk.core.resources import ModelWithVersions
from planning.types import EventResourceModel
from planning.output_formatters.utils import expand_contact_info, get_matching_products
from planning.output_formatters.json_event import JsonEventFormatter
from typing import Any


class ContentAPIEventResourceModel(EventResourceModel, ModelWithVersions):
    event_contact_info: List[Dict[str, Any]] = Field(default_factory=list)
    products: List[Dict[str, str]] = Field(default_factory=list)
    files: Optional[List[Dict[str, Any]]] = Field(default_factory=list)

    # Validators to expand fields
    @validator("event_contact_info", pre=True)
    def expand_contacts(cls, v):
        """Expand contact info using the formatter's utility function"""
        return expand_contact_info(v) if v else []

    @validator("products", pre=True)
    def expand_products(cls, v, values):
        """Expand products using the formatter's utility function"""
        if isinstance(v, list) and all(isinstance(i, dict) for i in v):
            return v  # Already expanded
        return get_matching_products(values) if values else []

    @root_validator(pre=True)
    def expand_fields(cls, values):
        """Root validator to handle field expansions"""
        formatter = JsonEventFormatter()

        if "event_contact_info" in values:
            values["event_contact_info"] = expand_contact_info(values.get("event_contact_info", []))

        if "products" not in values:
            values["products"] = get_matching_products(values)

        if "files" in values and values["files"]:
            try:
                values["files"] = formatter._get_files_for_publish(values)
            except NotImplementedError:
                values.pop("files", None)

        for field in formatter.remove_fields:
            values.pop(field, None)

        return values
