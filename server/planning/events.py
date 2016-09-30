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
from superdesk.metadata.utils import item_url


not_analyzed = {'type': 'string', 'index': 'not_analyzed'}
not_indexed = {'type': 'string', 'index': 'no'}


class EventsService(superdesk.Service):
    pass


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
    # probably can skip this subsection, although its documented in iptc impl guide this way
    'event_details': {
        'type': 'dict',
        'schema': {
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
                            'type': 'datetime'
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
                            'type': 'datetime'
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
        }  # end event_details schema
    }  # end event_details
}  # end events_schema


class EventsResource(superdesk.Resource):
    """Resource for events data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 15.4 for schema details
    """

    url = 'events'
    schema = events_schema
    resource_methods = ['GET', 'POST', 'PATCH', 'DELETE']
    item_methods = ['GET', 'POST', 'PATCH', 'DELETE']
    public_methods = ['GET']
    item_url = item_url
