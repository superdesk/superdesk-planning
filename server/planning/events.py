# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Events"""

import superdesk
import logging
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


organizer_roles = {
    'eorol:artAgent': 'Artistic agent',
    'eorol:general': 'General organiser',
    'eorol:tech': 'Technical organiser',
    'eorol:travAgent': 'Travel agent',
    'eorol:venue': 'Venue organiser'
}

occurrence_statuses = {
    'eocstat:eos0': 'Unplanned event',
    'eocstat:eos1': 'Planned, occurence planned only',
    'eocstat:eos2': 'Planned, occurence highly uncertain',
    'eocstat:eos3': 'Planned, May occur',
    'eocstat:eos4': 'Planned, occurence highly likely',
    'eocstat:eos5': 'Planned, occurs certainly'
}


class EventsService(superdesk.Service):
    """Service class for the events model."""

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)


events_schema = {
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

    # Event Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.2
    'description': {
        'type': 'dict',
        'schema': {
            'definition_short': {'type': 'string'},
            'definition_long': {'type': 'string'},
            'related': {'type': 'string'},
            'note': {'type': 'string'}
        },
    },
    'relationships': {
        'type': 'dict',
        'schema': {
            'broader': {'type': 'string'},
            'narrower': {'type': 'string'},
            'related': {'type': 'string'}
        },
    },

    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.4.3
    'dates': {
        'type': 'dict',
        'schema': {
            'start': {'type': 'datetime'},
            'end': {'type': 'datetime'},
            'duration': {'type': 'string'},
            'confirmation': {'type': 'string'},
            'recurring_date': {
                'type': 'list',
                'nullable': True,
                'mapping': {
                    'type': 'date'
                }
            },
            'recurring_rule': {
                'type': 'dict',
                'schema': {
                    'frequency': {'type': 'string'},
                    'interval': {'type': 'string'},
                    'until': {'type': 'datetime'},
                    'count': {'type': 'integer'},
                    'bymonth': {'type': 'string'},
                    'byday': {'type': 'string'},
                    'byhour': {'type': 'string'},
                    'byminute': {'type': 'string'}
                }
            },
            'ex_date': {
                'type': 'list',
                'mapping': {
                    'type': 'date'
                }
            },
            'ex_rule': {
                'type': 'dict',
                'schema': {
                    'frequency': {'type': 'string'},
                    'interval': {'type': 'string'},
                    'until': {'type': 'datetime'},
                    'count': {'type': 'integer'},
                    'bymonth': {'type': 'string'},
                    'byday': {'type': 'string'},
                    'byhour': {'type': 'string'},
                    'byminute': {'type': 'string'}
                }
            }
        }
    },  # end dates
    'occur_status': {
        'type': 'dict',
        'schema': {
            'qcode': {'type': 'string'},
            'name': {'type': 'string'}
        }
    },
    'news_coverage_status': {
        'type': 'dict',
        'schema': {
            'qcode': {'type': 'string'},
            'name': {'type': 'string'}
        }
    },
    'registration': {
        'type': 'string'
    },
    'access_status': {
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
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
    'location': {  # TODO: this is only placeholder schema
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'participant': {
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'participant_requirement': {
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'organizer': {  # TODO: this is only placeholder schema
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'contact_info': {  # TODO: this is only placeholder schema
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'language': {  # TODO: this is only placeholder schema
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    }
}  # end events_schema


class EventsResource(superdesk.Resource):
    """Resource for events data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 15.4 for schema details
    """

    url = 'events'
    schema = events_schema
    resource_methods = ['GET', 'POST']
    datasource = {
        'source': 'events',
        'search_backend': 'elastic',
    }
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}
