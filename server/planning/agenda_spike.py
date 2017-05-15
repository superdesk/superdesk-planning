# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from flask import current_app as app
from datetime import timedelta
from .agenda import AgendaResource
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.auth import get_user
from superdesk import config
from superdesk.utc import utcnow

EXPIRY = 'expiry'
AGENDA_STATE = 'state'
AGENDA_SPIKED = 'spiked'
AGENDA_ACTIVE = 'active'


class AgendaSpikeResource(AgendaResource):
    url = 'agenda/spike'
    resource_title = endpoint_name = 'agenda_spike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_agenda_spike'}


class AgendaSpikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[AGENDA_STATE] = AGENDA_SPIKED

        expiry_minutes = app.settings.get('PLANNING_EXPIRY_MINUTES', None)
        if expiry_minutes is not None:
            updates[EXPIRY] = utcnow() + timedelta(minutes=expiry_minutes)
        else:
            updates[EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('agenda:spike', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item


class AgendaUnspikeResource(AgendaResource):
    url = 'agenda/unspike'
    resource_title = endpoint_name = 'agenda_unspike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_agenda_unspike'}


class AgendaUnspikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[AGENDA_STATE] = AGENDA_ACTIVE
        updates[EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('agenda:unspike', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item
