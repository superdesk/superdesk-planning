# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.publish.formatters import Formatter
import superdesk
import json
from superdesk.utils import json_serialize_datetime_objectId
from copy import deepcopy
from superdesk import get_resource_service


class JsonEventFormatter(Formatter):
    """
    Simple json output formatter a sample output formatter for events
    """

    remove_fields = {'lock_time', 'lock_action', 'lock_session', 'lock_user', '_etag', '_planning_schedule',
                     'internal_note', 'expiry', 'original_creator'}

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
        output_item = deepcopy(item)
        output_item['event_contact_info'] = self._expand_contact_info(item)
        for f in self.remove_fields:
            output_item.pop(f, None)
        return [(pub_seq_num, json.dumps(output_item, default=json_serialize_datetime_objectId))]

    def _expand_contact_info(self, item):
        """
        Given an item it will scan any event contacts, look them up and return the expanded values

        :param item:
        :return: Array of expanded contacts
        """
        remove_contact_fields = {'_etag', '_type'}
        expanded = []
        for contact in item.get('event_contact_info', []):
            contact_details = get_resource_service('contacts').find_one(req=None, _id=contact)
            if contact_details:
                for f in remove_contact_fields:
                    contact_details.pop(f, None)
                # Remove any none public contact details
                contact_details['contact_phone'] = [p for p in contact_details.get('contact_phone', []) if
                                                    p.get('public')]
                contact_details['mobile'] = [p for p in contact_details.get('mobile', []) if p.get('public')]
                if contact_details.get('public', False) and contact_details.get('is_active', False):
                    expanded.append(contact_details)
        return expanded
