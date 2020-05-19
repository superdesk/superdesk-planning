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
from werkzeug.utils import secure_filename
from superdesk.errors import SuperdeskApiError

from flask import send_file, request, make_response
from superdesk.utc import utcnow
from .planning_article_export import get_items
import json


bp = superdesk.Blueprint('planning_download', __name__)
logger = logging.getLogger(__name__)


@bp.route('/planning_download/events', methods=['POST', 'OPTIONS'])
def planning_download_file():
    if request.method == 'OPTIONS':
        # return headers to avoid CORS problems
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', '*')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    export_service = superdesk.get_resource_service('planning_article_export')
    items = get_items(json.loads(request.data.decode('utf-8')), 'events')
    template = superdesk.get_resource_service('planning_export_templates').get_download_template(
        request.args.get('template'), request.args.get('type', 'event'))
    if not template:
        raise superdesk.errors.SuperdeskApiError.badRequestError('Template not available')

    exported_text = export_service.export_events_to_text(items, template=template, tz_offset=request.args.get('tz'))
    if exported_text:
        try:
            temp_file = io.BytesIO()
            attachment_filename = '%s-events.txt' % utcnow().strftime('%Y%m%d%H%M%S')
            temp_file.write(exported_text)
            temp_file.seek(0)
            mimetype = 'text/plain'
            attachment_filename = secure_filename(attachment_filename)

            response = send_file(temp_file, mimetype=mimetype,
                                 attachment_filename=attachment_filename, as_attachment=True)
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add('Access-Control-Expose-Headers', '*')
            return response

        except Exception:
            raise SuperdeskApiError.notFoundError('Error exporting data to file')


def init_app(app):
    endpoint_name = 'planning_download'
    superdesk.blueprint(bp, app)
    service = superdesk.Service(endpoint_name, backend=superdesk.get_backend())
    PlanningDownloadResource(endpoint_name, app=app, service=service)


class PlanningDownloadResource(superdesk.Resource):
    schema = {'file': {'type': 'file'}}
    item_methods = []
