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
PLANNING_STATE = 'state'
PLANNING_SPIKED = 'spiked'
PLANNING_ACTIVE = 'active'


class PlanningSpikeResource(AgendaResource):
    url = 'planning/spike'
    resource_title = endpoint_name = 'planning_spike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_spike'}


class PlanningSpikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[PLANNING_STATE] = PLANNING_SPIKED

        expiry_minutes = app.settings.get('PLANNING_EXPIRY_MINUTES', None)
        if expiry_minutes is not None:
            updates[EXPIRY] = utcnow() + timedelta(minutes=expiry_minutes)
        else:
            updates[EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('planning:spike', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item


class PlanningUnspikeResource(AgendaResource):
    url = 'planning/unspike'
    resource_title = endpoint_name = 'planning_unspike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_unspike'}


class PlanningUnspikeService(BaseService):
    def update(self, id, updates, original):
        user = get_user(required=True)

        updates[PLANNING_STATE] = PLANNING_ACTIVE
        updates[EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('planning:unspike', item=str(id), user=str(user.get(config.ID_FIELD)))
        return item
