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
from superdesk import get_resource_service
from planning.types import PlanningResourceModel
from planning.output_formatters.utils import get_matching_products
from planning.output_formatters.json_planning import JsonPlanningFormatter


class ContentAPIPlanningResourceModel(PlanningResourceModel, ModelWithVersions):
    agendas: List[Dict[str, Any]] = Field(default_factory=list)
    products: List[Dict[str, str]] = Field(default_factory=list)
    events: List[Dict[str, Any]] = Field(default_factory=list)
    coverages: List[Dict[str, Any]] = Field(default_factory=list)
    event_item: Optional[str] = Field(None)

    # Validators to expand fields
    @validator("agendas", pre=True)
    def expand_agendas(cls, v, values):
        """Expand agenda info using the formatter's method"""
        if isinstance(v, list) and all(isinstance(i, dict) for i in v):
            return v  # Already expanded
        formatter = JsonPlanningFormatter()
        return formatter._expand_agendas(values) if values else []

    @validator("coverages", pre=True)
    def expand_coverages(cls, v, values):
        """Expand coverage information"""
        if not isinstance(v, list):
            return []

        formatter = JsonPlanningFormatter()
        expanded_coverages = []

        for coverage in v:
            coverage = coverage.copy()
            formatter._expand_coverage_contacts(coverage)

            deliveries, workflow_state = formatter._expand_delivery(coverage)
            if workflow_state:
                coverage["workflow_status"] = formatter._get_coverage_workflow_state(workflow_state)

            coverage["deliveries"] = deliveries

            # Remove fields as done in formatter
            for f in formatter.remove_coverage_fields:
                coverage.pop(f, None)

            for key in formatter.remove_coverage_planning_fields:
                if key in (coverage.get("planning") or {}):
                    coverage["planning"].pop(key, None)

            expanded_coverages.append(coverage)

        return expanded_coverages

    @root_validator(pre=True)
    def expand_fields(cls, values):
        """Root validator to handle field expansions"""
        formatter = JsonPlanningFormatter()

        # Apply the same transformations as the formatter
        if "agendas" in values:
            values["agendas"] = formatter._expand_agendas(values)

        if "products" not in values:
            values["products"] = get_matching_products(values)

        # Handle related events
        if "events" not in values:
            # TODO: This should be async when events service is async
            events = []
            for event_ref in formatter.get_related_event_links_for_planning(values):
                event = get_resource_service("events").find_one(req=None, _id=event_ref["_id"])
                events.append(
                    {
                        "rel": event_ref["link_type"],
                        "uri": f"urn:event:{event_ref['_id']}",
                        "literal": event_ref["_id"],
                        "name": event.get("name") if event else "",
                    }
                )
            values["events"] = events

        # Handle primary event
        first_primary_event_id = formatter.get_first_related_event_id_for_planning(values, "primary")
        if first_primary_event_id:
            values["event_item"] = first_primary_event_id

        # Remove fields that shouldn't be exposed
        for field in formatter.remove_fields:
            values.pop(field, None)

        return values
