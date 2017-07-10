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
from .common import ITEM_EXPIRY, ITEM_STATE, ITEM_SPIKED, ITEM_ACTIVE, set_item_expiry,\
    PUB_STATUS_CANCELED, NOT_ANALYZED
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.auth import get_user
from superdesk import config, get_resource_service
from superdesk.utc import utcnow
from copy import deepcopy
import logging
logger = logging.getLogger(__name__)

schema = deepcopy(EventsResource.schema)
schema['spike_method'] = {
    'type': 'string',
    'allowed': ['single', 'future', 'all'],
    'mapping': NOT_ANALYZED,
    'nullable': True,
}


class EventsSpikeResource(EventsResource):
    url = 'events/spike'
    resource_title = endpoint_name = 'events_spike'

    schema = schema

    datasource = {'source': 'events'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_event_spike'}


class EventsSpikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[ITEM_STATE] = ITEM_SPIKED
        set_item_expiry(updates)
        updates['pubstatus'] = PUB_STATUS_CANCELED

        if 'spike_method' in updates:
            spike_method = updates['spike_method']
            del updates['spike_method']
        else:
            spike_method = 'single'

        item = self.backend.update(self.datasource, id, updates, original)

        push_notification('events:spiked', item=str(id), user=str(user.get(config.ID_FIELD)))

        if original.get('recurrence_id') and spike_method != 'single':
            self._spike_recurring(updates, original, spike_method)

        return item

    def on_updated(self, updates, original):
        planning_service = get_resource_service('planning')
        spike_service = get_resource_service('planning_spike')

        for planning in list(planning_service.find(where={'event_item': original[config.ID_FIELD]})):
            spike_service.patch(planning[config.ID_FIELD], {})

    def _spike_recurring(self, updates, original, spike_method):
        """Spike events in a recurring series

        Based on the spike_method provided, spikes 'future' or 'all' events in the series.
        Historic events, i.e. events that have already occurred, will not be spiked.
        """
        recurrence_id = original['recurrence_id']

        if spike_method == 'single':
            logger.info('Spike method is "single". Ignoring others')
            return

        start = utcnow()

        if spike_method == 'future':
            dates = original.get('dates')
            start = dates.get('start')

        lookup = {
            '$and': [
                {'recurrence_id': recurrence_id},
                {'_id': {'$ne': original[config.ID_FIELD]}},
                {'dates.end': {'$gt': start}}
            ]
        }

        events = list(e for e in self.get_from_mongo(None, lookup))
        for e in events:
            self.on_update(updates, e)
            self.update(e[config.ID_FIELD], {}, e)
            self.on_updated(updates, e)


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
