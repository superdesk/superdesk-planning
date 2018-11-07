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


class JsonPlanningFeaturedFormatter(Formatter):
    """
    Simple json output formatter a sample output formatter for planning items
    """

    def __init__(self):
        """
        Set format type and no export or preview
        """
        self.format_type = 'json_planning_featured'
        self.can_preview = False
        self.can_export = False

    # fields to be removed from the planning item
    remove_fields = ('last_posted_time', 'last_posted_by', '_etag', 'version_creator', 'original_creator', 'files')

    def can_format(self, format_type, article):
        return format_type == self.format_type and article.get('type') == 'planning_featured'

    def format(self, item, subscriber, codes=None):
        pub_seq_num = superdesk.get_resource_service('subscribers').generate_sequence_number(subscriber)
        output_item = deepcopy(item)
        for f in self.remove_fields:
            output_item.pop(f, None)

        return [(pub_seq_num, json.dumps(output_item, default=json_serialize_datetime_objectId))]
