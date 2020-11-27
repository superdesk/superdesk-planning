# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import Resource
from superdesk.resource import not_analyzed
from superdesk.metadata.item import metadata_schema, ITEM_TYPE
from copy import deepcopy

from planning.common import WORKFLOW_STATE_SCHEMA, POST_STATE_SCHEMA, UPDATE_METHODS, \
    TO_BE_CONFIRMED_FIELD, TO_BE_CONFIRMED_FIELD_SCHEMA

event_type = deepcopy(Resource.rel('events', type='string'))
event_type['mapping'] = not_analyzed

planning_type = deepcopy(Resource.rel('planning', type='string'))
planning_type['mapping'] = not_analyzed
original_creator_schema = metadata_schema['original_creator']
original_creator_schema.update({'nullable': True})

events_schema = {
    # Identifiers
    '_id': metadata_schema['_id'],
    'guid': metadata_schema['guid'],
    'unique_id': metadata_schema['unique_id'],
    'unique_name': metadata_schema['unique_name'],
    'version': metadata_schema['version'],
    'ingest_id': metadata_schema['ingest_id'],
    'recurrence_id': {
        'type': 'string',
        'mapping': not_analyzed,
        'nullable': True,
    },

    # This is used when recurring series are split
    'previous_recurrence_id': {
        'type': 'string',
        'mapping': not_analyzed,
        'nullable': True
    },

    # Audit Information
    'original_creator': original_creator_schema,
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],

    # Ingest Details
    'ingest_provider': metadata_schema['ingest_provider'],
    'source': metadata_schema['source'],
    'original_source': metadata_schema['original_source'],
    'ingest_provider_sequence': metadata_schema['ingest_provider_sequence'],

    'event_created': {
        'type': 'datetime'
    },
    'event_lastmodified': {
        'type': 'datetime'
    },
    # Event Details
    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.2
    'name': {'type': 'string'},
    'definition_short': {'type': 'string'},
    'definition_long': {'type': 'string'},
    'internal_note': {'type': 'string'},

    # Reference can be used to hold for example a court case reference number
    'reference': {'type': 'string'},

    'anpa_category': metadata_schema['anpa_category'],
    'files': {
        'type': 'list',
        'nullable': True,
        'schema': Resource.rel('events_files'),
        'mapping': not_analyzed,
    },
    'relationships': {
        'type': 'dict',
        'schema': {
            'broader': {'type': 'string'},
            'narrower': {'type': 'string'},
            'related': {'type': 'string'}
        },
    },
    'links': {
        'type': 'list',
        'nullable': True
    },

    # NewsML-G2 Event properties See IPTC-G2-Implementation_Guide 15.4.3
    'dates': {
        'type': 'dict',
        'schema': {
            'start': {
                'type': 'datetime',
                'nullable': True,
            },
            'end': {
                'type': 'datetime',
                'nullable': True,
            },
            'tz': {'type': 'string'},
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
                    'interval': {'type': 'integer'},
                    'endRepeatMode': {
                        'type': 'string',
                        'allowed': ['count', 'until']
                    },
                    'until': {'type': 'datetime', 'nullable': True},
                    'count': {'type': 'integer', 'nullable': True},
                    'bymonth': {'type': 'string', 'nullable': True},
                    'byday': {'type': 'string', 'nullable': True},
                    'byhour': {'type': 'string', 'nullable': True},
                    'byminute': {'type': 'string', 'nullable': True},
                },
                'nullable': True
            },
            'occur_status': {
                'nullable': True,
                'type': 'dict',
                'mapping': {
                    'properties': {
                        'qcode': not_analyzed,
                        'name': not_analyzed
                    }
                },
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'},
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
                    'until': {'type': 'datetime', 'nullable': True},
                    'count': {'type': 'integer', 'nullable': True},
                    'bymonth': {'type': 'string', 'nullable': True},
                    'byday': {'type': 'string', 'nullable': True},
                    'byhour': {'type': 'string', 'nullable': True},
                    'byminute': {'type': 'string', 'nullable': True}
                }
            }
        }
    },  # end dates
    # This is a extra field so that we can sort in the combined view of events and planning.
    # It will store the dates.start of the event.
    '_planning_schedule': {
        'type': 'list',
        'mapping': {
            'type': 'nested',
            'properties': {
                'scheduled': {'type': 'date'},
            }
        }
    },
    'occur_status': {
        'nullable': True,
        'type': 'dict',
        'schema': {
            'qcode': {'type': 'string'},
            'name': {'type': 'string'},
            'label': {'type': 'string'}
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

    # Content metadata
    'subject': metadata_schema['subject'],
    'slugline': metadata_schema['slugline'],

    # Item metadata
    'location': {
        'type': 'list',
        'mapping': {
            'properties': {
                'qcode': {'type': 'string'},
                'name': {'type': 'string'},
                'address': {'type': 'object'},
                'geo': {'type': 'string'},
                'location': {'type': 'geo_point'},
            }
        },
        'nullable': True
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
        'mapping': {
            'properties': {
                'qcode': not_analyzed,
                'name': not_analyzed
            }
        }
    },
    'event_contact_info': {
        'type': 'list',
        'schema': Resource.rel('contacts'),
        'mapping': not_analyzed
    },
    'language': metadata_schema['language'],

    # These next two are for spiking/unspiking and purging events
    'state': WORKFLOW_STATE_SCHEMA,
    'expiry': {
        'type': 'datetime',
        'nullable': True
    },
    'expired': {
        'type': 'boolean',
        'default': False
    },
    # says if the event is for internal usage or posted
    'pubstatus': POST_STATE_SCHEMA,

    'lock_user': metadata_schema['lock_user'],
    'lock_time': metadata_schema['lock_time'],
    'lock_session': metadata_schema['lock_session'],
    'lock_action': metadata_schema['lock_action'],

    # The update method used for recurring events
    'update_method': {
        'type': 'string',
        'allowed': UPDATE_METHODS,
        'mapping': not_analyzed,
        'nullable': True
    },

    # Item type used by superdesk publishing
    ITEM_TYPE: {
        'type': 'string',
        'mapping': not_analyzed,
        'default': 'event',
    },

    # Named Calendars
    'calendars': {
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

    # The previous state the item was in before for example being spiked,
    # when un-spiked it will revert to this state
    'revert_state': metadata_schema['revert_state'],

    # Used when duplicating/rescheduling of Events
    'duplicate_from': event_type,
    'duplicate_to': {
        'type': 'list',
        'nullable': True,
        'schema': Resource.rel('events', type='string'),
        'mapping': not_analyzed
    },

    'reschedule_from': event_type,
    'reschedule_to': event_type,
    '_reschedule_from_schedule': {'type': 'datetime'},
    'place': metadata_schema['place'],
    'ednote': metadata_schema['ednote'],

    # Reason (if any) for the current state (cancelled, postponed, rescheduled)
    'state_reason': {
        'type': 'string',
        'nullable': True
    },
    # Datetime when a particular action (postpone, reschedule, cancel) took place
    'actioned_date': {
        'type': 'datetime',
        'nullable': True
    },
    'completed': {'type': 'boolean'},
    TO_BE_CONFIRMED_FIELD: TO_BE_CONFIRMED_FIELD_SCHEMA,


    # This is used if an Event is created from a Planning Item
    # So that we can link the Planning item to this Event upon creation
    '_planning_item': planning_type,

    # This is used when event creation was based on `events_template`
    'template': Resource.rel('events_template', embeddable=False),

    # This is used when enhancing fetch items to add ids of associated Planning items
    'planning_ids': {
        'type': 'list',
        'required': False,
        'schema': {'type': 'string'}
    }
}  # end events_schema
