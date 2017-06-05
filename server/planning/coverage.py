# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Coverage"""

import superdesk
import logging
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator
from apps.archive.common import get_user
from eve.utils import config
from superdesk.utc import utcnow

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


class CoverageService(superdesk.Service):
    """Service class for the coverage model."""

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            set_original_creator(doc)
            self._set_assignment_information(doc)

    def on_update(self, updates, original):
        self._set_assignment_information(updates)

    @staticmethod
    def notify(event, doc):
        push_notification(
            event,
            item=str(doc[config.ID_FIELD]),
            user=str(doc.get('original_creator', '')),
            planning=str(doc.get('planning_item', ''))
        )

    def on_created(self, docs):
        for doc in docs:
            CoverageService.notify('coverage:created', doc)

    def on_updated(self, updates, original):
        CoverageService.notify('coverage:updated', original)

    def on_deleted(self, doc):
        CoverageService.notify('coverage:deleted', doc)

    def _set_assignment_information(self, doc):
        if doc.get('planning') and doc['planning'].get('assigned_to'):
            planning = doc['planning']
            if planning['assigned_to'].get('user') and planning['assigned_to'].get('desk'):
                # Error - Assign either to desk or user, not both
                raise SuperdeskApiError.badRequestError(message="Assignment can have exactly one assignee.")

            # In case of update we need to nullify previous assignment
            if planning['assigned_to'].get('user'):
                planning['assigned_to']['desk'] = None
            else:
                planning['assigned_to']['user'] = None

            user = get_user()
            if user and user.get(config.ID_FIELD):
                planning['assigned_to']['assigned_by'] = user[config.ID_FIELD]

            planning['assigned_to']['assigned_date'] = utcnow()


coverage_schema = {
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

    # Reference to Planning Item
    'planning_item': superdesk.Resource.rel('planning'),

    # News Coverage Details
    # See IPTC-G2-Implementation_Guide 16.4
    'planning': {
        'type': 'dict',
        'schema': {
            'ednote': {'type': 'string'},
            'g2_content_type': {'type': 'string'},
            'item_class': {'type': 'string'},
            'item_count': {'type': 'string'},
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
            'assigned_to': {
                'nullable': True,
                'type': 'dict',
                'schema': {
                    'desk': {'type': 'string', 'nullable': True},
                    'user': {'type': 'string', 'nullable': True},
                    'assigned_by': {'type': 'string'},
                    'assigned_date': {'type': 'datetime'},
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
            'description': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
            'genre': {
                'type': 'list',
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed
                    }
                }
            },
            'headline': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
                }
            },
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
            'slugline': {
                'type': 'list',
                'mapping': {
                    'type': 'string'
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
            }
        }  # end planning dict schema
    },  # end planning

    # See IPTC-G2-Implementation_Guide 16.6
    'delivery': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                # Delivered Item Ref See IPTC-G2-Implementation_Guide 16.7
                'rel': {'type': 'string'},
                'href': {'type': 'string'},
                'residref': {'type': 'string'},
                'version': {'type': 'string'},
                'content_type': {'type': 'string'},
                'format': {'type': 'string'},
                'size': {'type': 'string'},
                'persistent_id_ref': {'type': 'string'},
                'valid_from': {'type': 'datetime'},
                'valid_to': {'type': 'datetime'},
                'creator': {'type': 'string'},
                'modified': {'type': 'datetime'},
                'xml_lang': {'type': 'string'},
                'dir': {'type': 'string'},
                'rank': {'type': 'integer'}
            }
        }
    }
}  # end coverage_schema


class CoverageResource(superdesk.Resource):
    """Resource for coverage data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    url = 'coverage'
    schema = coverage_schema
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}
