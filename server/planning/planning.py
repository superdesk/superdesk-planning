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
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.users.services import current_user_has_privilege
from superdesk.resource import build_custom_hateoas
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator, get_user
from copy import deepcopy
from eve.utils import config, ParsedRequest
from .common import STATE_SCHEMA
from superdesk.utc import utcnow
from bson.objectid import ObjectId

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


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
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            set_original_creator(doc)

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'planning:created',
                item=str(doc.get(config.ID_FIELD)),
                user=str(doc.get('original_creator', ''))
            )

            # Create a place holder coverage item
            coverage = {'planning_item': ObjectId(doc.get(config.ID_FIELD))}
            coverage_status = get_resource_service('vocabularies').find_one(req=None, _id='newscoveragestatus')
            if coverage_status is not None:
                coverage['news_coverage_status'] = \
                    [x for x in coverage_status.get('items', []) if x['qcode'] == 'ncostat:notdec'][0]
                coverage['news_coverage_status'].pop('is_active')

            # remove event expiry if it is linked to the planning
            if 'event_item' in doc:
                events_service = get_resource_service('events')
                original_event = events_service.find_one(req=None, _id=doc['event_item'])
                events_service.system_update(doc['event_item'], {'expiry': None}, original_event)
                get_resource_service('events_history').on_item_updated({'planning_id': doc.get('_id')}, original_event,
                                                                       'planning created')
                # if the planning item is related to an event the default coverage schedule time is inherited from the
                # event else it is set to now
                coverage['planning'] = {'scheduled': original_event.get('dates', {}).get('start', None)}
            else:
                coverage['planning'] = {'scheduled': utcnow()}

            # Copy metadata from the planning item to the coverage
            coverage['planning']['headline'] = doc.get('headline', '')

            get_resource_service('coverage').post([coverage])
            get_resource_service('coverage_history').on_item_created([coverage])

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

    def on_updated(self, updates, original):
        push_notification(
            'planning:updated',
            item=str(original[config.ID_FIELD]),
            user=str(updates.get('version_creator', ''))
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


event_type = deepcopy(superdesk.Resource.rel('events', type='string'))
event_type['mapping'] = not_analyzed

planning_schema = {
    # Identifiers
    'guid': {
        'type': 'string',
        'unique': True,
        'mapping': not_analyzed
    },
    'unique_id': {
        'type': 'integer',
        'unique': True,
    },
    'unique_name': {
        'type': 'string',
        'unique': True,
        'mapping': not_analyzed
    },
    'version': {
        'type': 'integer'
    },
    'ingest_id': {
        'type': 'string',
        'mapping': not_analyzed
    },

    # Audit Information
    'original_creator': superdesk.Resource.rel('users'),
    'version_creator': superdesk.Resource.rel('users'),
    'firstcreated': {
        'type': 'datetime'
    },
    'versioncreated': {
        'type': 'datetime'
    },

    # Ingest Details
    'ingest_provider': superdesk.Resource.rel('ingest_providers'),
    'source': {     # The value is copied from the ingest_providers vocabulary
        'type': 'string',
        'mapping': not_analyzed
    },
    'original_source': {    # This value is extracted from the ingest
        'type': 'string',
        'mapping': not_analyzed
    },
    'ingest_provider_sequence': {
        'type': 'string',
        'mapping': not_analyzed
    },

    # Agenda Item details
    'agendas': {
        'type': 'list',
        'schema': superdesk.Resource.rel('agenda'),
        'mapping': not_analyzed
    },

    # Event Item
    'event_item': event_type,

    # Planning Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 16

    # Planning Item Metadata - See IPTC-G2-Implementation_Guide 16.1
    'item_class': {
        'type': 'string',
        'default': 'plinat:newscoverage'
    },
    'ednote': {
        'type': 'string',
        'nullable': True,
    },
    'description_text': {
        'type': 'string',
        'nullable': True
    },
    'anpa_category': {
        'type': 'list',
        'nullable': True,
        'mapping': {
            'type': 'object',
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed,
            }
        }
    },
    'subject': {
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'genre': {
        'type': 'list',
        'nullable': True,
        'mapping': {
            'type': 'object',
            'properties': {
                'name': not_analyzed,
                'qcode': not_analyzed
            }
        }
    },
    'company_codes': {
        'type': 'list',
        'mapping': {
            'type': 'object',
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed,
                'security_exchange': not_analyzed
            }
        }
    },

    # Content Metadata - See IPTC-G2-Implementation_Guide 16.2
    'language': {
        'type': 'string',
        'mapping': not_analyzed,
        'nullable': True,
    },
    'abstract': {
        'type': 'string',
        'nullable': True,
    },
    'headline': {
        'type': 'string'
    },
    'slugline': {
        'type': 'string',
        'mapping': {
            'type': 'string',
            'fields': {
                'phrase': {
                    'type': 'string',
                    'analyzer': 'phrase_prefix_analyzer',
                    'search_analyzer': 'phrase_prefix_analyzer'
                }
            }
        }
    },
    'keywords': {
        'type': 'list',
        'mapping': {
            'type': 'string'
        }
    },
    'word_count': {
        'type': 'integer'
    },
    'priority': {
        'type': 'integer',
        'nullable': True
    },
    'urgency': {
        'type': 'integer',
        'nullable': True
    },
    'profile': {
        'type': 'string',
        'nullable': True
    },

    # These next two are for spiking/unspiking and purging of planning/agenda items
    'state': STATE_SCHEMA,
    'expiry': {
        'type': 'datetime',
        'nullable': True
    },

    'lock_user': Resource.rel('users'),
    'lock_time': {
        'type': 'datetime',
        'versioned': False
    },
    'lock_session': Resource.rel('auth'),

    'lock_action': {
        'type': 'string',
        'mapping': not_analyzed,
        'nullable': True
    }

}  # end planning_schema


class PlanningResource(superdesk.Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    url = 'planning'
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
