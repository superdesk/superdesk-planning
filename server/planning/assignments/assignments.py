# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Assignments"""

import superdesk
import logging
from copy import deepcopy
from bson import ObjectId
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import item_url
from superdesk.metadata.item import metadata_schema, ITEM_STATE, CONTENT_STATE, ITEM_TYPE
from superdesk.resource import not_analyzed
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from apps.duplication.archive_move import ITEM_MOVE
from apps.publish.enqueue import ITEM_PUBLISH
from eve.utils import config, ParsedRequest
from superdesk.utc import utcnow
from planning.planning import coverage_schema
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from planning.item_lock import LockService, LOCK_USER
from superdesk.users.services import current_user_has_privilege
from planning.common import ASSIGNMENT_WORKFLOW_STATE, assignment_workflow_state, remove_lock_information, \
    get_local_end_of_day, is_locked_in_this_session
from flask import request, json
from planning.planning_notifications import PlanningNotifications
from apps.content import push_content_notification


logger = logging.getLogger(__name__)
planning_type = deepcopy(superdesk.Resource.rel('planning', type='string'))
planning_type['mapping'] = not_analyzed

DEFAULT_ASSIGNMENT_PRIORITY = 2


class AssignmentsService(superdesk.Service):
    """Service class for the Assignments model."""

    def on_fetched_resource_archive(self, docs):
        self._enhance_archive_items(docs[config.ITEMS])

    def on_fetched_item_archive(self, doc):
        if doc.get('assignment_id'):
            assignment = self.find_one(req=None, _id=doc['assignment_id'])
            if assignment:
                doc['assignment'] = assignment.get('assigned_to') or {}

    def _enhance_archive_items(self, docs):
        ids = [str(item['assignment_id']) for item in docs if item.get('assignment_id')]
        assignments = {str(item[config.ID_FIELD]): item for item in self.get_from_mongo(
            req=None,
            lookup={'_id': {'$in': ids}}
        )}

        for doc in docs:
            if doc.get('assignment_id') in assignments:
                doc['assignment'] = assignments[doc['assignment_id']].get('assigned_to') or {}

    def on_fetched(self, docs):
        for doc in docs['_items']:
            self._enchance_assignment(doc)

    def on_fetched_item(self, doc):
        self._enchance_assignment(doc)

    def _enchance_assignment(self, doc):
        """Populate `item_ids` with ids for all linked Archive items for an Assignment

        Using the `search` resource service, retrieve the list of Archive items linked to
        the provided Assignment.
        """
        query = {
            'query': {
                'filtered': {
                    'filter': {
                        'bool': {
                            'must': {
                                'term': {'assignment_id': str(doc[config.ID_FIELD])}
                            },
                        }
                    }
                }
            }
        }

        req = ParsedRequest()
        repos = 'archive,published,archived'
        req.args = {'source': json.dumps(query), 'repo': repos}
        items = list(get_resource_service('search').get(req=req, lookup=None))

        if items:
            doc['item_ids'] = [str(item.get(config.ID_FIELD)) for item in items]

        self.set_type(doc, doc)

    @staticmethod
    def set_type(updates, original):
        if not original.get(ITEM_TYPE):
            updates[ITEM_TYPE] = 'assignment'

    def on_create(self, docs):
        for doc in docs:
            self.set_assignment(doc)

    def on_created(self, docs):
        for doc in docs:
            self._send_assignment_creation_notification(doc)

        get_resource_service('assignments_history').on_item_created(docs)

    def _send_assignment_creation_notification(self, doc):
        assignment_state = doc['assigned_to'].get('state')
        if assignment_state != ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            self.notify('assignments:created', doc, {})

            if assignment_state != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                self.send_assignment_notification(doc, {})

    def set_assignment(self, updates, original=None):
        """Set the assignment information"""
        if not original:
            original = {}

        self.set_type(updates, original)

        if not updates.get('assigned_to'):
            if updates.get('priority'):
                # Priority was edited - nothing to set here
                return
            else:
                updates['assigned_to'] = {}

        assigned_to = updates.get('assigned_to')
        if assigned_to.get('user') and not assigned_to.get('desk'):
            raise SuperdeskApiError.badRequestError(message="Assignment should have a desk.")

        # set the assignment information
        user = get_user()
        if original.get('assigned_to', {}).get('desk') != assigned_to.get('desk'):
            if original.get('assigned_to', {}).get('state') in \
                    [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED]:
                raise SuperdeskApiError.forbiddenError(
                    message="Assignment linked to content. Desk reassignment not allowed.")

            assigned_to['assigned_date_desk'] = utcnow()

            if user and user.get(config.ID_FIELD):
                assigned_to['assignor_desk'] = user.get(config.ID_FIELD)

        if assigned_to.get('user') and original.get('assigned_to', {}).get('user') != assigned_to.get('user'):
            assigned_to['assigned_date_user'] = utcnow()

            if user and user.get(config.ID_FIELD):
                assigned_to['assignor_user'] = user.get(config.ID_FIELD)

        if not original.get(config.ID_FIELD):
            updates['original_creator'] = str(user.get(config.ID_FIELD)) if user else None
            updates['assigned_to'][ITEM_STATE] = updates['assigned_to'].get(ITEM_STATE) or \
                ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
        else:
            # In case user was removed
            if not assigned_to.get('user'):
                assigned_to['user'] = None
            else:
                # Moving from submitted to assigned after user assigned after desk submission
                if original.get('assigned_to')['state'] == ASSIGNMENT_WORKFLOW_STATE.SUBMITTED:
                    updates['assigned_to']['state'] = ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS

            updates['version_creator'] = str(user.get(config.ID_FIELD)) if user else None

    def on_update(self, updates, original):
        self.set_assignment(updates, original)
        remove_lock_information(updates)

    def notify(self, event_name, updates, original):
        # No notifications for 'draft' assignments
        if self.is_assignment_draft(updates, original):
            return

        # We set lock information to None if any update (patch) is triggered by user action.
        # In this case, we do not send lock_user from original item.
        # But, for system_update, we need to send lock_user of original item
        lock_user = original.get('lock_user')
        if 'lock_user' in updates:
            lock_user = None

        doc = deepcopy(original)
        doc.update(updates)
        kwargs = {
            'item': doc.get(config.ID_FIELD),
            'coverage': doc.get('coverage_item'),
            'planning': doc.get('planning_item'),
            'assigned_user': (doc.get('assigned_to') or {}).get('user'),
            'assigned_desk': (doc.get('assigned_to') or {}).get('desk'),
            'user': doc.get('version_creator', doc.get('original_creator')),
            'original_assigned_desk': (original.get('assigned_to') or {}).get('desk'),
            'original_assigned_user': (original.get('assigned_to') or {}).get('user'),
            'assignment_state': doc.get('assigned_to')['state'],
            'lock_user': lock_user,
        }

        if event_name == 'assignments:updated' and not updates.get('assigned_to')\
                and updates.get('priority'):
            kwargs['priority'] = doc.get('priority')

        push_notification(event_name, **kwargs)

    def on_updated(self, updates, original):
        self.notify('assignments:updated', updates, original)
        self.send_assignment_notification(updates, original)

    def system_update(self, id, updates, original):
        super().system_update(id, updates, original)
        if self.is_assignment_being_activated(updates, original):
            doc = deepcopy(original)
            doc.update(updates)
            self._send_assignment_creation_notification(doc)
        else:
            self.notify('assignments:updated', updates, original)

    def is_assignment_modified(self, updates, original):
        """Checks whether the assignment is modified or not"""
        if 'assigned_to' not in updates:
            return False
        updates_assigned_to = updates.get('assigned_to') or {}
        original_assigned_to = original.get('assigned_to') or {}
        return updates_assigned_to.get('desk') != original_assigned_to.get('desk') or \
            updates_assigned_to.get('user') != original_assigned_to.get('user')

    def send_assignment_notification(self, updates, original=None, force=False):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if self.is_assignment_draft(updates, original):
            return

        if not original:
            original = {}

        if not force and not self.is_assignment_modified(updates, original):
            return

        assigned_to = updates.get('assigned_to', {})

        user = get_user()

        # Determine the name of the desk that the assigment has been allocated to
        assigned_to_desk = get_resource_service('desks').find_one(req=None, _id=assigned_to.get('desk'))
        desk_name = assigned_to_desk.get('name') if assigned_to_desk else 'Unknown'

        # Determine the display name of the assignee
        assigned_to_user = get_resource_service('users').find_one(req=None, _id=assigned_to.get('user'))
        assignee = assigned_to_user.get('display_name') if assigned_to_user else 'Unknown'

        coverage_type = updates.get('planning', original.get('planning', {})).get('g2_content_type', '')
        slugline = updates.get('planning', original.get('planning', {})).get('slugline', 'with no slugline')

        # The assignment is to a user
        if assigned_to.get('user'):
            # If it is a reassignment
            if original.get('assigned_to'):
                # it is being reassigned by the original assignee, notify the new assignee
                if original.get('assigned_to', {}).get('user', '') == str(user.get(config.ID_FIELD, None)):
                    message = '{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to ' \
                              'you on desk ({{desk}})'
                    PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                              message=message,
                                                              coverage_type=coverage_type,
                                                              slugline=slugline,
                                                              desk=desk_name)
                else:
                    # if it was assigned to a desk before, test if there has been a change of desk
                    if original.get('assigned_to') and original.get('assigned_to').get('desk') != updates.get(
                            'assigned_to').get('desk'):
                        # Determine the name of the desk that the assigment was allocated to
                        assigned_from_desk = get_resource_service('desks').find_one(req=None,
                                                                                    _id=original.get('assigned_to').get(
                                                                                        'desk'))
                        desk_from_name = assigned_from_desk.get('name') if assigned_from_desk else 'Unknown'
                        assigned_from = original.get('assigned_to')
                        assigned_from_user = get_resource_service('users').find_one(req=None,
                                                                                    _id=assigned_from.get('user'))
                        old_assignee = assigned_from_user.get('display_name') if assigned_from_user else None
                        message = '{{coverage_type}} coverage \"{{slugline}}\" has been reassigned ' \
                                  'to {{assignee}} ({{desk}}) from {{old_assignee}} ({{old_desk}})'
                        PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                                  target_desk2=original.get('assigned_to').get('desk'),
                                                                  message=message,
                                                                  coverage_type=coverage_type,
                                                                  slugline=slugline,
                                                                  assignee=assignee,
                                                                  desk=desk_name,
                                                                  old_assignee=old_assignee,
                                                                  old_desk=desk_from_name)
                    else:
                        # it is being reassigned by someone else so notify both the new assignee and the old
                        message = '{{coverage_type}} coverage \"{{slugline}}\" has been reassigned to {{assignee}} ' \
                                  'on desk ({{desk}})'
                        PlanningNotifications().notify_assignment(target_user=original.get('assigned_to').get('user'),
                                                                  target_desk=original.get('assigned_to').get(
                                                                      'desk') if original.get('assigned_to').get(
                                                                      'user') is None else None,
                                                                  message=message,
                                                                  coverage_type=coverage_type,
                                                                  slugline=slugline,
                                                                  assignee=assignee,
                                                                  desk=desk_name)
                        # notify the assignee
                        message = '{{coverage_type}} coverage \"{{slugline}}\" has been reassigned' \
                                  '{{old_assignee}} to you on desk ({{desk}}) '
                        assigned_from = original.get('assigned_to')
                        assigned_from_user = get_resource_service('users').find_one(req=None,
                                                                                    _id=assigned_from.get('user'))
                        old_assignee = assigned_from_user.get('display_name') if assigned_from_user else None
                        PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                                  message=message,
                                                                  coverage_type=coverage_type,
                                                                  slugline=slugline,
                                                                  old_assignee=' from ' + old_assignee
                                                                  if old_assignee else '',
                                                                  desk=desk_name)
            else:  # A new assignment
                # notify the user the assignment has been made to
                PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                          message='{{assignor}} assigned a coverage to {{assignee}}',
                                                          assignor=user.get('display_name')
                                                          if str(user.get(config.ID_FIELD, None)) != assigned_to.get(
                                                              'user') else 'You',
                                                          assignee='you'
                                                          if str(user.get(config.ID_FIELD, None)) != assigned_to.get(
                                                              'user') else 'yourself')
        else:  # Assigned/Reassigned to a desk, notify all desk members
            # if it was assigned to a desk before, test if there has been a change of desk
            if original.get('assigned_to') and original.get('assigned_to').get('desk') != updates.get(
                    'assigned_to', {}).get('desk'):
                # Determine the name of the desk that the assigment was allocated to
                assigned_from_desk = get_resource_service('desks').find_one(req=None,
                                                                            _id=original.get('assigned_to').get('desk'))
                desk_from_name = assigned_from_desk.get('name') if assigned_from_desk else 'Unknown'
                message = '{{coverage_type}} coverage \"{{slugline}}\" has been submitted to ' \
                          'desk {{desk}} from {{from_desk}}'

                PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                          target_desk2=original.get('assigned_to').get('desk'),
                                                          message=message,
                                                          coverage_type=coverage_type,
                                                          slugline=slugline,
                                                          desk=desk_name,
                                                          from_desk=desk_from_name)
            else:
                assign_type = 'reassigned' if original.get('assigned_to') else 'assigned'
                message = '{{coverage_type}} coverage \"{{slugline}}\" {{assign_type}} to desk {{desk}}'
                PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'), message=message,
                                                          coverage_type=coverage_type,
                                                          slugline=slugline,
                                                          assign_type=assign_type,
                                                          desk=desk_name)

    def send_assignment_cancellation_notification(self, assignment, event_cancellation=False):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if not assignment or self.is_assignment_draft(assignment, {}):
            return

        user = get_user()
        assigned_to = assignment.get('assigned_to')
        slugline = assignment.get('planning').get('slugline', '')
        coverage_type = assignment.get('planning').get('g2_content_type', '')

        desk = get_resource_service('desks').find_one(req=None, _id=assigned_to.get('desk'))
        if event_cancellation:
            PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                      target_desk=assigned_to.get('desk') if not assigned_to.get(
                                                          'user') else None,
                                                      message='The event associated with {{coverage_type}} coverage '
                                                              '\"{{slugline}}\" has been marked as cancelled',
                                                      slugline=slugline,
                                                      coverage_type=coverage_type)
            return
        PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                  target_desk=assigned_to.get('desk') if not assigned_to.get(
                                                      'user') else None,
                                                  message='Assignment {{slugline}} for desk {{desk}} has been'
                                                          ' cancelled by {{user}}',
                                                  user=user.get('display_name', 'Unknown')
                                                  if str(user.get(config.ID_FIELD, None)) != assigned_to.get(
                                                      'user') else 'You',
                                                  omit_user=True,
                                                  slugline=slugline,
                                                  desk=desk.get('name'))

    def cancel_assignment(self, original_assignment, coverage, event_cancellation=False):
        coverage_to_copy = deepcopy(coverage)
        if original_assignment:
            updated_assignment = {'assigned_to': {}}
            updated_assignment.get('assigned_to').update(original_assignment.get('assigned_to'))
            updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.cancelled
            updated_assignment['planning'] = coverage_to_copy.get('planning')
            updated_assignment['planning']['news_coverage_status'] = coverage_to_copy.get('news_coverage_status')

            if original_assignment.get('assigned_to')['state'] in\
                    [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED]:
                # unlink the archive item from assignment
                archive_item = get_resource_service('archive').\
                    find_one(req=None, assignment_id=original_assignment.get(config.ID_FIELD))
                if archive_item and archive_item.get('assignment_id'):
                    get_resource_service('assignments_unlink').post([{
                        'item_id': archive_item.get(config.ID_FIELD),
                        'assignment_id': original_assignment.get(config.ID_FIELD)
                    }])

            self.system_update(ObjectId(original_assignment.get('_id')), updated_assignment, original_assignment)

            # Save history
            get_resource_service('assignments_history').on_item_updated(updated_assignment,
                                                                        original_assignment,
                                                                        'cancelled')
            self.send_assignment_cancellation_notification(updated_assignment, event_cancellation)

    def _get_empty_updates_for_assignment(self, assignment):
        updated_assignment = {'assigned_to': {}}
        updated_assignment.get('assigned_to').update(assignment.get('assigned_to'))
        return updated_assignment

    def _set_user_for_assignment(self, assignment, assignee, assignor=None):
        updates = self._get_empty_updates_for_assignment(assignment)
        updates['assigned_to']['user'] = assignee

        if assignor:
            updates['assigned_to']['assignor_user'] = assignor

        return updates

    def _get_assignment_data_on_archive_update(self, updates, original):
        assignment_id = original.get('assignment_id')
        item_user_id = updates.get('version_creator')
        item_desk_id = updates.get('task', {}).get('desk')
        assignment = None
        if assignment_id:
            assignment = self.find_one(req=None, _id=assignment_id)

        return {
            'assignment_id': assignment_id,
            'item_user_id': str(item_user_id),
            'item_desk_id': str(item_desk_id),
            'assignment': assignment
        }

    def update_assignment_on_archive_update(self, updates, original):
        if not original.get('assignment_id'):
            return

        assignment_update_data =\
            self._get_assignment_data_on_archive_update(updates, original)

        if assignment_update_data.get('assignment') and \
            assignment_update_data['assignment'].get('assigned_to')['user'] != \
                assignment_update_data.get('item_user_id'):
            # re-assign the user to the lock user
            updated_assignment = self._set_user_for_assignment(assignment_update_data.get('assignment'),
                                                               assignment_update_data.get('item_user_id'))
            updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
            self._update_assignment_and_notify(updated_assignment, assignment_update_data.get('assignment'))
            get_resource_service('assignments_history').on_item_updated(updated_assignment,
                                                                        assignment_update_data.get('assignment'))

    def update_assignment_on_archive_operation(self, updates, original, operation=None):
        if operation == ITEM_MOVE:
            assignment_update_data = \
                self._get_assignment_data_on_archive_update(updates, original)

            if assignment_update_data.get('assignment') and \
                assignment_update_data['assignment'].get('assigned_to')['desk'] != \
                    assignment_update_data.get('item_desk_id'):
                updated_assignment = self._set_user_for_assignment(assignment_update_data['assignment'], None,
                                                                   assignment_update_data.get('item_user_id'))
                updated_assignment.get('assigned_to')['desk'] = assignment_update_data.get('item_desk_id')
                updated_assignment.get('assigned_to')['assignor_user'] = assignment_update_data.get('item_user_id')
                updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.SUBMITTED

                self._update_assignment_and_notify(updated_assignment, assignment_update_data['assignment'])
                get_resource_service('assignments_history').on_item_updated(updated_assignment,
                                                                            assignment_update_data.get('assignment'),
                                                                            'submitted')
        elif operation == ITEM_PUBLISH:
            assignment_update_data = \
                self._get_assignment_data_on_archive_update(updates, original)

            if assignment_update_data.get('assignment'):
                updated_assignment = self._get_empty_updates_for_assignment(assignment_update_data['assignment'])
                if updates.get(ITEM_STATE, original.get(ITEM_STATE, '')) != CONTENT_STATE.SCHEDULED:
                    updated_assignment.get('assigned_to')['state'] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                    self._update_assignment_and_notify(updated_assignment, assignment_update_data['assignment'])
                    get_resource_service('assignments_history').on_item_updated(
                        updated_assignment,
                        assignment_update_data.get('assignment'),
                        'complete')

    def duplicate_assignment_on_create_archive_rewrite(self, items):
        """Duplicates the coverage/assignment for the archive rewrite

        If any errors occur at this point in time, the rewrite is still created
        with an error notification shown in the browser.
        """
        archive_service = get_resource_service('archive')
        delivery_service = get_resource_service('delivery')
        planning_service = get_resource_service('planning')
        assignment_link_service = get_resource_service('assignments_link')

        for item in items:
            original_item = archive_service.find_one(req=None, _id=item.get('rewrite_of'))

            # Skip items not linked to an Assignment/Coverage
            if not original_item.get('assignment_id'):
                continue

            assignment = self.find_one(req=None, _id=str(original_item['assignment_id']))
            if not assignment:
                raise SuperdeskApiError.badRequestError(
                    'Assignment not found.'
                )

            delivery = delivery_service.find_one(req=None, item_id=original_item[config.ID_FIELD])
            if not delivery:
                raise SuperdeskApiError.badRequestError(
                    'Delivery record not found.'
                )

            # Duplicate the coverage, which will generate our new assignment for us
            updated_plan, new_coverage = planning_service.duplicate_coverage_for_article_rewrite(
                planning_id=delivery.get('planning_id'),
                coverage_id=delivery.get('coverage_id'),
                updates={
                    'planning': {
                        'g2_content_type': item.get('type'),
                        'slugline': item.get('slugline'),
                        'scheduled': get_local_end_of_day(),
                    },
                    'news_coverage_status': {
                        'qcode': 'ncostat:int'
                    },
                    'assigned_to': {
                        'user': (item.get('task') or {}).get('user'),
                        'desk': (item.get('task') or {}).get('desk'),
                        'state': ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                        'priority': DEFAULT_ASSIGNMENT_PRIORITY,
                    }
                }
            )

            new_assignment_id = new_coverage['assigned_to'].get('assignment_id')
            assignment_link_service.post([{
                'assignment_id': str(new_assignment_id),
                'item_id': str(item[config.ID_FIELD])
            }])

    def unlink_assignment_on_delete_archive_rewrite(self):
        # Because this is in response to a Resource level DELETE, we need to get the
        # item ID from the request args, then retrieve the item using that ID
        item_id = request.view_args['original_id']
        doc = get_resource_service('archive').find_one(req=None, _id=item_id)

        if not doc.get('assignment_id'):
            return

        get_resource_service('assignments_unlink').post([{
            'assignment_id': doc['assignment_id'],
            'item_id': doc[config.ID_FIELD]
        }])

    def _update_assignment_and_notify(self, updates, original):
        self.system_update(original.get(config.ID_FIELD),
                           updates, original)

        # send notification
        self.notify('assignments:updated', updates, original)

    def validate_assignment_lock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            if assignment_update_data.get('assignment'):
                assignment = assignment_update_data.get('assignment')
                if assignment and assignment.get('lock_user'):
                    if assignment['lock_session'] != get_auth()['_id'] or assignment['lock_user'] != user_id:
                        raise SuperdeskApiError.badRequestError(message="Lock Failed: Related assignment is locked.")

    def sync_assignment_lock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            if assignment_update_data.get('assignment'):
                assignment = assignment_update_data.get('assignment')
                lock_service = get_component(LockService)
                lock_service.lock(assignment, user_id, get_auth()['_id'], 'content_edit', 'assignments')

    def sync_assignment_unlock(self, item, user_id):
        if item.get('assignment_id'):
            assignment_update_data = self._get_assignment_data_on_archive_update({}, item)
            if assignment_update_data.get('assignment'):
                assignment = assignment_update_data.get('assignment')
                if assignment.get(LOCK_USER):
                    lock_service = get_component(LockService)
                    lock_service.unlock(assignment, user_id, get_auth()['_id'], 'assignments')

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege('planning_planning_management'):
            return False, 'User does not have sufficient permissions.'
        return True, ''

    def on_delete(self, doc):
        """
        Validate that we have a lock on the Assignment and it's associated Planning item
        """
        # Make sure the Assignment is locked by this user and session
        if not is_locked_in_this_session(doc):
            raise SuperdeskApiError.forbiddenError(
                message='Lock is not obtained on the Assignment item'
            )

        # Also make sure the Planning item is locked by this user and session
        planning_service = get_resource_service('planning')
        planning_item = planning_service.find_one(req=None, _id=doc.get('planning_item'))
        if planning_item and not is_locked_in_this_session(planning_item):
            raise SuperdeskApiError.forbiddenError(
                message='Lock is not obtained on the associated Planning item'
            )

        # Make sure we cannot delete a completed Assignment
        # This should not be needed, as you cannot obtain a lock on an Assignment that is completed
        # But keeping it here for completeness
        if doc['assigned_to'].get('state') == ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
            raise SuperdeskApiError.badRequestError(
                message='Cannot delete a completed Assignment'
            )

    def on_deleted(self, doc):
        """Validate we can safely delete the Assignment item

        Make sure to clean up the Archive, Delivery and Planning items by:
            * Remove 'assignment_id' from Archive item (if linked)
            * Delete the Delivery record associated with the Assignment & Archive items (if linked)
            * Removing 'assigned_to' dictionary from the associated Coverage
        """
        archive_service = get_resource_service('archive')
        delivery_service = get_resource_service('delivery')
        planning_service = get_resource_service('planning')
        assignment_id = doc.get(config.ID_FIELD)

        # If we have a Content Item linked, then we need to remove the
        # assignment_id from it and remove the delivery record
        # Then send a notification that the content has been updated
        archive_item = archive_service.find_one(req=None, assignment_id=assignment_id)
        if archive_item:
            archive_service.system_update(
                archive_item[config.ID_FIELD],
                {'assignment_id': None},
                archive_item
            )

            delivery_service.delete_action(lookup={
                'assignment_id': assignment_id,
                'item_id': archive_item[config.ID_FIELD]
            })

            # Push content nofitication so connected clients can update the
            # content views (i.e. removes the Calendar icon from Monitoring)
            push_content_notification([archive_item])

        # Remove assignment information from coverage
        updated_planning = planning_service.remove_assignment(doc, unlock_planning=True)

        # Finally send a notification to connected clients that the Assignment
        # has been removed
        push_notification(
            'assignments:removed',
            assignment=assignment_id,
            planning=doc.get('planning_item'),
            coverage=doc.get('coverage_item'),
            planning_etag=updated_planning.get(config.ETAG),
            session=get_auth()['_id']
        )

    def is_assignment_draft(self, updates, original):
        return updates.get('assigned_to', original.get('assigned_to')).get('state') ==\
            ASSIGNMENT_WORKFLOW_STATE.DRAFT

    def is_assignment_being_activated(self, updates, original):
        return original.get('assigned_to').get('state') == ASSIGNMENT_WORKFLOW_STATE.DRAFT and\
            updates.get('assigned_to').get('state') != ASSIGNMENT_WORKFLOW_STATE.DRAFT


assignments_schema = {
    # Audit Information
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # Item type used by superdesk publishing
    ITEM_TYPE: {
        'type': 'string',
        'mapping': not_analyzed,
        'default': 'assignment',
    },

    # Assignment details
    'priority': metadata_schema['priority'],
    'coverage_item': {
        'type': 'string',
        'mapping': not_analyzed
    },
    'planning_item': planning_type,
    'lock_user': metadata_schema['lock_user'],
    'lock_time': metadata_schema['lock_time'],
    'lock_session': metadata_schema['lock_session'],
    'lock_action': metadata_schema['lock_action'],

    'assigned_to': {
        'type': 'dict',
        'schema': {
            'desk': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'user': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'assignor_desk': {'type': 'string', 'mapping': not_analyzed},
            'assignor_user': {'type': 'string', 'mapping': not_analyzed},
            'assigned_date_desk': {'type': 'datetime'},
            'assigned_date_user': {'type': 'datetime'},
            'state': {'type': 'string', 'mapping': not_analyzed, 'allowed': assignment_workflow_state},
            'revert_state': {'type': 'string', 'mapping': not_analyzed, 'allowed': assignment_workflow_state},
            'coverage_provider': {
                'type': 'dict',
                'nullable': True,
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'}
                },
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed
                    }
                }
            }
        }
    },

    # coverage details
    'planning': coverage_schema['planning']
}


class AssignmentsResource(superdesk.Resource):
    url = 'assignments'
    item_url = item_url
    schema = assignments_schema
    resource_methods = ['GET']
    item_methods = ['GET', 'PATCH', 'DELETE']
    privileges = {'PATCH': 'planning',
                  'DELETE': 'planning'}

    mongo_indexes = {
        'coverage_item_1': ([('coverage_item', 1)], {'background': True}),
        'planning_item_1': ([('planning_item', 1)], {'background': True})
    }

    datasource = {
        'source': 'assignments',
        'search_backend': 'elastic'
    }

    etag_ignore_fields = ['planning']
