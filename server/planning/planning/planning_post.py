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
from superdesk.errors import SuperdeskApiError
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.notification import push_notification
from copy import deepcopy
import logging

from eve.utils import config
from planning.planning import PlanningResource
from planning.common import WORKFLOW_STATE, POST_STATE, post_state, UPDATE_SINGLE, UPDATE_ALL, \
    get_item_post_state, enqueue_planning_item, get_version_item_for_post

logger = logging.getLogger(__name__)


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
        assignments_to_delete = []
        for doc in docs:
            plan = get_resource_service('planning').find_one(
                req=None,
                _id=doc['planning']
            )
            event = None
            if plan.get('event_item'):
                event = get_resource_service('events').find_one(req=None, _id=plan.get('event_item'))

            self.validate_item(plan, event, doc['pubstatus'])

            if not plan:
                abort(412)

            self.validate_post_state(doc['pubstatus'])
            if event and doc['pubstatus'] == POST_STATE.USABLE:
                self.post_associated_event(event)
            self.post_planning(plan, doc['pubstatus'], assignments_to_delete)
            ids.append(doc['planning'])

        get_resource_service('planning').delete_assignments_for_coverages(assignments_to_delete)
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
    def validate_item(doc, event, new_post_status):
        if new_post_status == POST_STATE.USABLE and event and event.get('pubstatus') == POST_STATE.CANCELLED:
            raise SuperdeskApiError(message="Can't post the planning item as event is already unposted/cancelled.")

        errors = get_resource_service('planning_validator').post([{
            'validate_on_post': True,
            'type': 'planning',
            'validate': doc
        }])[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    def post_associated_event(self, event):
        """If the planning item is associated with an even that is not posted we need to post the event

        :param event_id:
        :return:
        """
        if event:
            update_method = UPDATE_ALL if event.get('recurrence_id') else UPDATE_SINGLE
            if event and event.get('pubstatus') is None:
                get_resource_service('events_post').post([{'event': event[config.ID_FIELD], 'etag': event['_etag'],
                                                           'update_method': update_method, 'pubstatus': 'usable'}])

    def post_planning(self, plan, new_post_state, assignments_to_delete):
        """Post a Planning item

        """
        updates = deepcopy(plan)
        updates['state'] = get_item_post_state(plan, new_post_state)
        updates['pubstatus'] = new_post_state
        if updates['state'] in [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.KILLED]:
            updates['state_reason'] = None

        if new_post_state == POST_STATE.CANCELLED:
            for coverage in updates.get('coverages', []):
                if coverage.get('assigned_to', {}).get('assignment_id'):
                    assignments_to_delete.append(deepcopy(coverage))
                    coverage['assigned_to'] = {}
                if coverage.get('workflow_status') != WORKFLOW_STATE.CANCELLED:
                    coverage['workflow_status'] = WORKFLOW_STATE.DRAFT
                    if coverage.get('planning', {}).pop('workflow_status_reason', None):
                        coverage['planning']['workflow_status_reason'] = None

        updates['pubstatus'] = new_post_state
        get_resource_service('planning').update(plan['_id'], updates, plan)

        # Set a version number
        version, updates = get_version_item_for_post(updates)
        self.publish_planning(updates, version)

        # Save the version into the history
        updates['version'] = version
        get_resource_service('planning_history')._save_history(plan, updates, 'post')

    def publish_planning(self, plan, version):
        """Enqueue the planning item"""
        # Create an entry in the planning versions collection for this published version
        version_id = get_resource_service('published_planning').post([{'item_id': plan['_id'],
                                                                       'version': version,
                                                                       'type': 'planning',
                                                                       'published_item': plan}])
        if version_id:
            # Asynchronously enqueue the item for publishing.
            enqueue_planning_item.apply_async(kwargs={'id': version_id[0]}, serializer="eve/json")
        else:
            logger.error('Failed to save planning version for planning item id {}'.format(plan['_id']))

    def _get_post_state(self, plan, new_post_state):
        if new_post_state == POST_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if plan.get('pubstatus') != POST_STATE.USABLE:
            # posting for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return plan.get('state')
