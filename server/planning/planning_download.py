# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Planning Download module"""
import io
import logging
import superdesk
from superdesk.core.types import Response
from superdesk.core.web import EndpointGroup
from werkzeug.utils import secure_filename
from superdesk.flask import send_file, request, make_response
from superdesk.utc import utcnow
from .planning_article_export import get_items, export_events_to_text
import json


logger = logging.getLogger(__name__)

planning_download_endpoint: EndpointGroup = EndpointGroup("planning_download", __name__)


@planning_download_endpoint.endpoint(
    "/planning_download/events",
    methods=["POST", "OPTIONS"],
)
async def planning_download_file() -> Response:
    if request.method == "OPTIONS":
        # return headers to avoid CORS problems
        response = await make_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "*")
        response.headers.add("Access-Control-Allow-Methods", "POST")
        return response

    raw_data = await request.get_data()
    decoded_data = raw_data.decode("utf-8")
    items = await get_items(json.loads(decoded_data), "events")
    template = await superdesk.get_resource_service("planning_export_templates").get_download_template(
        request.args.get("template"), request.args.get("type", "event")
    )
    if not template:
        await request.abort(400, "Template not available")

    exported_text = await export_events_to_text(items, template=template, tz_offset=request.args.get("tz"))
    if exported_text:
        try:
            temp_file = io.BytesIO()
            attachment_filename = "%s-events.txt" % utcnow().strftime("%Y%m%d%H%M%S")
            temp_file.write(exported_text)
            temp_file.seek(0)
            mimetype = "text/plain"
            attachment_filename = secure_filename(attachment_filename)

            response = await send_file(
                temp_file,
                mimetype=mimetype,
                attachment_filename=attachment_filename,
                as_attachment=True,
            )
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Expose-Headers", "*")
            return response

        except Exception:
            await request.abort(404, "Error exporting data to file")
    else:
        await request.abort(400, "Exported data is empty")
