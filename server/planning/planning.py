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
import superdesk
import logging
from flask import json
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid, item_url
from superdesk.metadata.item import GUID_NEWSML, metadata_schema
from superdesk import get_resource_service
from superdesk.resource import not_analyzed
from superdesk.users.services import current_user_has_privilege
from superdesk.resource import build_custom_hateoas
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator, get_user, get_auth
from copy import deepcopy
from eve.utils import config, ParsedRequest
from .common import WORKFLOW_STATE_SCHEMA, PUBLISHED_STATE_SCHEMA
from superdesk.utc import utcnow
from itertools import chain


logger = logging.getLogger(__name__)


class PlanningService(superdesk.Service):
    """Service class for the planning model."""

    def __generate_related_coverages(self, planning):
        custom_coverage_hateoas = {'self': {'title': 'Coverage', 'href': '/coverage/{_id}'}}
        for coverage in get_resource_service('coverage').find(where={'planning_item': planning.get(config.ID_FIELD)}):
            build_custom_hateoas(custom_coverage_hateoas, coverage)
            yield coverage

    def get(self, req, lookup):
        docs = super().get(req, lookup)
        # nest coverages
        for doc in docs:
            doc['coverages'] = list(self.__generate_related_coverages(doc))
        return docs

    def on_fetched_item(self, doc):
        doc['coverages'] = list(self.__generate_related_coverages(doc))

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            if 'guid' not in doc:
                doc['guid'] = generate_guid(type=GUID_NEWSML)
            doc[config.ID_FIELD] = doc['guid']
            set_original_creator(doc)
            self._set_planning_event_info(doc)

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
        item['coverages'] = list(self.__generate_related_coverages(item))

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

    def _set_planning_event_info(self, doc):
        """Set the planning event date

        :param dict doc: planning document
        """

        doc['_planning_date'] = utcnow()

        event_id = doc.get('event_item')
        event = {}
        if event_id:
            event = get_resource_service('events').find_one(req=None, _id=event_id)
            if event:
                doc['_planning_date'] = event.get('dates', {}).get('start')
                if event.get('recurrence_id'):
                    doc['recurrence_id'] = event.get('recurrence_id')

        doc['_coverages'] = [
            {
                'coverage_id': 'NO_COVERAGE',
                'scheduled': doc['_planning_date'],
                'g2_content_type': None
            }
        ]

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

    def sync_coverages(self, docs):
        """Sync the coverage information between planning an coverages

        :param list docs: list of coverage docs
        """
        if not docs:
            return
        ids = set([doc.get('planning_item') for doc in docs])
        service = get_resource_service('coverage')
        for planning_id in ids:
            planning = self.find_one(req=None, _id=planning_id)
            coverages = list(service.get_from_mongo(req=None, lookup={'planning_item': planning_id}))
            updates = []
            add_default_coverage = True
            for doc in coverages:
                if doc.get('planning', {}).get('scheduled'):
                    add_default_coverage = False
                updates.append({
                    'coverage_id': doc.get(config.ID_FIELD),
                    'scheduled': doc.get('planning', {}).get('scheduled'),
                    'g2_content_type': doc.get('planning', {}).get('g2_content_type')
                })

            if add_default_coverage:
                updates.append({
                    'coverage_id': None,
                    'scheduled': planning.get('_planning_date') or utcnow(),
                    'g2_content_type': None
                })

            self.system_update(planning_id, {'_coverages': updates}, planning)


event_type = deepcopy(superdesk.Resource.rel('events', type='string'))
event_type['mapping'] = not_analyzed

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
    # field to sync coverage information on planning
    # to be used for sorting/filtering on scheduled
    '_coverages': {
        'type': 'list',
        'mapping': {
            'type': 'nested',
            'properties': {
                'coverage_id': not_analyzed,
                'scheduled': {'type': 'date'},
                'g2_content_type': not_analyzed
            }
        }
    },
    # date to hold the event date when planning item is created from event or _created
    '_planning_date': {
        'type': 'datetime',
        'nullable': True
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
    'revert_state': metadata_schema['revert_state']
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
    etag_ignore_fields = ['_coverages', '_planning_date']

    mongo_indexes = {'event_item': ([('event_item', 1)], {'background': True})}
