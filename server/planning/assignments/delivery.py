# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Delivery internal collection to stores delivery references"""

import superdesk
import logging

logger = logging.getLogger(__name__)

delivery_schema = {
    # planning item id
    'planning_id': {
        'type': 'string'
    },

    # coverage item id
    'coverage_id': {
        'type': 'string'
    },

    # assignment item id
    'assignment_id': {
        'type': 'objectid'
    },

    # item_id
    'item_id': {
        'type': 'string'
    },

    'item_state': {
        'type': 'string'
    },

    'sequence_no': {
        'type': 'number',
        'default': 0
    },

    'publish_time': {
        'type': 'datetime'
    },

    'scheduled_update_id': {
        'type': 'string'
    },
}


class DeliveryResource(superdesk.Resource):
    url = 'delivery'
    endpoint_name = url
    schema = delivery_schema

    internal_resource = True
    resource_methods = []
    item_methods = []
    mongo_indexes = {
        'planning_id_1': ([('planning_id', 1)], {'background': True}),
        'assignment_id_1': ([('assignment_id', 1)], {'background': True}),
        'coverage_id_1': ([('coverage_id', 1)], {'background': True}),
        'item_id_1': ([('item_id', 1)], {'background': True})
    }
    query_objectid_as_string = True
