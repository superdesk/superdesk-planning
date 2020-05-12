# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Locations"""

import superdesk
import logging
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from .common import set_original_creator
from eve.utils import config

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}
venue_types = {
}


class LocationsService(superdesk.Service):
    """Service class for the events model."""

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            set_original_creator(doc)

    def delete(self, lookup):
        """If the document to be deleted is reference in an event then flag it as inactive otherwise just delete it.

        :param doc:
        :return:
        """
        if lookup:
            location = superdesk.get_resource_service('locations').find_one(req=None, _id=lookup.get(config.ID_FIELD))
            if location:
                events = superdesk.get_resource_service('events').find(
                    where={'location.qcode': str(location.get('guid'))})
                if events.count():
                    # patch the unique name in case the location get recreated
                    superdesk.get_resource_service('locations').patch(location[config.ID_FIELD],
                                                                      {'is_active': False,
                                                                       'unique_name': str(location[config.ID_FIELD])})
                    return
        super().delete(lookup)


locations_schema = {
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

    # Location Details
    # NewsML-G2 Event properties See:
    #    https://iptc.org/std/NewsML-G2/2.23/specification/XML-Schema-Doc-Core/ConceptItem.html#LinkC5
    #
    # IMPORTANT: name needs to be unique to ensure we don't save duplicate addresses, however this is also
    # the field where we store the formatted address, which can have variations (street number vs number street)
    # for the same address
    'name': {
        'type': 'string'
    },
    'type': {
        'type': 'string',
        'default': 'Unclassified'
    },

    # NewsML-G2 poiDetails properties See IPTC-G2-Implementation_Guide 12.6.3
    # or https://iptc.org/std/NewsML-G2/2.23/specification/XML-Schema-Doc-Power/ConceptItem.html#LinkAA
    'position': {
        'type': 'dict',
        'schema': {
            'latitude': {'type': 'float'},
            'longitude': {'type': 'float'},
            'altitude': {'type': 'integer'},
            'gps_datum': {'type': 'string'},
        }
    },
    'address': {
        'type': 'dict',
        'schema': {
            'title': {
                'type': 'string',
                'nullable': True,
            },
            'line': {
                'type': 'list',
                'mapping': {'type': 'string'}
            },
            'locality': {'type': 'string'},
            'area': {'type': 'string'},
            'country': {'type': 'string'},
            'postal_code': {'type': 'string'},
            'external': {
                'type': 'dict',
                'mapping': {
                    'type': 'object',
                    'enabled': False
                }
            },
            'boundingbox': {'type': 'list', 'mapping': not_indexed},
            'type': not_indexed,
        },
    },
    'access': {
        'type': 'list',
        'nullable': True,
        'mapping': {
            'type': 'string'
        }
    },
    'details': {
        'type': 'list',
        'nullable': True,
        'mapping': {
            'type': 'string'
        }
    },
    'created': {'type': 'datetime'},
    'ceased_to_exist': {'type': 'datetime'},
    'open_hours': {'type': 'string'},
    'capacity': {'type': 'string'},
    'contact_info': {
        'type': 'list',
        'nullable': True,
        'mapping': {
            'type': 'string'
        }
    },
    # Flag indicates if the location is active and should be shown in the UI
    'is_active': {'type': 'boolean',
                  'default': True}
}


class LocationsResource(superdesk.Resource):
    """Resource for locations data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 12.6.1.2 for schema details
    """

    url = 'locations'
    schema = locations_schema
    resource_methods = ['GET', 'POST']
    datasource = {
        'source': 'locations',
        'search_backend': 'elastic'
    }
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning_locations_management',
                  'DELETE': 'planning_locations_management'}

    merge_nested_documents = True
