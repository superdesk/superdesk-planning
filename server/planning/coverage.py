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
from copy import deepcopy
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML, metadata_schema
from superdesk.resource import not_analyzed
from superdesk import get_resource_service
from superdesk.notification import push_notification
from apps.archive.common import set_original_creator, get_user
from eve.utils import config
from superdesk.utc import utcnow
from superdesk.activity import add_activity, ACTIVITY_UPDATE

logger = logging.getLogger(__name__)


class CoverageService(superdesk.Service):
    """Service class for the coverage model."""

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)
            set_original_creator(doc)
            self._set_assignment_information(doc)

    def on_update(self, updates, original):
        user = get_user()
        updates['version_creator'] = str(user.get(config.ID_FIELD)) if user else None
        self._set_assignment_information(updates)

    @staticmethod
    def notify(event, doc, user):
        push_notification(
            event,
            item=str(doc[config.ID_FIELD]),
            user=str(user),
            planning=str(doc.get('planning_item', ''))
        )

    def on_created(self, docs):
        for doc in docs:
            CoverageService.notify('coverage:created', doc, doc.get('original_creator', ''))
        get_resource_service('planning').sync_coverages(docs)

    def on_updated(self, updates, original):
        CoverageService.notify('coverage:updated', original, updates.get('version_creator', ''))
        doc = deepcopy(original)
        doc.update(updates)
        get_resource_service('planning').sync_coverages([doc])

    def on_deleted(self, doc):
        CoverageService.notify('coverage:deleted', doc, doc.get('version_creator', ''))
        get_resource_service('planning').sync_coverages([doc])

    def _set_assignment_information(self, doc):
        if doc.get('planning') and doc['planning'].get('assigned_to'):
            planning = doc['planning']
            if planning['assigned_to'].get('user') and not planning['assigned_to'].get('desk'):
                raise SuperdeskApiError.badRequestError(message="Assignment should have a desk.")

            # In case user was removed
            if not planning['assigned_to'].get('user'):
                planning['assigned_to']['user'] = None

            user = get_user()
            if user and user.get(config.ID_FIELD):
                planning['assigned_to']['assigned_by'] = user[config.ID_FIELD]

            planning['assigned_to']['assigned_date'] = utcnow()
            if planning['assigned_to'].get('user'):
                add_activity(ACTIVITY_UPDATE,
                             '{{assignor}} assigned a coverage to you',
                             self.datasource,
                             notify=[planning['assigned_to'].get('user')],
                             assignor=user.get('username'))


coverage_schema = {
    # Identifiers
    'guid': metadata_schema['guid'],

    # Audit Information
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # Reference to Planning Item
    'planning_item': superdesk.Resource.rel('planning'),

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
    },
    'news_coverage_status': {
        'type': 'dict',
        'schema': {
            'qcode': {'type': 'string'},
            'name': {'type': 'string'}
        }
    }
}  # end coverage_schema


class CoverageResource(superdesk.Resource):
    """Resource for coverage data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    url = 'coverage'
    schema = coverage_schema
    datasource = {
        'source': 'coverage',
        'search_backend': 'elastic',
    }
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}
    datasource = {
        'source': 'coverage',
        'search_backend': 'elastic',
        'elastic_parent': {
            'type': 'planning',
            'field': 'planning_item'
        }
    }
