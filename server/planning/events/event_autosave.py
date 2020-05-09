# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning - Planning Autosaves"""

from superdesk import Resource
from .events_schema import events_schema
from superdesk.metadata.utils import item_url


class EventAutosaveResource(Resource):
    url = 'event_autosave'
    item_url = item_url

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PUT', 'PATCH', 'DELETE']

    schema = events_schema
    datasource = {
        'source': 'event_autosave',
    }

    privileges = {
        'POST': 'planning_event_management',
        'PUT': 'planning_event_management',
        'PATCH': 'planning_event_management',
        'DELETE': 'planning_event_management'
    }

    mongo_indexes = {
        'event_autosave_user': ([('lock_user', 1)], {'background': True}),
        'event_autosave_session': ([('lock_session', 1)], {'background': True})
    }

    merge_nested_documents = True
