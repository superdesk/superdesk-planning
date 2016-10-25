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

logger = logging.getLogger(__name__)

not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


class PlanningService(superdesk.Service):
    """Service class for the planning model."""

    def on_create(self, docs):
        """Set default metadata."""

        for doc in docs:
            doc['guid'] = generate_guid(type=GUID_NEWSML)

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

    # Planning Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 16
    # probably can skip this subsection, although its documented in iptc impl guide this way
    'planning_item': {
        'type': 'dict',
        'schema': {
            # See IPTC-G2-Implementation_Guide 16.1
            'item_meta': {
                'type': 'dict',
                'schema': {
                    'item_class': {'type': 'string'}
                }
            },
            # See IPTC-G2-Implementation_Guide 16.2
            'content_meta': {
                'type': 'dict',
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'}
                }
            },
            # See IPTC-G2-Implementation_Guide 16.3
            'news_coverage_set': {
                'type': 'list',
                # See IPTC-G2-Implementation_Guide 16.4 (newsCoverage)
                'schema': {
                    'type': 'dict',
                    'schema': {
                        # See IPTC-G2-Implementation_Guide 16.5
                        'planning': {
                            'type': 'dict',
                            'schema': {
                                'ed_note': {'type': 'string'},
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
                                'assigned_to': {'type': 'string'},
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
                                            'name': not_analyzed
                                        }
                                    }
                                },
                                # Metadata hints.  See IPTC-G2-Implementation_Guide 16.5.1.1
                                'by': {'type': 'string'},
                                'credit_line': {'type': 'string'},
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
                    }
                }  # end news_coverage schema
            }  # end news_coverage_set list
        }  # end news_coverage_set
    }  # end planning_details
}  # end planning_schema


class PlanningResource(superdesk.Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    url = 'planning'
    schema = planning_schema
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET']
    privileges = {'POST': 'planning',
                  'PATCH': 'planning',
                  'DELETE': 'planning'}
