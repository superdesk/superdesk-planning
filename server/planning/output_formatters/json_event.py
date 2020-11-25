# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import json
import superdesk

from copy import deepcopy
from flask import current_app as app
from superdesk.publish.formatters import Formatter
from superdesk.utils import json_serialize_datetime_objectId
from .utils import expand_contact_info


class JsonEventFormatter(Formatter):
    """
    Simple json output formatter a sample output formatter for events
    """

    remove_fields = {'lock_time', 'lock_action', 'lock_session', 'lock_user', '_etag', '_planning_schedule',
                     'expiry', 'original_creator', '_reschedule_from_schedule', '_current_version'}

    def __init__(self):
        """
        Set format type and no export or preview
        """
        self.format_type = 'json_event'
        self.can_preview = False
        self.can_export = False

    def can_format(self, format_type, article):
        return format_type == self.format_type and article.get('type') == 'event'

    def format(self, item, subscriber, codes=None):
        pub_seq_num = superdesk.get_resource_service('subscribers').generate_sequence_number(subscriber)
        output_item = self._format_item(item)
        return [(pub_seq_num, json.dumps(output_item, default=json_serialize_datetime_objectId))]

    def _format_item(self, item):
        """Format the item to json event"""
        output_item = deepcopy(item)
        output_item['event_contact_info'] = expand_contact_info(item.get('event_contact_info', []))
        if item.get('files'):
            try:
                output_item['files'] = self._publish_files(item)
            except NotImplementedError:
                #  Current http_push transmitters only support media publish
                pass

        for f in self.remove_fields:
            output_item.pop(f, None)
        return output_item

    def _publish_files(self, item):
        def publish_file(file_id):
            event_file = superdesk.get_resource_service('events_files').find_one(req=None, _id=file_id)
            media = app.media.get(event_file['media'], resource='events_files')
            self._publish_media(media)
            return {
                'media': str(event_file['media']),
                'name': media.name,
                'length': media.length,
                'mimetype': media.content_type,
            }

        return [publish_file(file_id) for file_id in item['files']]
