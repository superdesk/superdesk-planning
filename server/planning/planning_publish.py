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

from eve.utils import config
from .planning import PlanningResource
from .common import WORKFLOW_STATE, PUBLISHED_STATE, published_state


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
            if plan:
                plan['pubstatus'] = doc['pubstatus']
                self.validate_planning(plan)
                self.publish_planning(plan)
                ids.append(doc['planning'])
            else:
                abort(412)
        return ids

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'planning:published',
                item=str(doc.get(config.ID_FIELD)),
                user=str(doc.get('version_creator', ''))
            )

    def validate_planning(self, plan):
        try:
            assert plan.get('pubstatus') in published_state
        except AssertionError:
            abort(409)

    def publish_planning(self, plan):
        """Publish a Planning item

        Does not publish anything yet, it is just a placeholder for when
        we implement publishing
        """
        updates = {'state': self._get_publish_state(plan), 'pubstatus': plan['pubstatus']}
        get_resource_service('planning').update(plan['_id'], updates, plan)
        get_resource_service('planning_history')._save_history(plan, updates, 'publish')

    def _get_publish_state(self, plan):
        if plan.get('pubstatus') == PUBLISHED_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED
        return WORKFLOW_STATE.PUBLISHED
