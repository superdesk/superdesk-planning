# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .planning import PlanningResource
from planning.common import ITEM_EXPIRY, ITEM_STATE, set_item_expiry, WORKFLOW_STATE, get_coverage_type_name,\
    remove_autosave_on_spike
from superdesk.services import BaseService
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.auth import get_user, get_user_id
from apps.archive.common import get_auth
from superdesk import config
from planning.item_lock import LOCK_USER, LOCK_SESSION
from superdesk import get_resource_service
from planning.planning_notifications import PlanningNotifications
from copy import deepcopy


class PlanningSpikeResource(PlanningResource):
    url = 'planning/spike'
    resource_title = endpoint_name = 'planning_spike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_spike'}


class PlanningSpikeService(BaseService):
    def update(self, id, updates, original):
        if original.get('pubstatus') or original.get('state') not in\
                [WORKFLOW_STATE.DRAFT, WORKFLOW_STATE.POSTPONED, WORKFLOW_STATE.CANCELLED]:
            raise SuperdeskApiError.badRequestError(
                message="Spike failed. Planning item in invalid state for spiking."
            )

        user = get_user(required=True)

        updates['revert_state'] = original[ITEM_STATE]
        updates[ITEM_STATE] = WORKFLOW_STATE.SPIKED
        set_item_expiry(updates)

        coverages = deepcopy(original.get('coverages') or [])
        for coverage in coverages:
            if coverage.get('workflow_status') == WORKFLOW_STATE.ACTIVE:
                coverage['workflow_status'] = WORKFLOW_STATE.DRAFT
                coverage['assigned_to'] = {}

        updates['coverages'] = coverages

        # Mark item as unlocked directly in order to avoid more queries and notifications
        # coming from lockservice.
        updates.update({LOCK_USER: None, LOCK_SESSION: None, 'lock_time': None,
                        'lock_action': None})

        remove_autosave_on_spike(original)
        item = self.backend.update(self.datasource, id, updates, original)
        push_notification('planning:spiked', item=str(id), user=str(user.get(config.ID_FIELD)),
                          etag=item['_etag'], revert_state=item['revert_state'])

        for coverage in coverages:
            workflow_status = coverage.get('workflow_status')
            if workflow_status == WORKFLOW_STATE.DRAFT:
                self.notify_draft_coverage_on_spike(coverage)

        return item

    def notify_draft_coverage_on_spike(self, coverage):
        assigned_to = coverage.get('assigned_to')
        if assigned_to:
            user = get_user()
            assignment_service = get_resource_service('assignments')
            assignment = assignment_service.find_one(req=None, _id=assigned_to.get('assignment_id'))
            slugline = assignment.get('planning').get('slugline', '')
            coverage_type = assignment.get('planning').get('g2_content_type', '')
            PlanningNotifications().notify_assignment(coverage_status=coverage.get('workflow_status'),
                                                      target_user=assignment.get('assigned_to').get('user'),
                                                      target_desk=assignment.get('assigned_to').get(
                                                          'desk') if not assignment.get('assigned_to').get(
                                                          'user') else None,
                                                      message='assignment_spiked_msg',
                                                      slugline=slugline,
                                                      coverage_type=get_coverage_type_name(coverage_type),
                                                      actioning_user=user.get('display_name',
                                                                              user.get('username', 'Unknown')),
                                                      omit_user=True)

    def on_updated(self, updates, original):
        if original.get('lock_user') and 'lock_user' in updates and updates.get('lock_user') is None:
            push_notification(
                'planning:unlock',
                item=str(original.get(config.ID_FIELD)),
                user=str(get_user_id()),
                lock_session=str(get_auth().get('_id')),
                etag=updates.get('_etag'),
                event_item=original.get('event_item') or None,
                recurrence_id=original.get('recurrence_id') or None
            )

        # Delete assignments in workflow
        assignments_to_delete = []
        coverages = original.get('coverages') or []
        for coverage in coverages:
            if coverage.get('workflow_status') == WORKFLOW_STATE.ACTIVE:
                assignments_to_delete.append(coverage)

        notify = True
        if original.get('event_item'):
            event = get_resource_service('events').find_one(req=None, _id=original.get('event_item'))
            notify = event.get('state') != WORKFLOW_STATE.SPIKED

        get_resource_service('planning').delete_assignments_for_coverages(assignments_to_delete,
                                                                          notify)


class PlanningUnspikeResource(PlanningResource):
    url = 'planning/unspike'
    resource_title = endpoint_name = 'planning_unspike'

    datasource = {'source': 'planning'}
    resource_methods = []
    item_methods = ['PATCH']
    privileges = {'PATCH': 'planning_planning_unspike'}


class PlanningUnspikeService(BaseService):
    def update(self, id, updates, original):
        if original.get('event_item'):
            event = get_resource_service('events').find_one(req=None, _id=original['event_item'])
            if event.get('state') == WORKFLOW_STATE.SPIKED:
                raise SuperdeskApiError.badRequestError(
                    message="Unspike failed. Associated event is spiked."
                )

        user = get_user(required=True)

        updates[ITEM_STATE] = original.get('revert_state', WORKFLOW_STATE.DRAFT)
        updates['revert_state'] = None
        updates[ITEM_EXPIRY] = None

        item = self.backend.update(self.datasource, id, updates, original)
        push_notification(
            'planning:unspiked',
            item=str(id),
            user=str(user.get(config.ID_FIELD)),
            etag=item['_etag'],
            state=item[ITEM_STATE]
        )
        return item
