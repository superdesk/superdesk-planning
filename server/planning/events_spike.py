# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .events import EventsResource
from .common import ITEM_EXPIRY, ITEM_STATE, ITEM_SPIKED, ITEM_ACTIVE, set_item_expiry
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.auth import get_user
from superdesk import config, get_resource_service


class EventsSpikeResource(EventsResource):
    url = 'events/spike'
    resource_title = endpoint_name = 'events_spike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_spike'}


class EventsSpikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[ITEM_STATE] = ITEM_SPIKED
        set_item_expiry(updates)

        item = self.backend.update(self.datasource, id, updates, original)

        push_notification('events:spiked', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item

    def on_updated(self, updates, original):
        planning_service = get_resource_service('planning')
        spike_service = get_resource_service('planning_spike')

        for planning in list(planning_service.find(where={'event_item': original[config.ID_FIELD]})):
            spike_service.patch(planning[config.ID_FIELD], {})


class EventsUnspikeResource(EventsResource):
    url = 'events/unspike'
    resource_title = endpoint_name = 'events_unspike'

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_unspike'}


class EventsUnspikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[ITEM_STATE] = ITEM_ACTIVE
        updates[ITEM_EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('events:unspiked', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item
