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
    'name': {'type': 'string'},

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
            'line': {
                'type': 'list',
                'mapping': {'type': 'string'}
            },
            'locality': {'type': 'string'},
            'area': {'type': 'string'},
            'country': {'type': 'string'},
            'postal_code': {'type': 'string'},
            'external': {'type': 'dict'}
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
    }
}


class LocationsResource(superdesk.Resource):
    """Resource for locations data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 12.6.1.2 for schema details
    """

    url = 'locations'
    schema = locations_schema
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}
