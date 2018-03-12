# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import abort
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.notification import push_notification
from apps.publish.enqueue import get_enqueue_service


from eve.utils import config
from planning.planning import PlanningResource
from planning.common import WORKFLOW_STATE, PUBLISHED_STATE, published_state, get_item_publish_state


class PlanningPublishResource(PlanningResource):
    schema = {
        'planning': Resource.rel('planning', type='string', required=True),
        'etag': {'type': 'string', 'required': True},
        'pubstatus': {
            'type': 'string',
            'required': True,
            'allowed': published_state
        },
    }

    url = 'planning/publish'
    resource_title = endpoint_name = 'planning_publish'
    resource_methods = ['POST']
    privileges = {'POST': 'planning_planning_publish'}
    item_methods = []


class PlanningPublishService(BaseService):
    def create(self, docs, **kwargs):
        ids = []
        for doc in docs:
            plan = get_resource_service('planning').find_one(
                req=None,
                _id=doc['planning'],
                _etag=doc['etag']
            )

            self.validate_item(plan)

            if not plan:
                abort(412)

            self.validate_published_state(doc['pubstatus'])
            self.publish_planning(plan, doc['pubstatus'])
            ids.append(doc['planning'])
        return ids

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'planning:published',
                item=str(doc.get('planning')),
                etag=doc.get('_etag'),
                pubstatus=doc.get('pubstatus'),
            )

    def validate_published_state(self, new_publish_state):
        try:
            assert new_publish_state in published_state
        except AssertionError:
            abort(409)

    @staticmethod
    def validate_item(doc):
        errors = get_resource_service('planning_validator').post([{
            'validate_on_publish': True,
            'type': 'planning',
            'validate': doc
        }])[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    def publish_planning(self, plan, new_publish_state):
        """Publish a Planning item

        """
        plan.setdefault(config.VERSION, 1)
        plan.setdefault('item_id', plan['_id'])
        updates = {'state': get_item_publish_state(plan, new_publish_state), 'pubstatus': new_publish_state}
        plan['pubstatus'] = new_publish_state
        get_resource_service('planning').update(plan['_id'], updates, plan)
        get_resource_service('planning_history')._save_history(plan, updates, 'publish')
        get_enqueue_service('publish').enqueue_item(plan, 'planning')

    def _get_publish_state(self, plan, new_publish_state):
        if new_publish_state == PUBLISHED_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if plan.get('pubstatus') != PUBLISHED_STATE.USABLE:
            # Publishing for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return plan.get('state')
