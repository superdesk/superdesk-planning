# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.services import Service
from superdesk.resource import Resource
from eve.utils import config
import logging

logger = logging.getLogger(__name__)


class PublishedVersionsService(Service):
    pass


class PublishedVersionsResource(Resource):
    """

    Resource for storing the versions of planning and events as published

    """

    schema = {
        config.ID_FIELD: {
            'type': 'string',
            'unique': True
        },
        # Id of the item
        'item_id': {
            'type': 'string'
        },
        # The version of the item stored
        'version': {
            'type': 'integer'
        },
        # Indicates if the item is a version of a planning item or an event
        'type': {
            'type': 'string'
        },
        # The item as published
        'published_item': {
            'type': 'dict'
        }
    }

    item_methods = ['GET']
    resource_methods = ['GET']
    mongo_indexes = {'planning_version_index': [('item_id', 1), ('version', 1)]}
