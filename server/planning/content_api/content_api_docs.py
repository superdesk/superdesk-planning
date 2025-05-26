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
from quart import send_file, abort
from superdesk.core.web import EndpointGroup
from superdesk.flask import render_template

content_api_docs_endpoints = EndpointGroup("content_api_docs", __name__)


@content_api_docs_endpoints.endpoint("/apidocs", auth=False)
async def content_api_docs():
    return await render_template("content_apidocs.html")


@content_api_docs_endpoints.endpoint("/planning-static/<path:filename>", auth=False)
async def planning_static_file(filename):
    # Determine base static directory
    base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
    file_path = os.path.abspath(os.path.join(base_path, filename))

    if not file_path.startswith(base_path):
        return abort(403)

    if not os.path.exists(file_path):
        return abort(404)

    return await send_file(file_path)
