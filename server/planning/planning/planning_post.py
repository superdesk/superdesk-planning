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
from superdesk import get_resource_service, logger
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.notification import push_notification

from eve.utils import config
from planning.planning import PlanningResource
from planning.common import WORKFLOW_STATE, POST_STATE, post_state, get_item_post_state, enqueue_planning_item
from datetime import datetime


class PlanningPostResource(PlanningResource):
    schema = {
        'planning': Resource.rel('planning', type='string', required=True),
        'etag': {'type': 'string', 'required': True},
        'pubstatus': {
            'type': 'string',
            'required': True,
            'allowed': post_state
        },
    }

    url = 'planning/post'
    resource_title = endpoint_name = 'planning_post'
    resource_methods = ['POST']
    privileges = {'POST': 'planning_planning_post'}
    item_methods = []


class PlanningPostService(BaseService):
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

            self.validate_post_state(doc['pubstatus'])
            if plan.get('event_item'):
                self.post_associated_event(plan.get('event_item'))
            self.post_planning(plan, doc['pubstatus'])
            ids.append(doc['planning'])
        return ids

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'planning:posted',
                item=str(doc.get('planning')),
                etag=doc.get('_etag'),
                pubstatus=doc.get('pubstatus'),
            )

    def validate_post_state(self, new_post_state):
        try:
            assert new_post_state in post_state
        except AssertionError:
            abort(409)

    @staticmethod
    def validate_item(doc):
        errors = get_resource_service('planning_validator').post([{
            'validate_on_post': True,
            'type': 'planning',
            'validate': doc
        }])[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    def post_associated_event(self, event_id):
        """If the planning item is associated with an even that is not posted we need to post the event

        :param event_id:
        :return:
        """
        if event_id:
            event = get_resource_service('events').find_one(req=None, _id=event_id)
            if event and event.get('pubstatus') is None:
                get_resource_service('events_post').post([{'event': event[config.ID_FIELD], 'etag': event['_etag'],
                                                           'update_method': 'single', 'pubstatus': 'usable'}])

    def post_planning(self, plan, new_post_state):
        """Post a Planning item

        """
        # update the planning with new state
        updates = {'state': get_item_post_state(plan, new_post_state), 'pubstatus': new_post_state}
        plan['pubstatus'] = new_post_state
        get_resource_service('planning').update(plan['_id'], updates, plan)

        # Set a version number
        version = int((datetime.utcnow() - datetime.min).total_seconds() * 100000.0)
        plan.setdefault(config.VERSION, version)
        plan.setdefault('item_id', plan['_id'])

        # Save the version into the history
        updates['version'] = version
        get_resource_service('planning_history')._save_history(plan, updates, 'post')

        # Create an entry in the planning versions collection for this published version
        version_id = get_resource_service('planning_versions').post([{'item_id': plan['_id'],
                                                                      'version': version,
                                                                      'type': 'planning', 'published_item': plan}])
        if version_id:
            # Asynchronously enqueue the item for publishing.
            enqueue_planning_item.apply_async(kwargs={'id': version_id[0]})
        else:
            logger.error('Failed to save planning version for planning item id {}'.format(plan['_id']))

    def _get_post_state(self, plan, new_post_state):
        if new_post_state == POST_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if plan.get('pubstatus') != POST_STATE.USABLE:
            # posting for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return plan.get('state')
