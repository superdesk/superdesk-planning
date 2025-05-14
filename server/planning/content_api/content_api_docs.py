# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2025 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk.core.web import EndpointGroup
from superdesk.flask import render_template

content_api_docs_endpoints = EndpointGroup("content_api_docs", __name__)


@content_api_docs_endpoints.endpoint("/apidocs", auth=None)
async def content_api_docs():
    return await render_template("content-apidocs.html")
