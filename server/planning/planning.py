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
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk import get_resource_service
from superdesk.resource import build_custom_hateoas
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator, get_user
from copy import deepcopy
from eve.utils import config
from .common import STATE_SCHEMA

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


class PlanningService(superdesk.Service):
    """Service class for the planning model."""

    def __generate_related_coverages(self, planning):
        custom_coverage_hateoas = {'self': {'title': 'Coverage', 'href': '/coverage/{_id}'}}
        for coverage in get_resource_service('coverage').find(where={'planning_item': planning['_id']}):
            build_custom_hateoas(custom_coverage_hateoas, coverage)
            yield coverage

    def get(self, req, lookup):
        docs = super().get(req, lookup)
        # nest coverages
        for doc in docs:
            doc['coverages'] = list(self.__generate_related_coverages(doc))
        return docs

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            set_original_creator(doc)

            # remove event expiry if it is linked to the planning
            if 'event_item' in doc:
                events_service = get_resource_service('events')
                original_event = events_service.find_one(req=None, _id=doc['event_item'])
                events_service.system_update(doc['event_item'], {'expiry': None}, original_event)

    def on_created(self, docs):
        for doc in docs:
            push_notification(
                'planning:created',
                item=str(doc.get(config.ID_FIELD)),
                user=str(doc.get('original_creator', ''))
            )

    def on_update(self, updates, original):
        user = get_user()
        if user and user.get(config.ID_FIELD):
            updates['version_creator'] = user[config.ID_FIELD]

    def on_updated(self, updates, original):
        push_notification(
            'planning:updated',
            item=str(original[config.ID_FIELD]),
            user=str(updates.get('version_creator', ''))
        )

    def on_deleted(self, doc):
        # remove the planning from agendas
        agenda_service = get_resource_service('agenda')
        for agenda in agenda_service.find(where={'planning_items': doc['_id']}):
            diff = {'planning_items': [_ for _ in agenda['planning_items'] if _ != doc['_id']]}
            agenda_service.update(agenda['_id'], diff, agenda)
            get_resource_service('agenda_history').on_item_updated(diff, agenda)


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
    'planning_type': {
        'type': 'string',
        'mapping': not_analyzed,
    },
    'name': {
        'type': 'string'
    },
    'planning_items': {
        'type': 'list',
        'schema': superdesk.Resource.rel('planning'),
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
        'elastic_filter': {"bool": {"must_not": {"term": {"planning_type": "agenda"}}}}
    }
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning_planning_management',
                  'PATCH': 'planning_planning_management',
                  'DELETE': 'planning'}
