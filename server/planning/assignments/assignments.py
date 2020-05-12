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
from planning.planning.planning import planning_schema
from superdesk import get_resource_service
from apps.common.components.utils import get_component
from planning.item_lock import LockService, LOCK_USER, LOCK_ACTION
from superdesk.users.services import current_user_has_privilege
from planning.common import ASSIGNMENT_WORKFLOW_STATE, assignment_workflow_state, remove_lock_information, \
    is_locked_in_this_session, get_coverage_type_name, get_version_item_for_post, get_related_items, \
    enqueue_planning_item, WORKFLOW_STATE, get_next_assignment_status, get_delivery_publish_time, \
    TO_BE_CONFIRMED_FIELD, TO_BE_CONFIRMED_FIELD_SCHEMA, update_assignment_on_link_unlink
from flask import request, json, current_app as app
from planning.planning_notifications import PlanningNotifications
from apps.content import push_content_notification
from .assignments_history import ASSIGNMENT_HISTORY_ACTIONS

logger = logging.getLogger(__name__)
planning_type = deepcopy(superdesk.Resource.rel('planning', type='string'))
planning_type['mapping'] = not_analyzed


class AssignmentsService(superdesk.Service):
    """Service class for the Assignments model."""

    def on_fetched_resource_archive(self, docs):
        self._enhance_archive_items(docs.get(config.ITEMS, []))

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
        """Populate `item_ids` with ids for all linked Archive items for an Assignment"""

        results = self.get_archive_items_for_assignment(doc)
        if results.count() > 0:
            doc['item_ids'] = [str(item.get(config.ID_FIELD)) for item in results]

        self.set_type(doc, doc)

    def get_archive_items_for_assignment(self, assignment):
        """Using the `search` resource service, retrieve the list of Archive items linked to the provided Assignment."""

        query = {
            'query': {
                'filtered': {
                    'filter': {
                        'bool': {
                            'must': {
                                'term': {'assignment_id': str(assignment[config.ID_FIELD])}
                            },
                        }
                    }
                }
            }
        }

        req = ParsedRequest()
        repos = 'archive,published,archived'
        req.args = {'source': json.dumps(query), 'repo': repos}
        return get_resource_service('search').get(req=req, lookup=None)

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
                get_resource_service('planning').set_xmp_file_info(doc)
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

        assigned_to = updates.get('assigned_to') or {}
        if (assigned_to.get('user') or assigned_to.get('contact')) and not assigned_to.get('desk'):
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
            updates['assigned_to'][
                ITEM_STATE] = get_next_assignment_status(updates, updates['assigned_to'].get(ITEM_STATE) or
                                                         ASSIGNMENT_WORKFLOW_STATE.ASSIGNED)
        else:
            # In case user was removed
            if not assigned_to.get('user'):
                assigned_to['user'] = None
            else:
                # Moving from submitted to assigned after user assigned after desk submission
                if original.get('assigned_to')['state'] == ASSIGNMENT_WORKFLOW_STATE.SUBMITTED:
                    updates['assigned_to']['state'] = get_next_assignment_status(updates,
                                                                                 ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS)

            updates['version_creator'] = str(user.get(config.ID_FIELD)) if user else None

    def on_update(self, updates, original):
        self.validate_assignment_action(original)
        self.set_assignment(updates, original)
        remove_lock_information(updates)

    def validate_assignment_action(self, assignment):
        if assignment.get('_to_delete'):
            plan = get_resource_service('planning').find_one(req=None, _id=assignment.get('planning_item'))
            state = 'unposted' if (plan or {}).get('state') == WORKFLOW_STATE.KILLED else (plan or {}).get('state')
            raise SuperdeskApiError.forbiddenError('Action failed. Related planning item is {}'.format(state))

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
        assigned_to = doc.get('assigned_to') or {}
        kwargs = {
            'item': doc.get(config.ID_FIELD),
            'coverage': doc.get('coverage_item'),
            'planning': doc.get('planning_item'),
            'assigned_user': assigned_to.get('user'),
            'assigned_date_user': assigned_to.get('assigned_date_user'),

            'assigned_desk': assigned_to.get('desk'),
            'assigned_date_desk': assigned_to.get('assigned_date_desk'),

            'assigned_contact': assigned_to.get('contact'),

            'user': doc.get('version_creator', doc.get('original_creator')),
            'original_assigned_desk': (original.get('assigned_to') or {}).get('desk'),
            'original_assigned_user': (original.get('assigned_to') or {}).get('user'),
            'assignment_state': assigned_to['state'],
            'lock_user': lock_user,
            'session': get_auth().get('_id')
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
            get_resource_service('assignments_history').on_item_add_to_workflow(updates, original)
        elif original.get(LOCK_ACTION) != 'content_edit' and \
                updates.get('assigned_to') and updates.get('assigned_to').get('state')\
                != ASSIGNMENT_WORKFLOW_STATE.CANCELLED:
            app.on_updated_assignments(updates, original)

    def is_assignment_modified(self, updates, original):
        """Checks whether the assignment is modified or not"""
        if 'assigned_to' not in updates:
            return False
        updates_assigned_to = updates.get('assigned_to') or {}
        original_assigned_to = original.get('assigned_to') or {}
        return updates_assigned_to.get('desk') != original_assigned_to.get('desk') or \
            updates_assigned_to.get('user') != original_assigned_to.get('user') or \
            updates_assigned_to.get('contact') != original_assigned_to.get('contact')

    def send_assignment_notification(self, updates, original=None, force=False):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if self.is_assignment_draft(updates, original):
            return

        # No assignment notification sent on start work
        if original.get('assigned_to', {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED and \
                updates.get('assigned_to', {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS:
            return

        assigned_to = updates.get('assigned_to', {})
        assignment_id = (updates.get('_id') or assigned_to.get('assignment_id', 'Unknown'))
        if not original:
            original = {}
        else:
            assignment_id = original.get('_id')

        if not force and not self.is_assignment_modified(updates, original):
            return

        user = get_user()

        # Determine the name of the desk that the assigment has been allocated to
        assigned_to_desk = get_resource_service('desks').find_one(req=None, _id=assigned_to.get('desk'))
        desk_name = assigned_to_desk.get('name') if assigned_to_desk else 'Unknown'

        # Determine the display name of the assignee
        assignee = None
        if assigned_to.get('contact'):
            assigned_to_contact = get_resource_service('contacts').find_one(
                req=None,
                _id=assigned_to.get('contact')
            )
            if assigned_to_contact and len(assigned_to_contact.get('contact_email') or []):
                assignee = '{} {} ({})'.format(
                    assigned_to_contact.get('first_name') or '',
                    assigned_to_contact.get('last_name') or '',
                    assigned_to_contact['contact_email'][0]
                )

        if assignee is None and assigned_to.get('user'):
            assigned_to_user = get_resource_service('users').find_one(
                req=None,
                _id=assigned_to.get('user')
            )
            if assigned_to_user and assigned_to_user.get('slack_username'):
                assignee = '@' + assigned_to_user.get('slack_username')
            else:
                assignee = assigned_to_user.get('display_name') if assigned_to_user else 'Unknown'

        coverage_type = updates.get('planning', original.get('planning', {})).get('g2_content_type', '')
        slugline = updates.get('planning', original.get('planning', {})).get('slugline', 'with no slugline')

        client_url = app.config['CLIENT_URL']

        assignment = deepcopy(original)
        assignment.update(updates)
        planning_id = assignment.get('planning_item', -1)
        planning_item = get_resource_service('planning').find_one(req=None, _id=planning_id)
        if planning_item and planning_item.get('event_item'):
            event_item = get_resource_service('events').find_one(req=None, _id=planning_item.get('event_item'))
            contacts = []
            for contact_id in event_item.get('event_contact_info', []):
                contact_details = get_resource_service('contacts').find_one(req=None, _id=contact_id)
                if contact_details:
                    contacts.append(contact_details)
            if len(contacts):
                event_item['event_contact_info'] = contacts
        else:
            event_item = None

        # The assignment is to an external contact or a user
        if assigned_to.get('contact') or assigned_to.get('user'):
            # If it is a reassignment
            meta_msg = 'assignment_details_internal_email' if assigned_to.get('user') else 'assignment_details_email'
            if original.get('assigned_to'):
                # it is being reassigned by the original assignee, notify the new assignee
                if original.get('assigned_to', {}).get('user', '') == str(user.get(config.ID_FIELD, None)):
                    PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                              message='assignment_reassigned_1_msg',
                                                              meta_message=meta_msg,
                                                              coverage_type=get_coverage_type_name(coverage_type),
                                                              slugline=slugline,
                                                              desk=desk_name,
                                                              client_url=client_url,
                                                              assignment_id=assignment_id,
                                                              assignment=assignment,
                                                              event=event_item,
                                                              is_link=True,
                                                              contact_id=assigned_to.get('contact'))
                    # notify the desk
                    if assigned_to.get('desk'):
                        PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                                  message='assignment_reassigned_3_msg',
                                                                  meta_message=meta_msg,
                                                                  assignee=assignee,
                                                                  client_url=client_url,
                                                                  assignment_id=assignment_id,
                                                                  desk=desk_name,
                                                                  assignor=user.get('display_name'),
                                                                  assignment=assignment,
                                                                  event=event_item,
                                                                  omit_user=True,
                                                                  is_link=True)

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
                        old_assignee = assigned_from_user.get('display_name') if assigned_from_user else ''
                        PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                                  target_desk2=original.get('assigned_to').get('desk'),
                                                                  message='assignment_reassigned_2_msg',
                                                                  meta_message=meta_msg,
                                                                  coverage_type=get_coverage_type_name(coverage_type),
                                                                  slugline=slugline,
                                                                  assignee=assignee,
                                                                  desk=desk_name,
                                                                  old_assignee=old_assignee,
                                                                  client_url=client_url,
                                                                  assignment_id=assignment_id,
                                                                  old_desk=desk_from_name,
                                                                  assignor=user.get('display_name'),
                                                                  assignment=assignment,
                                                                  event=event_item,
                                                                  omit_user=True,
                                                                  is_link=True,
                                                                  contact_id=assigned_to.get('contact'))
                    else:
                        # it is being reassigned by someone else so notify both the new assignee and the old
                        PlanningNotifications().notify_assignment(target_user=original.get('assigned_to').get('user'),
                                                                  target_desk=original.get('assigned_to').get(
                                                                      'desk') if original.get('assigned_to').get(
                                                                      'user') is None else None,
                                                                  message='assignment_reassigned_3_msg',
                                                                  meta_message=meta_msg,
                                                                  coverage_type=get_coverage_type_name(coverage_type),
                                                                  slugline=slugline,
                                                                  assignee=assignee,
                                                                  client_url=client_url,
                                                                  assignment_id=assignment_id,
                                                                  desk=desk_name,
                                                                  assignor=user.get('display_name'),
                                                                  assignment=assignment,
                                                                  event=event_item,
                                                                  omit_user=True,
                                                                  is_link=True,
                                                                  contact_id=original.get('assigned_to').get('contact'))
                        # notify the assignee
                        assigned_from = original.get('assigned_to')
                        assigned_from_user = get_resource_service('users').find_one(req=None,
                                                                                    _id=assigned_from.get('user'))
                        old_assignee = assigned_from_user.get('display_name') if assigned_from_user else None
                        PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                                  message='assignment_reassigned_4_msg',
                                                                  meta_message=meta_msg,
                                                                  coverage_type=get_coverage_type_name(coverage_type),
                                                                  slugline=slugline,
                                                                  assignor=user.get('display_name', ''),
                                                                  old_assignee=' from ' + old_assignee
                                                                  if old_assignee else '',
                                                                  client_url=client_url,
                                                                  assignment_id=assignment_id,
                                                                  desk=desk_name,
                                                                  event=event_item,
                                                                  assignment=assignment,
                                                                  omit_user=True,
                                                                  is_link=True,
                                                                  contact_id=assigned_to.get('contact'))
            else:  # A new assignment
                # Notify the user the assignment has been made to unless assigning to your self
                if str(user.get(config.ID_FIELD, None)) != assigned_to.get('user', ''):
                    PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                              message='assignment_assigned_msg',
                                                              meta_message=meta_msg,
                                                              coverage_type=get_coverage_type_name(coverage_type),
                                                              slugline=slugline,
                                                              client_url=client_url,
                                                              assignment_id=assignment_id,
                                                              assignor='by ' + user.get('display_name', '')
                                                              if str(
                                                                  user.get(config.ID_FIELD, None)) != assigned_to.get(
                                                                  'user', '') else 'to yourself',
                                                              assignment=assignment,
                                                              event=event_item,
                                                              omit_user=True,
                                                              is_link=True,
                                                              contact_id=assigned_to.get('contact'))
        else:  # Assigned/Reassigned to a desk, notify all desk members
            # if it was assigned to a desk before, test if there has been a change of desk
            if original.get('assigned_to') and original.get('assigned_to').get('desk') != updates.get(
                    'assigned_to', {}).get('desk'):
                # Determine the name of the desk that the assigment was allocated to
                assigned_from_desk = get_resource_service('desks').find_one(req=None,
                                                                            _id=original.get('assigned_to').get('desk'))
                desk_from_name = assigned_from_desk.get('name') if assigned_from_desk else 'Unknown'
                if original.get('assigned_to', {}).get('user', '') == str(user.get(config.ID_FIELD, None)):
                    PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                              message='assignment_to_desk_msg',
                                                              meta_message='assignment_details_email',
                                                              coverage_type=get_coverage_type_name(coverage_type),
                                                              slugline=slugline,
                                                              assign_type='reassigned',
                                                              client_url=client_url,
                                                              assignment_id=assignment_id,
                                                              desk=desk_name,
                                                              assignor=user.get('display_name'),
                                                              assignment=assignment,
                                                              event=event_item,
                                                              omit_user=True,
                                                              is_link=True,
                                                              contact_id=assigned_to.get('contact'))
                else:
                    PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                              target_desk2=original.get('assigned_to').get('desk'),
                                                              message='assignment_submitted_msg',
                                                              meta_message='assignment_details_email',
                                                              coverage_type=get_coverage_type_name(coverage_type),
                                                              slugline=slugline,
                                                              desk=desk_name,
                                                              client_url=client_url,
                                                              assignment_id=assignment_id,
                                                              from_desk=desk_from_name,
                                                              assignment=assignment,
                                                              event=event_item,
                                                              is_link=True,
                                                              contact_id=assigned_to.get('contact'))
            else:
                assign_type = 'reassigned' if original.get('assigned_to') else 'assigned'
                PlanningNotifications().notify_assignment(target_desk=assigned_to.get('desk'),
                                                          message='assignment_to_desk_msg',
                                                          meta_message='assignment_details_email',
                                                          coverage_type=get_coverage_type_name(coverage_type),
                                                          slugline=slugline,
                                                          assign_type=assign_type,
                                                          client_url=client_url,
                                                          assignment_id=assignment_id,
                                                          desk=desk_name,
                                                          assignor=user.get('display_name'),
                                                          assignment=assignment,
                                                          event=event_item,
                                                          omit_user=True,
                                                          is_link=True,
                                                          contact_id=assigned_to.get('contact'))

    def send_assignment_cancellation_notification(self, assignment, original_state, event_cancellation=False,
                                                  event_reschedule=False):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if not assignment or original_state == ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            return

        # No notifications on event reschedule
        if event_reschedule:
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
                                                      message='assignment_event_cancelled_msg',
                                                      slugline=slugline,
                                                      coverage_type=get_coverage_type_name(coverage_type),
                                                      contact_id=assigned_to.get('contact'))
            return
        PlanningNotifications().notify_assignment(target_user=assigned_to.get('user'),
                                                  target_desk=assigned_to.get('desk') if not assigned_to.get(
                                                      'user') else None,
                                                  message='assignment_cancelled_desk_msg',
                                                  user=user.get('display_name', 'Unknown')
                                                  if str(user.get(config.ID_FIELD, None)) != assigned_to.get(
                                                      'user') else 'You',
                                                  omit_user=True,
                                                  slugline=slugline,
                                                  desk=desk.get('name'),
                                                  coverage_type=get_coverage_type_name(coverage_type),
                                                  assignment_id=assignment.get(config.ID_FIELD),
                                                  contact_id=assigned_to.get('contact'))

    def send_acceptance_notification(self, assignment):
        """
        On an external acceptance of an assignment send a notification to the assignor

        :param assignment:
        :return:
        """
        assigned_to = assignment.get('assigned_to')

        if assigned_to.get('state') != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            return

        slugline = assignment.get('planning').get('slugline', '')
        coverage_type = assignment.get('planning').get('g2_content_type', '')
        target_user = assigned_to.get('assignor_user')

        assignee_name = ''
        user_id = assigned_to.get('user')
        if user_id:
            assigned_to_user = get_resource_service('users').find_one(req=None, _id=assigned_to.get('user'))
            assignee_name = assigned_to_user.get('display_name')
        else:
            contact = superdesk.get_resource_service('contacts').find_one(req=None,
                                                                          _id=ObjectId(assigned_to.get('contact')))
            assignee_name = contact.get('first_name') + ' ' + contact.get('last_name')

        PlanningNotifications().notify_assignment(target_user=target_user,
                                                  slugline=slugline,
                                                  coverage_type=coverage_type,
                                                  message='assignment_accepted_msg',
                                                  user=assignee_name,
                                                  omit_user=True)

    def cancel_assignment(self, original_assignment, coverage, event_cancellation=False, event_reschedule=False):
        coverage_to_copy = deepcopy(coverage)
        if original_assignment:
            updated_assignment = {'assigned_to': {}}
            updated_assignment['assigned_to'].update(original_assignment.get('assigned_to'))
            updated_assignment.get('assigned_to')['state'] = \
                get_next_assignment_status(updated_assignment, ASSIGNMENT_WORKFLOW_STATE.CANCELLED)
            updated_assignment['planning'] = coverage_to_copy.get('planning')
            updated_assignment['planning']['news_coverage_status'] = coverage_to_copy.get('news_coverage_status')
            updated_assignment['planning']['workflow_status_reason'] = coverage_to_copy['planning']\
                .get('workflow_status_reason')

            if original_assignment.get('assigned_to')['state'] in\
                    [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED]:
                # unlink the archive item from assignment
                archive_item = get_resource_service('archive').\
                    find_one(req=None, assignment_id=original_assignment.get(config.ID_FIELD))
                if archive_item and archive_item.get('assignment_id'):
                    get_resource_service('assignments_unlink').post([{
                        'item_id': archive_item.get(config.ID_FIELD),
                        'assignment_id': original_assignment.get(config.ID_FIELD),
                        'cancel': True
                    }])

            self.system_update(ObjectId(original_assignment.get('_id')), updated_assignment, original_assignment)

            # Save history
            get_resource_service('assignments_history').on_item_updated(updated_assignment,
                                                                        original_assignment,
                                                                        ASSIGNMENT_HISTORY_ACTIONS.CANCELLED)
            self.notify('assignments:updated', updated_assignment, original_assignment)
            self.send_assignment_cancellation_notification(updated_assignment,
                                                           original_assignment.get('assigned_to')['state'],
                                                           event_cancellation, event_reschedule)

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
            updated_assignment.get('assigned_to')['state'] = \
                get_next_assignment_status(updated_assignment, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS)
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
                updated_assignment.get('assigned_to')['state'] = \
                    get_next_assignment_status(updated_assignment, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED)

                self._update_assignment_and_notify(updated_assignment, assignment_update_data['assignment'])
                get_resource_service('assignments_history').on_item_updated(updated_assignment,
                                                                            assignment_update_data.get('assignment'),
                                                                            ASSIGNMENT_HISTORY_ACTIONS.SUBMITTED)
        elif operation == ITEM_PUBLISH:
            assignment = self._get_assignment_data_on_archive_update(updates, original).get('assignment')
            if assignment:
                updated_assignment = self._get_empty_updates_for_assignment(assignment)
                if updates.get(ITEM_STATE, original.get(ITEM_STATE, '')) != CONTENT_STATE.SCHEDULED:
                    if updated_assignment.get('assigned_to')['state'] != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                        updated_assignment.get('assigned_to')['state'] = \
                            get_next_assignment_status(updated_assignment, ASSIGNMENT_WORKFLOW_STATE.COMPLETED)
                        self._update_assignment_and_notify(updated_assignment, assignment)
                        get_resource_service('assignments_history').on_item_complete(
                            updated_assignment, assignment)

                    # Update delivery record here
                    delivery_service = get_resource_service('delivery')
                    delivery = delivery_service.find_one(req=None, item_id=original[config.ID_FIELD])
                    if delivery and delivery.get('item_state') != CONTENT_STATE.PUBLISHED:
                        delivery_service.patch(delivery[config.ID_FIELD], {
                            'item_state': CONTENT_STATE.PUBLISHED,
                            'sequence_no': original.get('rewrite_sequence') or 0,
                            'publish_time': get_delivery_publish_time(updates, original)
                        })

                    # publish planning
                    self.publish_planning(assignment.get('planning_item'))

                    assigned_to_user = get_resource_service('users').find_one(req=None,
                                                                              _id=get_user().get(config.ID_FIELD, ''))
                    assignee = assigned_to_user.get('display_name') if assigned_to_user else 'Unknown'
                    target_user = assignment.get('assigned_to', {}).get('assignor_desk')

                    if not original.get('rewrite_of'):
                        PlanningNotifications().notify_assignment(target_user=target_user,
                                                                  message='assignment_complete_msg',
                                                                  assignee=assignee,
                                                                  coverage_type=get_coverage_type_name(
                                                                      original.get('planning', {}).get(
                                                                          'g2_content_type', '')),
                                                                  slugline=original.get('slugline'),
                                                                  omit_user=True,
                                                                  assignment_id=assignment['_id'],
                                                                  is_link=True,
                                                                  no_email=True
                                                                  )

    def on_events_updated(self, updates, original):
        """Send assignment notifications if any relevant Event metadata has changed"""

        event = deepcopy(original)
        event.update(updates)
        plannings = list(get_resource_service('events').get_plannings_for_event(event))

        if not plannings:
            # If this Event has no associated Planning items
            # then there is no need to send notifications
            return

        changed_fields = []

        for field in ['location', 'event_contact_info', 'files', 'links']:
            if (updates.get(field) or []) != (original.get(field) or []):
                changed_fields.append(field)

        if not changed_fields:
            # If no relevant Event fields have changed
            # then there is no need to send notifications
            return

        # Add 'assigned_to' details to all the coverages
        get_resource_service('planning').generate_related_assignments(plannings)

        for planning in plannings:
            for coverage in planning.get('coverages') or []:
                assigned_to = coverage.get('assigned_to') or {}

                slugline = (coverage.get('planning') or {}).get('slugline') or ''
                coverage_type = (coverage.get('planning') or {}).get('g2_content_type') or ''

                PlanningNotifications().notify_assignment(
                    coverage_status=(coverage.get('assigned_to') or {}).get('state'),
                    target_user=assigned_to.get('user'),
                    target_desk=assigned_to.get('desk') if not assigned_to.get('user') else None,
                    message='assignment_event_metadata_msg',
                    slugline=slugline,
                    coverage_type=get_coverage_type_name(coverage_type),
                    event=event,
                    client_url=app.config['CLIENT_URL'],
                    no_email=True,
                    contact_id=assigned_to.get('contact')
                )

    def create_delivery_for_content_update(self, items):
        """Duplicates the coverage/assignment for the archive rewrite

        If any errors occur at this point in time, the rewrite is still created
        with an error notification shown in the browser.
        """
        archive_service = get_resource_service('archive')
        delivery_service = get_resource_service('delivery')
        planning_service = get_resource_service('planning')
        assignment_link_service = get_resource_service('assignments_link')

        for doc in items:
            item = archive_service.find_one(req=None, _id=doc.get(config.ID_FIELD))
            original_item = archive_service.find_one(req=None, _id=item.get('rewrite_of'))

            # Skip items not linked to an Assignment/Coverage
            if not original_item.get('assignment_id'):
                continue

            delivery = delivery_service.find_one(req=None, item_id=original_item[config.ID_FIELD])
            if not delivery:
                raise SuperdeskApiError.badRequestError(
                    'Delivery record not found.'
                )

            planning = planning_service.find_one(req=None, _id=delivery.get('planning_id'))
            if not planning:
                raise SuperdeskApiError.badRequestError(
                    'Planning does not exist'
                )

            coverage = None
            coverages = planning.get('coverages') or []
            try:
                coverage = next(c for c in coverages if c.get('coverage_id') == delivery.get('coverage_id'))
            except StopIteration:
                raise SuperdeskApiError.badRequestError(
                    'Coverage does not exist'
                )

            # Link only if linking updates are enabled
            if (coverage.get('flags') or {}).get('no_content_linking'):
                return

            # get latest assignment available to link
            assignment_id = (coverage.get('assigned_to') or {}).get('assignment_id')
            for s in coverage.get('scheduled_updates'):
                if (s.get('assigned_to') or {}).get('state') in [ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                                                                 ASSIGNMENT_WORKFLOW_STATE.COMPLETED]:
                    assignment_id = (s.get('assigned_to') or {}).get('assignment_id')

            assignment = self.find_one(req=None, _id=str(assignment_id))
            if not assignment:
                raise SuperdeskApiError.badRequestError(
                    'Assignment not found.'
                )

            assignment_link_service.post([{
                'assignment_id': str(assignment[config.ID_FIELD]),
                'item_id': str(item[config.ID_FIELD]),
                'reassign': True
            }])

            doc['assignment_id'] = assignment['_id']

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

    def _get_assignment_from_archive_item(self, updates, original):
        if not original.get('assignment_id'):
            return None

        assignment_update_data = self._get_assignment_data_on_archive_update({}, original)
        if not assignment_update_data.get('assignment'):
            return None

        return assignment_update_data.get('assignment')

    def validate_assignment_lock(self, item, user_id):
        assignment = self._get_assignment_from_archive_item({}, item)
        if assignment and assignment.get('lock_user') and assignment.get('lock_action') != 'content_edit' and\
                (assignment['lock_session'] != get_auth()['_id'] or assignment['lock_user'] != user_id):
            raise SuperdeskApiError.badRequestError(message="Lock Failed: Related assignment is locked.")

    def sync_assignment_lock(self, item, user_id):
        # If more than one archive item is associated with the assignment
        # No need to lock assignment in case of a rewrite document
        assignment = self._get_assignment_from_archive_item({}, item)
        if assignment and (not item.get('rewrite_of') or get_resource_service('archive').find(
                where={'assignment_id': assignment[config.ID_FIELD]}).count() <= 1):
            lock_service = get_component(LockService)
            lock_service.lock(assignment, user_id, get_auth()['_id'], 'content_edit', 'assignments')

    def sync_assignment_unlock(self, item, user_id):
        assignment = self._get_assignment_from_archive_item({}, item)
        if assignment and assignment.get(LOCK_USER) and assignment.get(LOCK_ACTION) == 'content_edit':
            lock_service = get_component(LockService)
            lock_service.unlock(assignment, user_id, get_auth()['_id'], 'assignments')

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege('planning_planning_management'):
            return False, 'User does not have sufficient permissions.'
        return True, ''

    def is_associated_planning_or_event_locked(self, planning_item):
        associated_event = (planning_item or {}).get('event_item')
        if is_locked_in_this_session(planning_item):
            return True

        if not associated_event:
            return False

        event = get_resource_service('events').find_one(req=None, _id=associated_event)
        if not planning_item.get('recurrence_id'):
            return is_locked_in_this_session(event)
        else:
            lock_service = get_component(LockService)
            try:
                lock_service.validate_relationship_locks(event, 'events')
            except SuperdeskApiError:
                # Something along the relationship line is locked - allow remove
                return True

    def on_delete(self, doc):
        """
        Validate that we have a lock on the Assignment and it's associated Planning item
        """
        if doc.get('_to_delete') is True:
            # Already marked for delete - no validation needed (could be the background job)
            return

        # Also make sure the Planning item is locked by this user and session
        planning_service = get_resource_service('planning')
        planning_item = planning_service.find_one(req=None, _id=doc.get('planning_item'))

        # Make sure the Assignment is locked by this user and session unless when removing
        # assignments during spiking/unposting planning items
        if not is_locked_in_this_session(doc) and planning_item.get('state') not in [WORKFLOW_STATE.KILLED,
                                                                                     WORKFLOW_STATE.SPIKED]:
            raise SuperdeskApiError.forbiddenError(
                message='Lock is not obtained on the Assignment item'
            )

        # Make sure the content linked to assignment (if) is also not locked
        # This is needed when the planing item is being unposted/spiked
        archive_items = self.get_archive_items_for_assignment(doc)
        for archive_item in archive_items:
            if archive_item.get('lock_user') and not is_locked_in_this_session(archive_item):
                raise SuperdeskApiError.forbiddenError(message='Associated archive item is locked')

        # Make sure we cannot delete a completed Assignment
        # This should not be needed, as you cannot obtain a lock on an Assignment that is completed
        # But keeping it here for completeness
        if doc['assigned_to'].get('state') == ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
            raise SuperdeskApiError.badRequestError(
                message='Cannot delete a completed Assignment'
            )

    def archive_delete_assignment(self, doc):
        """
        Make sure to clean up the Archive, Delivery and Planning items by:

        * Remove 'assignment_id' from Archive item (if linked)
        * Delete the Delivery record associated with the Assignment & Archive items (if linked)
        * Removing 'assigned_to' dictionary from the associated Coverage
        """
        archive_service = get_resource_service('archive')
        delivery_service = get_resource_service('delivery')
        assignment_id = doc.get(config.ID_FIELD)

        # If we have a Content Item linked, then we need to remove the
        # assignment_id from it and remove the delivery record
        # Then send a notification that the content has been updated
        related_items = []
        archive_item = archive_service.find_one(req=None, assignment_id=assignment_id)
        if archive_item:
            related_items = get_related_items(archive_item, doc)
            for item in related_items:
                update_assignment_on_link_unlink(None, item)
                push_notification(
                    'assignments:removed',
                    item=item[config.ID_FIELD] if item else None,
                    session=get_auth().get('_id')
                )

            if len(related_items) > 0:
                # Push content nofitication so connected clients can update the
                # content views (i.e. removes the Calendar icon from Monitoring)
                push_content_notification(related_items)

            # Now delete all deliveries for that assignment
            delivery_service.delete_action(lookup={'assignment_id': ObjectId(assignment_id)})

    def on_deleted(self, doc):
        deleted_assignments = [doc.get(config.ID_FIELD)]
        planning_service = get_resource_service('planning')
        self.archive_delete_assignment(doc)
        marked_for_delete = False
        # Delete all assignments in that coverage
        assignments = list(get_resource_service('assignments').get_from_mongo(
            req=None, lookup={'coverage_item': doc['coverage_item']}))
        for a in assignments:
            if str(a['_id']) != str(doc['_id']):
                self.delete(lookup={'_id': a['_id']})
                self.archive_delete_assignment(a)
                deleted_assignments.append(a.get(config.ID_FIELD))
                if a.get('_to_delete'):
                    marked_for_delete = True

        # Remove assignment information from coverage
        updated_planning = planning_service.remove_assignment(doc)

        # Finally send a notification to connected clients that the Assignment
        # has been removed
        archive_item = get_resource_service('archive').find_one(req=None, assignment_id=doc.get(config.ID_FIELD))
        if updated_planning:
            push_notification(
                'assignments:removed',
                item=archive_item[config.ID_FIELD] if archive_item else None,
                assignments=deleted_assignments,
                planning=doc.get('planning_item'),
                coverage=doc.get('coverage_item'),
                planning_etag=updated_planning.get(config.ETAG),
                event_item=updated_planning.get('event_item'),
                session=get_auth().get('_id')
            )
        if not doc.get('_to_delete') or marked_for_delete:
            # publish planning
            self.publish_planning(doc.get('planning_item'))

    def is_assignment_draft(self, updates, original):
        return updates.get('assigned_to', original.get('assigned_to')).get('state') ==\
            ASSIGNMENT_WORKFLOW_STATE.DRAFT

    def is_assignment_being_activated(self, updates, original):
        return original.get('assigned_to').get('state') == ASSIGNMENT_WORKFLOW_STATE.DRAFT and\
            updates.get('assigned_to', {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED

    def is_text_assignment(self, assignment):
        # scheduled_update is always for text coverages
        if assignment.get('scheduled_update_id'):
            return True

        text_assignment = False
        content_types = get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')
        if content_types:
            content_type = [t for t in (content_types.get('items') or [])
                            if t.get('qcode') == assignment.get('planning', {}).get('g2_content_type')]
            if len(content_type) > 0:
                text_assignment = (content_type[0].get('content item type') or content_type[0].get('qcode')) == 'text'

        return text_assignment

    def publish_planning(self, planning_id):
        """Publish the planning item if assignment state changes for following actions

        - Work is started on Assignment
        - Assignment link using fullfill assignment
        - Un-linking the item from assignment
        - Complete an Assignment
        - Revert Availability of an assignment
        - Remove Assignment

        It uses the last published planning item from the published_planning collection
        to re-transmit the coverage/assignment changes.
        :param  planning_id: planning ID
        """
        try:
            planning_service = get_resource_service('planning')
            published_service = get_resource_service('published_planning')
            lock_service = get_component(LockService)

            planning_item = planning_service.find_one(req=None, _id=planning_id)
            published_planning_item = published_service.get_last_published_item(planning_id)

            if not planning_item or not published_planning_item \
                    or planning_item.get('state') == WORKFLOW_STATE.KILLED:
                return

            def _publish_planning(item):
                item.pop(config.VERSION, None)
                item.pop('item_id', None)
                version, item = get_version_item_for_post(item)

                # Create an entry in the planning versions collection for this published version
                version_id = get_resource_service('published_planning').post([{'item_id': item['_id'],
                                                                               'version': version,
                                                                               'type': 'planning',
                                                                               'published_item': item}])
                if version_id:
                    # Asynchronously enqueue the item for publishing.
                    enqueue_planning_item.apply_async(kwargs={'id': version_id[0]}, serializer="eve/json")
                else:
                    logger.error('Failed to save planning version for planning item id {}'.format(item['_id']))

            try:
                # check if the planning item is locked
                lock_service.validate_relationship_locks(planning_item, 'planning')
                use_published_planning = False
            except SuperdeskApiError as ex:
                # planning item is already locked.
                use_published_planning = True
                logger.exception(str(ex))

            if use_published_planning:
                # use the published planning and enqueue again
                plan = published_planning_item.get('published_item')
            else:
                plan = planning_item

            _publish_planning(plan)
        except Exception:
            logger.exception('Failed to publish assignment for planning.')

    def accept_assignment(self, assignment_id, assignee):
        """Mark an assignment as accepted

        Set the accept flag in the assignment to true, assuming the assignment is assigned and the assignee is the one
        accepting the assignment. The assignee could be either a Superdesk user or a Contact

        :param assignment_id:
        :param assignee:
        :return:
        """

        # Fetch the assignment to ensure that it exists and is in a state that it makes sense to flag as accepted
        original = self.find_one(req=None, _id=ObjectId(assignment_id))
        if not original:
            raise Exception('Accept Assignment unable to locate assignment {}'.format(assignment_id))

        if (original.get('assigned_to') or {}).get('state') != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            raise Exception('Assignment {} is not in assigned state'.format(assignment_id))

        # try to find a user that the assignment is being accepted by
        user_service = superdesk.get_resource_service('users')
        user = user_service.find_one(req=None, _id=ObjectId(assignee))
        if not user:
            # no user try to find a contact
            contact_service = superdesk.get_resource_service('contacts')
            contact = contact_service.find_one(req=None, _id=ObjectId(assignee))
            if contact:
                # make sure it is the assigned contact accepting the assignment
                if str(contact.get(config.ID_FIELD)) != str(original.get('assigned_to', {}).get('contact')):
                    raise Exception('Attempt to accept assignment by contact that it is not assigned to')
            else:
                raise Exception(
                    'Unknown User or Contact accepting assignment: {}, user/contact: {}'.format(
                        assignment_id,
                        assignee
                    )
                )
        else:
            # make sure that the assignment is still assigned to the user that is accepting the assignment
            if str(user.get(config.ID_FIELD)) != str(original.get('assigned_to', {}).get('user')):
                raise Exception('Attempt to accept assignment by user that it is not assigned to')

        # If the assignment has already been accepted bail out!
        if original.get('accepted', False):
            raise Exception('The assignment {} is already accepted'.format(assignment_id))

        update = {'accepted': True}

        # Set flag using system update, bypass locks, etag problems
        self.system_update(ObjectId(assignment_id), update, original)

        # update the history
        superdesk.get_resource_service('assignments_history').on_item_updated(
            update, original, ASSIGNMENT_HISTORY_ACTIONS.ACCEPTED)

        # send notification
        self.notify('assignments:accepted', update, original)

        self.send_acceptance_notification(original)


assignments_schema = {
    config.ID_FIELD: {
        'type': 'objectid',
        'nullable': False,
    },
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
    'scheduled_update_id': {
        'type': 'string',
        'mapping': not_analyzed
    },
    'lock_user': metadata_schema['lock_user'],
    'lock_time': metadata_schema['lock_time'],
    'lock_session': metadata_schema['lock_session'],
    'lock_action': metadata_schema['lock_action'],

    'assigned_to': {
        'type': 'dict',
        'schema': {
            'desk': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'user': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
            'contact': {'type': 'string', 'nullable': True, 'mapping': not_analyzed},
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
                    'name': {'type': 'string'},
                    'contact_type': {'type': 'string'}
                },
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed,
                        'contact_type': not_analyzed
                    }
                }
            }
        }
    },

    # coverage details
    'planning': deepcopy(coverage_schema['planning']),
    'description_text': metadata_schema['description_text'],
    'name': planning_schema['name'],

    # Field to mark assignment for deletion if a delete operation fails
    '_to_delete': {'type': 'boolean'},

    # Flag that indicates the assignment has been accepted
    'accepted': {'type': 'boolean', 'default': False}
}
assignments_schema['planning']['schema'][TO_BE_CONFIRMED_FIELD] = TO_BE_CONFIRMED_FIELD_SCHEMA


class AssignmentsResource(superdesk.Resource):
    url = 'assignments'
    item_url = item_url
    schema = assignments_schema
    resource_methods = ['GET']
    item_methods = ['GET', 'PATCH', 'DELETE']
    privileges = {'PATCH': 'archive',
                  'DELETE': 'planning_planning_management'}

    mongo_indexes = {
        'coverage_item_1': ([('coverage_item', 1)], {'background': True}),
        'planning_item_1': ([('planning_item', 1)], {'background': True}),
        'published_state_1': ([('published_state', 1)], {'background': True}),
    }

    datasource = {
        'source': 'assignments',
        'search_backend': 'elastic'
    }

    etag_ignore_fields = ['planning', 'published_state', 'published_at']

    merge_nested_documents = True
