# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning"""
from bson import ObjectId

import superdesk
import logging
from flask import json, current_app as app
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid, item_url
from superdesk.metadata.item import GUID_NEWSML, metadata_schema, ITEM_TYPE
from superdesk import get_resource_service
from superdesk.resource import not_analyzed
from superdesk.users.services import current_user_has_privilege
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator, get_user, get_auth
from copy import deepcopy
from eve.utils import config, ParsedRequest
from planning.common import WORKFLOW_STATE_SCHEMA, PUBLISHED_STATE_SCHEMA, get_coverage_cancellation_state,\
    remove_lock_information, WORKFLOW_STATE, ASSIGNMENT_WORKFLOW_STATE, update_published_item
from superdesk.utc import utcnow
from itertools import chain
from planning.planning_notifications import PlanningNotifications
from superdesk.utc import utc_to_local

logger = logging.getLogger(__name__)


class PlanningService(superdesk.Service):
    """Service class for the planning model."""

    def __generate_related_assignments(self, docs):
        coverages = {}
        for doc in docs:
            if not doc.get('coverages'):
                doc['coverages'] = []

            for cov in (doc.get('coverages') or []):
                coverages[cov.get('coverage_id')] = cov

            doc.pop('_planning_schedule', None)

        if not coverages:
            return

        ids = list(coverages.keys())

        assignments = list(get_resource_service('assignments').get_from_mongo(req=None,
                                                                              lookup={
                                                                                  'coverage_item': {'$in': ids}
                                                                              }))

        coverage_assignment = {assign.get('coverage_item'): assign for assign in assignments}

        for coverage_id, coverage in coverages.items():
            if not coverage.get('assigned_to'):
                coverage['assigned_to'] = {}
            if coverage_assignment.get(coverage_id):
                assignment = coverage_assignment.get(coverage_id)
                coverage['assigned_to']['desk'] = assignment.get('assigned_to', {}).get('desk')
                coverage['assigned_to']['user'] = assignment.get('assigned_to', {}).get('user')
                coverage['assigned_to']['state'] = assignment.get('assigned_to', {}).get('state')
                coverage['assigned_to']['assignor_user'] = assignment.get('assigned_to', {}).get('assignor_user')
                coverage['assigned_to']['assignor_desk'] = assignment.get('assigned_to', {}).get('assignor_desk')
                coverage['assigned_to']['assigned_date_desk'] = \
                    assignment.get('assigned_to', {}).get('assigned_date_desk')
                coverage['assigned_to']['assigned_date_user'] = \
                    assignment.get('assigned_to', {}).get('assigned_date_user')
                coverage['assigned_to']['coverage_provider'] = \
                    assignment.get('assigned_to', {}).get('coverage_provider')

    def on_fetched(self, docs):
        self.__generate_related_assignments(docs.get(config.ITEMS))

    def on_fetched_item(self, doc):
        self.__generate_related_assignments([doc])

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            if 'guid' not in doc:
                doc['guid'] = generate_guid(type=GUID_NEWSML)
            doc[config.ID_FIELD] = doc['guid']
            set_original_creator(doc)
            self._set_planning_event_info(doc)
            self._set_coverage(doc)
            self.set_planning_schedule(doc)

    def on_created(self, docs):
        session_id = get_auth().get('_id')
        for doc in docs:
            push_notification(
                'planning:created',
                item=str(doc.get(config.ID_FIELD)),
                user=str(doc.get('original_creator', '')),
                added_agendas=doc.get('agendas') or [],
                removed_agendas=[],
                session=session_id,
                event_item=doc.get('event_item', None)
            )
            self._update_event_history(doc)
        self.__generate_related_assignments(docs)

    def _update_event_history(self, doc):
        if 'event_item' not in doc:
            return
        events_service = get_resource_service('events')
        original_event = events_service.find_one(req=None, _id=doc['event_item'])

        events_service.system_update(
            doc['event_item'],
            {'expiry': None},
            original_event
        )

        get_resource_service('events_history').on_item_updated(
            {'planning_id': doc.get('_id')},
            original_event,
            'planning created'
        )

    def on_duplicated(self, doc, parent_id):
        self._update_event_history(doc)
        session_id = get_auth().get('_id')
        push_notification(
            'planning:duplicated',
            item=str(doc.get(config.ID_FIELD)),
            original=str(parent_id),
            user=str(doc.get('original_creator', '')),
            added_agendas=doc.get('agendas') or [],
            removed_agendas=[],
            session=session_id
        )

    def on_locked_planning(self, item, user_id):
        self.__generate_related_assignments([item])

    def update(self, id, updates, original):
        item = self.backend.update(self.datasource, id, updates, original)
        return item

    def on_update(self, updates, original):
        user = get_user()
        lock_user = original.get('lock_user', None)
        str_user_id = str(user.get(config.ID_FIELD)) if user else None

        if lock_user and str(lock_user) != str_user_id:
            raise SuperdeskApiError.forbiddenError('The item was locked by another user')

        if user and user.get(config.ID_FIELD):
            updates['version_creator'] = user[config.ID_FIELD]

        self._set_coverage(updates, original)
        self.set_planning_schedule(updates, original)

    def _set_planning_event_info(self, doc):
        """Set the planning event date

        :param dict doc: planning document
        """

        event_id = doc.get('event_item')
        event = {}
        if event_id:
            event = get_resource_service('events').find_one(req=None, _id=event_id)
            if event:
                if event.get('recurrence_id'):
                    doc['recurrence_id'] = event.get('recurrence_id')

    def _get_added_removed_agendas(self, updates, original):
        added_agendas = updates.get('agendas') or []
        existing_agendas = original.get('agendas') or []
        removed_agendas = list(set(existing_agendas) - set(added_agendas))
        return added_agendas, removed_agendas

    def on_updated(self, updates, original):
        added, removed = self._get_added_removed_agendas(updates, original)
        session_id = get_auth().get('_id')
        push_notification(
            'planning:updated',
            item=str(original[config.ID_FIELD]),
            user=str(updates.get('version_creator', '')),
            added_agendas=added, removed_agendas=removed,
            session=session_id
        )
        doc = deepcopy(original)
        doc.update(updates)
        self.__generate_related_assignments([doc])
        updates['coverages'] = doc.get('coverages') or []

        update_published_item(updates, original)

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege('planning_planning_management'):
            return False, 'User does not have sufficient permissions.'
        return True, ''

    def get_planning_by_agenda_id(self, agenda_id):
        """Get the planing item by Agenda

        :param dict agenda_id: Agenda _id
        :return list: list of planing items
        """
        query = {
            'query': {
                'bool': {'must': {'term': {'agendas': str(agenda_id)}}}
            }
        }
        req = ParsedRequest()
        req.args = {'source': json.dumps(query)}
        return super().get(req=req, lookup=None)

    def get_all_items_in_relationship(self, item):
        all_items = []
        if item.get('event_item'):
            if item.get('recurrence_id'):
                event_param = {
                    '_id': item.get('event_item'),
                    'recurrence_id': item.get('recurrence_id')
                }
                # One call wil get all items in the recurring series from event service
                return get_resource_service('events').get_all_items_in_relationship(event_param)
            else:
                event_param = {'_id': item.get('event_item')}
                # Get associated event
                all_items = get_resource_service('events').find(where={'_id': item.get('event_item')})
                # Get all associated planning items
                return chain(all_items, get_resource_service('events').get_plannings_for_event(event_param))
        else:
            return all_items

    def _set_coverage(self, updates, original=None):
        if not updates.get('coverages'):
            return

        if not original:
            original = {}

        for coverage in original.get('coverages') or []:
            updated_coverage = next((cov for cov in updates.get('coverages') or []
                                     if cov.get('coverage_id') == coverage.get('coverage_id')), None)

            if not updated_coverage and (coverage.get('assigned_to') or {}).get('assignment_id'):
                raise SuperdeskApiError.badRequestError('Assignment already exists. Coverage cannot be deleted.')

        for coverage in (updates.get('coverages') or []):
            original_coverage = None
            coverage_id = coverage.get('coverage_id')
            if not coverage_id:
                # coverage to be created
                coverage['coverage_id'] = generate_guid(type=GUID_NEWSML)
                coverage['firstcreated'] = utcnow()
                set_original_creator(coverage)
            else:
                original_coverage = next((cov for cov in original.get('coverages') or []
                                          if cov['coverage_id'] == coverage_id), None)
                if not original_coverage:
                    continue

                if coverage != original_coverage:
                    user = get_user()
                    coverage['version_creator'] = str(user.get(config.ID_FIELD)) if user else None
                    coverage['versioncreated'] = utcnow()
                    # If the internal note has changed send a notification, except if it's been cancelled
                    if coverage.get('planning', {}).get('internal_note', '') != original_coverage.get('planning',
                                                                                                      {}).get(
                        'internal_note', '') \
                            and coverage.get('news_coverage_status', {}).get('qcode') != 'ncostat:notint':
                        message = '{{coverage_type}} coverage \"slugline\": {{internal_note}}'
                        target_user = coverage.get('assigned_to', original_coverage.get('assigned_to', {})).get('user',
                                                                                                                None)
                        target_desk = coverage.get('assigned_to', original_coverage.get('assigned_to', {})).get('desk',
                                                                                                                None)
                        PlanningNotifications().notify_assignment(
                            coverage_status=coverage.get('workflow_status'),
                            target_desk=target_desk if target_user is None else None,
                            target_user=target_user,
                            message=message,
                            coverage_type=coverage.get('planning', {}).get('g2_content_type', ''),
                            slugline=coverage.get('planning', {}).get('slugline', ''),
                            internal_note=coverage.get('planning', {}).get('internal_note', ''))
                    # If the scheduled time for the coverage changes
                    if coverage.get('planning', {}).get('scheduled', '') != original_coverage.get('planning', {}).get(
                            'scheduled', ''):
                        message = 'Due time has been amended to {{due}} for {{coverage_type}} coverage \"{{slugline}}\"'
                        target_user = coverage.get('assigned_to', original_coverage.get('assigned_to', {})).get('user',
                                                                                                                None)
                        target_desk = coverage.get('assigned_to', original_coverage.get('assigned_to', {})).get('desk',
                                                                                                                None)
                        PlanningNotifications().notify_assignment(
                            coverage_status=coverage.get('workflow_status'),
                            target_desk=target_desk if target_user is None else None,
                            target_user=target_user,
                            message=message,
                            due=utc_to_local(app.config['DEFAULT_TIMEZONE'],
                                             coverage.get('planning', {}).get('scheduled')).strftime('%c'),
                            coverage_type=coverage.get('planning', {}).get('g2_content_type', ''),
                            slugline=coverage.get('planning', {}).get('slugline', ''))

            self._create_update_assignment(original.get(config.ID_FIELD), coverage, original_coverage)

    def set_planning_schedule(self, updates, original=None):
        """This set the list of schedule based on the coverage and planning.

        Sorting currently works on two fields "planning_date" and "scheduled" date.
        "planning_date" is stored on the planning and is equal to event start date for planning items
        created from event or current date for adhoc planning item
        "scheduled" is stored on the coverage nested document and it is optional.
        Hence to sort and filter planning based on these two dates a
        nested documents of scheduled date is required

        :param dict updates: planning update document
        :param dict original: planning original document
        """

        coverages = updates.get('coverages') or (original or {}).get('coverages') or []
        planning_date = updates.get('planning_date') or (original or {}).get('planning_date') or utcnow()

        add_default_schedule = True
        schedule = []
        for coverage in coverages:
            if coverage.get('planning', {}).get('scheduled'):
                add_default_schedule = False

            schedule.append({
                'coverage_id': coverage.get('coverage_id'),
                'scheduled': coverage.get('planning', {}).get('scheduled')
            })

        if add_default_schedule:
            schedule.append({
                'coverage_id': None,
                'scheduled': planning_date or utcnow()
            })

        updates['_planning_schedule'] = schedule

    def _create_update_assignment(self, planning_id, updates, original=None):
        """Create or update the assignment.

        :param str planning_id: planning id of the coverage
        :param dict updates: coverage update document
        :param dict original: coverage original document
        """
        if not original:
            original = {}

        doc = deepcopy(original)
        doc.update(updates)
        assignment_service = get_resource_service('assignments')
        assigned_to = updates.get('assigned_to') or original.get('assigned_to')
        if not assigned_to:
            return

        if not planning_id:
            raise SuperdeskApiError.badRequestError('Planning item is required to create assignments.')

        # Coverage is draft if original was draft and updates is still maintaining that state
        is_coverage_draft = updates.get('workflow_status',
                                        original.get('workflow_status')) == WORKFLOW_STATE.DRAFT

        if not assigned_to.get('assignment_id') and (assigned_to.get('user') or assigned_to.get('desk')):
            # Creating a new assignment
            assign_state = ASSIGNMENT_WORKFLOW_STATE.DRAFT if is_coverage_draft else ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
            if not is_coverage_draft:
                # In case of article_rewrites, this will be 'in_progress' directly
                if assigned_to.get('state') and assigned_to['state'] != ASSIGNMENT_WORKFLOW_STATE.DRAFT:
                    assign_state = assigned_to.get('state')

            assignment = {
                'assigned_to': {
                    'user': assigned_to.get('user'),
                    'desk': assigned_to.get('desk'),
                    'state': assign_state
                },
                'planning_item': planning_id,
                'coverage_item': doc.get('coverage_id'),
                'planning': doc.get('planning'),
                'priority': assigned_to.get('priority'),
            }
            if 'coverage_provider' in assigned_to:
                assignment['assigned_to']['coverage_provider'] = assigned_to.get('coverage_provider')

            assignment_id = assignment_service.post([assignment])
            updates['assigned_to']['assignment_id'] = str(assignment_id[0])
            updates['assigned_to']['state'] = assign_state
        elif assigned_to.get('assignment_id'):
            # update the assignment using the coverage details

            original_assignment = assignment_service.find_one(req=None,
                                                              _id=assigned_to.get('assignment_id'))

            if not original:
                raise SuperdeskApiError.badRequestError(
                    'Assignment related to the coverage does not exists.')

            # Check if coverage was cancelled
            coverage_cancel_state = get_coverage_cancellation_state()
            if updates.get('news_coverage_status') and \
                    updates.get('news_coverage_status').get('qcode') == coverage_cancel_state.get('qcode') and \
                    original.get('news_coverage_status').get('qcode') != coverage_cancel_state.get('qcode'):
                self.cancel_coverage(updates, coverage_cancel_state, original_assignment)
                return

            assignment = {}
            if self.is_coverage_planning_modified(updates, original):
                assignment['planning'] = doc.get('planning')

            if self.is_coverage_assignment_modified(updates, original_assignment):
                assignment['assigned_to'] = assigned_to

            # If we made a coverage 'active' - change assignment status to active
            if original.get('workflow_status') == WORKFLOW_STATE.DRAFT and not is_coverage_draft:
                assigned_to['state'] = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
                assignment['assigned_to'] = assigned_to

            # Update only if anything got modified
            if 'planning' in assignment or 'assigned_to' in assignment:
                assignment_service.system_update(ObjectId(assigned_to.get('assignment_id')),
                                                 assignment, original_assignment)

        (updates.get('assigned_to') or {}).pop('user', None)
        (updates.get('assigned_to') or {}).pop('desk', None)
        (updates.get('assigned_to') or {}).pop('coverage_provider', None)
        (updates.get('assigned_to') or {}).pop('state', None)

    def cancel_coverage(self, coverage, coverage_cancel_state, assignment=None, note=None,
                        reason=None, event_cancellation=False):
        if reason:
            note += 'Reason: {}\n'.format(reason)

        if note:
            if not coverage.get('planning'):
                coverage['planning'] = {}
            coverage['planning']['internal_note'] = (coverage['planning'].get('internal_note') or '') + '\n\n' + note

        coverage['news_coverage_status'] = coverage_cancel_state
        coverage['workflow_status'] = WORKFLOW_STATE.CANCELLED

        # Cancel assignment if the coverage has an assignment
        if coverage.get('assigned_to'):
            assignment_service = get_resource_service('assignments')
            if not assignment:
                assignment = assignment_service.find_one(req=None, _id=coverage['assigned_to'].get('assignment_id'))

            if assignment:
                assignment_service.cancel_assignment(assignment, coverage, event_cancellation)

            coverage.pop('assigned_to', None)

    def duplicate_coverage_for_article_rewrite(self, planning_id, coverage_id, updates):
        planning = self.find_one(req=None, _id=planning_id)

        if not planning:
            raise SuperdeskApiError.badRequestError(
                'Planning does not exist'
            )

        coverages = planning.get('coverages') or []
        try:
            coverage = next(c for c in coverages if c.get('coverage_id') == coverage_id)
        except StopIteration:
            raise SuperdeskApiError.badRequestError(
                'Coverage does not exist'
            )

        coverage_planning = coverage.get('planning') or {}
        updates_planning = updates.get('planning') or {}
        coverages.append({
            'planning': {
                'g2_content_type': updates_planning.get('g2_content_type') or coverage_planning.get('g2_content_type'),
                'slugline': updates_planning.get('slugline') or coverage_planning.get('slugline'),
                'scheduled': updates_planning.get('scheduled') or coverage_planning.get('scheduled'),
            },
            'news_coverage_status': updates.get('news_coverage_status') or coverage.get('news_coverage_status'),
            'workflow_status': WORKFLOW_STATE.ACTIVE,
            'assigned_to': updates.get('assigned_to') or coverage.get('assigned_to')
        })

        coverage_ids = [c['coverage_id'] for c in coverages if c.get('coverage_id')]
        new_plan = self.patch(planning[config.ID_FIELD], {'coverages': coverages})

        try:
            new_coverage = next(c for c in new_plan['coverages'] if c.get('coverage_id') not in coverage_ids)
        except StopIteration:
            raise SuperdeskApiError.badRequestError(
                'New coverage was not found!'
            )

        planning.update(new_plan)
        return planning, new_coverage

    def remove_assignment(self, assignment_item, unlock_planning=False):
        coverage_id = assignment_item.get('coverage_item')
        planning_item = self.find_one(req=None, _id=assignment_item.get('planning_item'))

        if planning_item:
            coverages = planning_item.get('coverages') or []
            try:
                coverage_item = next(c for c in coverages if c.get('coverage_id') == coverage_id)
            except StopIteration:
                raise SuperdeskApiError.badRequestError(
                    'Coverage does not exist'
                )

            coverage_item['assigned_to'] = None

            updates = {'coverages': coverages}
            if unlock_planning:
                remove_lock_information(updates)

            return self.update(
                planning_item[config.ID_FIELD],
                updates,
                planning_item
            )

    def is_coverage_planning_modified(self, updates, original):
        for key in updates.get('planning').keys():
            if key in updates and not key.startswith('_') and \
                    updates.get('planning')[key] != original.get('planning').get(key):
                return True

        return False

    def is_coverage_assignment_modified(self, updates, original):
        keys = ['desk', 'user', 'state']
        for key in keys:
            if key in updates['assigned_to'] and\
                    updates['assigned_to'][key] != original['assigned_to'].get(key):
                return True

        return False


event_type = deepcopy(superdesk.Resource.rel('events', type='string'))
event_type['mapping'] = not_analyzed

coverage_schema = {
    # Identifiers
    'coverage_id': {
        'type': 'string',
        'mapping': not_analyzed
    },
    'guid': metadata_schema['guid'],

    # Audit Information
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # News Coverage Details
    # See IPTC-G2-Implementation_Guide 16.4
    'planning': {
        'type': 'dict',
        'schema': {
            'ednote': metadata_schema['ednote'],
            'g2_content_type': {'type': 'string', 'mapping': not_analyzed},
            'coverage_provider': {'type': 'string', 'mapping': not_analyzed},
            'item_class': {'type': 'string', 'mapping': not_analyzed},
            'item_count': {'type': 'string', 'mapping': not_analyzed},
            'scheduled': {'type': 'datetime'},
            'service': {
                'type': 'list',
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed
                    }
                }
            },
            'news_content_characteristics': {
                'type': 'list',
                'mapping': {
                    'properties': {
                        'name': not_analyzed,
                        'value': not_analyzed
                    }
                }
            },
            'planning_ext_property': {
                'type': 'list',
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'value': not_analyzed,
                        'name': not_analyzed
                    }
                }
            },
            # Metadata hints.  See IPTC-G2-Implementation_Guide 16.5.1.1
            'by': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'credit_line': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'dateline': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'description_text': metadata_schema['description_text'],
            'genre': metadata_schema['genre'],
            'headline': metadata_schema['headline'],
            'keyword': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'language': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'slugline': metadata_schema['slugline'],
            'subject': metadata_schema['subject'],
            'internal_note': {
                'type': 'string'
            }
        }  # end planning dict schema
    },  # end planning

    'news_coverage_status': {
        'type': 'dict',
        'schema': {
            'qcode': {'type': 'string'},
            'name': {'type': 'string'},
            'label': {'type': 'string'}
        }
    },
    'workflow_status': {'type': 'string'},
    'assigned_to': {
        'type': 'dict',
        'mapping': {
            'type': 'object',
            'properties': {
                'assignment_id': not_analyzed,
                'state': not_analyzed
            }
        }
    },

}  # end coverage_schema

planning_schema = {
    # Identifiers
    config.ID_FIELD: metadata_schema[config.ID_FIELD],
    'guid': metadata_schema['guid'],

    # Audit Information
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # Agenda Item details
    'agendas': {
        'type': 'list',
        'schema': superdesk.Resource.rel('agenda'),
        'mapping': not_analyzed
    },

    # Event Item
    'event_item': event_type,

    'recurrence_id': {
        'type': 'string',
        'mapping': not_analyzed,
        'nullable': True,
    },

    # Planning Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 16

    # Planning Item Metadata - See IPTC-G2-Implementation_Guide 16.1
    'item_class': {
        'type': 'string',
        'default': 'plinat:newscoverage'
    },
    'ednote': metadata_schema['ednote'],
    'description_text': metadata_schema['description_text'],
    'internal_note': {
        'type': 'string',
        'nullable': True
    },
    'anpa_category': metadata_schema['anpa_category'],
    'subject': metadata_schema['subject'],
    'genre': metadata_schema['genre'],
    'company_codes': metadata_schema['company_codes'],

    # Content Metadata - See IPTC-G2-Implementation_Guide 16.2
    'language': metadata_schema['language'],
    'abstract': metadata_schema['abstract'],
    'headline': metadata_schema['headline'],
    'slugline': metadata_schema['slugline'],
    'keywords': metadata_schema['keywords'],
    'word_count': metadata_schema['word_count'],
    'priority': metadata_schema['priority'],
    'urgency': metadata_schema['urgency'],
    'profile': metadata_schema['profile'],

    # These next two are for spiking/unspiking and purging of planning/agenda items
    'state': WORKFLOW_STATE_SCHEMA,
    'expiry': {
        'type': 'datetime',
        'nullable': True
    },

    'lock_user': metadata_schema['lock_user'],
    'lock_time': metadata_schema['lock_time'],
    'lock_session': metadata_schema['lock_session'],
    'lock_action': metadata_schema['lock_action'],

    'coverages': {
        'type': 'list',
        'default': [],
        'schema': {
            'type': 'dict',
            'schema': coverage_schema
        },
        'mapping': {
            'type': 'nested',
            'properties': {
                'coverage_id': not_analyzed,
                'planning': {
                    'type': 'object',
                    'properties': {
                        'slugline': {
                            'type': 'string',
                            'fields': {
                                'phrase': {
                                    'type': 'string',
                                    'analyzer': 'phrase_prefix_analyzer',
                                    'search_analyzer': 'phrase_prefix_analyzer'
                                }
                            }
                        },

                    }
                },
                'assigned_to': {
                    'type': 'object',
                    'properties': {
                        'assignment_id': not_analyzed,
                        'state': not_analyzed
                    }
                }
            }
        }
    },
    # field to sync coverage scheduled information
    # to be used for sorting/filtering on scheduled
    '_planning_schedule': {
        'type': 'list',
        'mapping': {
            'type': 'nested',
            'properties': {
                'coverage_id': not_analyzed,
                'scheduled': {'type': 'date'},
            }
        }
    },

    'planning_date': {
        'type': 'datetime',
        "nullable": False,
    },

    'flags': {
        'type': 'dict',
        'schema': {
            'marked_for_not_publication':
                metadata_schema['flags']['schema']['marked_for_not_publication']
        }
    },

    # Public/Published status
    'pubstatus': PUBLISHED_STATE_SCHEMA,

    # The previous state the item was in before for example being spiked,
    # when un-spiked it will revert to this state
    'revert_state': metadata_schema['revert_state'],

    # Item type used by superdesk publishing
    ITEM_TYPE: {
        'type': 'string',
        'mapping': not_analyzed,
        'default': 'planning',
    },

    # Identifier used to synchronise the published planning item with an external system.
    'unique_id': {
        'type': 'string',
        'mapping': not_analyzed
    },

    'place': metadata_schema['place'],
}  # end planning_schema


class PlanningResource(superdesk.Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    url = 'planning'
    item_url = item_url
    schema = planning_schema
    datasource = {
        'source': 'planning',
        'search_backend': 'elastic',
    }
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning_planning_management',
                  'PATCH': 'planning_planning_management',
                  'DELETE': 'planning'}
    etag_ignore_fields = ['_planning_schedule']

    mongo_indexes = {'event_item': ([('event_item', 1)], {'background': True})}
