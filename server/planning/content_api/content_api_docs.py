# -- coding: utf-8; --
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import os
from quart import abort, send_from_directory

from superdesk.core.types import DefaultOperator, Request
from superdesk.core import get_config
from superdesk.core.openapi import OpenAPISpec
from superdesk.core.web import EndpointGroup
from superdesk.flask import render_template
from superdesk.default_settings import env

from planning.types import SearchDateRange

from .views import event_endpoints, planning_endpoints
from .views.events import ContentAPIEventResponse
from .views.planning import ContentAPIPlanningResponse

content_api_docs_endpoints = EndpointGroup("content_api_docs", __name__)


@content_api_docs_endpoints.endpoint("/apidocs", auth=False)
async def content_api_docs():
    return await render_template("content_apidocs.html")


def get_capi_planning_spec() -> OpenAPISpec:
    spec = (
        OpenAPISpec(
            title="Content API",
            description="Combined API for managing Events and Planning items",
        )
        .add_server(env("CONTENTAPI_URL", "http://localhost:5400"), "Development server")
        .add_tag("Events", "Event items")
        .add_tag("Planning", "Planning items")
        .add_model(ContentAPIPlanningResponse)
        .add_model(ContentAPIEventResponse)
        .add_enum(DefaultOperator)
        .add_enum(SearchDateRange)
        .add_endpoint(event_endpoints)
        .add_endpoint(planning_endpoints)
        .remove_additional_properties_from_top_level()
    )

    # Add optional details for the ninjs3 state/end times
    # This is required as Pydantic doesn't support this spec in models
    spec.spec["components"]["schemas"]["DatesObject"]["anyOf"] = [
        {
            "oneOf": [
                {"required": "startDate", "title": "Start date & time"},
                {"required": "expectedStartDate", "title": "Start date"},
            ],
        },
        {
            "oneOf": [
                {"required": "endDate", "title": "End date & time"},
                {"required": "expectedEndDate", "title": "End date"},
            ],
        },
    ]

    if get_config(bool, "CONTENTAPI_HIDE_COVERAGE_ASSIGNEES", False):
        props = spec.spec["components"]["schemas"]["ContentAPICoverageResponse"]["properties"]
        props.pop("assigned_user", None)
        props.pop("assigned_desk", None)

    return spec


@content_api_docs_endpoints.endpoint("/api-planning-static/<path:filename>", auth=False)
async def api_planning_static_file(args, params, request: Request):
    filename = request.get_view_args("filename")
    if filename == "swagger.yaml":
        return get_capi_planning_spec().to_string("yaml")

    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))

    try:
        return await send_from_directory(base_path, filename)
    except FileNotFoundError:
        return abort(404)
