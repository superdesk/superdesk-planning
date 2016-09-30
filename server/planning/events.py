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

from superdesk.resource import Resource


class EventsResource(Resource):

    def __init__(self, endpoint_name, app, service, endpoint_schema=None):
        self.readonly = True if app.config.get('LDAP_SERVER', None) else False

        self.additional_lookup = {
        }

        self.schema = {
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
            'original_creator': Resource.rel('users'),
            'version_creator': Resource.rel('users'),
            'firstcreated': {
                'type': 'datetime'
            },
            'versioncreated': {
                'type': 'datetime'
            },

            # Ingest Details
            'ingest_provider': Resource.rel('ingest_providers'),
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
            """NewsML-G2 Event properties 
            
            See IPTC-G2-Implementation_Guide 15.2
            """
            # name
            # urgency
            'event_details': { # probably can skip this subsection, although its documented in iptc impl guide this way
                'type': 'dict',
                'schema': {
                    'description': {
                        """EventsML-G2 Date properties

                        See IPTC-G2-Implementation_Guide 15.4.1
                        """
                        'definition_short': {
                            'type': 'string'
                        },
                        'definition_long': {
                            'type': 'string'
                        },
                        'related': {
                            'type': 'string'
                        },
                        'note': {
                            'type': 'string'
                        },
                    },
                    'relationships': {
                        """EventsML-G2 Relationship properties

                        See IPTC-G2-Implementation_Guide 15.4.2
                        """
                        'broader': {
                            'type': 'string'
                        },
                        'narrower': {
                            'type': 'string'
                        },
                        'related': {
                            'type': 'string'
                        },
                    },
                    'dates': {
                        """EventsML-G2 Date properties

                        See IPTC-G2-Implementation_Guide 15.4.3
                        
                        IMPORTANT NOTE: dates should be non-inclusive
                        """
                        'start': {
                            'type': 'datetime'
                        },
                        'end': {
                            'type': 'datetime'
                        },
                        'duration': {
                            """See IPTC-G2-Implementation_Guide 15.4.3.1

                            Expressed in the form:
                                PnYnMnDTnHnMnS
                                P indicates the Period (required)
                                nY = number of Years*
                                nM = number of Months*
                                nD = number of Days
                                T indicates the start of the Time period (required if a time part is specified)
                                nH = number of Hours
                                nM = number of Minutes
                                nS = number of Seconds
                            """
                            'type': 'string'
                        },
                        'confirmation': {
                            """See IPTC-G2-Implementation_Guide 15.4.3.1
        
                               Options: bothApprox, bothOk, startApprox, startOk, endApprox, endOk
                            """
                            'type': 'string'
                        },
                        'recurring_date': {
                            'type': 'list',
                            'mapping': {
                                'type': 'datetime'
                            }
                        },
                        'recurring_rule': {
                            'type': 'dict'.
                            'schema': {
                                # (YEARLY, MONTHLY, DAILY, HOURLY, PER MINUTE, PER SECOND)
                                'frequency': { 'type': 'string' },
                                'interval': { 'type': 'string' },
                                'until': { 'type': 'datetime' },
                                'count': { 'type': 'integer' },
                                'bymonth': { 'type': 'string' },
                                'byday': { 'type': 'string' },
                                'byhour': { 'type': 'string' },
                                'byminute': { 'type': 'string' }
                            }
                        }, # end recurring_rule
                        'ex_date': {
                            'type': 'list',
                            'mapping': {
                                'type': 'datetime'
                            }
                        }
                        'ex_rule': {
                            'type': 'dict'.
                            'schema': {
                                'frequency': { 'type': 'string' },
                                'interval': { 'type': 'string' },
                               'until': { 'type': 'datetime' },
                                'count': { 'type': 'integer' },
                                'bymonth': { 'type': 'string' },
                                'byday': { 'type': 'string' },
                                'byhour': { 'type': 'string' },
                                'byminute': { 'type': 'string' }
                            }
                        }, # end ex_rule
                    }, # end dates
                    'occur_status': {
                        'type': 'dict',
                        'schema': {
                            'qcode': { 'type': 'string' },
                            'name': { 'type': 'string' } 
                        }
                    },
                    'news_coverage_status': {
                        'type': 'dict',
                        'schema': {
                            'qcode': { 'type': 'string' },
                            'name': { 'type': 'string' } 
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
                    'location': {
                        'type': 'list',
                        #   location (list, should we use shared locations?)
                        #       name
                        #       related
                        #       POIDetails
                        #           position
                        #           contactInfo
                        #               web
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
                    'organizer': {
                        'type': 'list',
                    },
                    'contact_info': {
                    },
                    'language': {
                    },
                    'news_coverage': {
                    } 
                } # end event_details schema
            } # end event_details
        } # end self.schema

        self.extra_response_fields = [
        ]

        self.etag_ignore_fields = ['session_preferences', '_etag']

        self.datasource = {
            'projection': {'password': 0}, # TODO: update this
            'default_sort': [('username', 1)], # TODO: change this to date?
        }

        self.privileges = {'POST': 'users', 'DELETE': 'users', 'PATCH': 'users'}
        super().__init__(endpoint_name, app=app, service=service, endpoint_schema=endpoint_schema)
