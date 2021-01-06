# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""EventsPlanning Filters are allows users to define filters for combined search based on calendars and agenda.

"""

from typing import NamedTuple

from copy import deepcopy
from eve.utils import config
import logging

import superdesk
from superdesk import Resource
from superdesk.notification import push_notification
from superdesk.metadata.item import metadata_schema

from apps.auth import get_user_id

from planning.common import set_original_creator, SPIKED_STATE
from planning.events.events_schema import events_schema
from planning.planning.planning import planning_schema
from planning.search.queries.elastic import DATE_RANGE


logger = logging.getLogger(__name__)
endpoint = 'events_planning_filters'


#: item types
class ItemTypes(NamedTuple):
    EVENT: str
    PLANNING: str
    COMBINED: str


ITEM_TYPES: ItemTypes = ItemTypes('events', 'planning', 'combined')


filters_schema = {
    'name': {
        'type': 'string',
        'iunique': True,
        'required': True
    },
    'item_type': {
        'type': 'string',
        'allowed': tuple(ITEM_TYPES),
        'default': ITEM_TYPES.COMBINED,
        'nullable': False,
    },
    # Audit Information
    'original_creator': Resource.rel('users'),
    'version_creator': Resource.rel('users'),
    'params': {
        'type': 'dict',
        'schema': {
            # Common Fields
            'item_ids': {
                'type': 'list',
                'nullable': True,
            },
            'name': events_schema['name'],
            'tz_offset': {
                'type': 'string',
                'nullable': True,
            },
            'full_text': {
                'type': 'string',
                'nullable': True,
            },
            'anpa_category': metadata_schema['anpa_category'],
            'subject': metadata_schema['subject'],
            'posted': {
                'type': 'boolean',
                'nullable': True
            },
            'place': metadata_schema['place'],
            'language': metadata_schema['language'],
            'state': {
                'type': 'list',
                'nullable': True,
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'}
                }
            },
            'spike_state': {
                'type': 'string',
                'allowed': SPIKED_STATE,
                'nullable': True
            },
            'include_killed': {
                'type': 'boolean',
                'nullable': True
            },
            'date_filter': {
                'type': 'string',
                'allowed': tuple(DATE_RANGE),
                'nullable': True
            },
            'start_date': {
                'type': 'datetime',
                'nullable': True,
            },
            'end_date': {
                'type': 'datetime',
                'nullable': True,
            },
            'only_future': {
                'type': 'boolean',
                'nullable': True
            },
            'start_of_week': {
                'type': 'integer',
                'nullable': True
            },
            'slugline': metadata_schema['slugline'],
            'lock_state': {
                'type': 'string',
                'allowed': ['locked', 'unlocked'],
                'nullable': True
            },
            'recurrence_id': events_schema['recurrence_id'],
            'max_results': {
                'type': 'integer',
                'nullable': True
            },

            # Event Specific Fields
            'reference': events_schema['reference'],
            'source': {
                'type': 'list',
                'nullable': True,
                'schema': metadata_schema['ingest_provider']
            },
            'location': {
                'type': 'string',
                'nullable': True,
            },
            'calendars': events_schema['calendars'],
            'no_calendar_assigned': {
                'type': 'boolean',
                'nullable': True
            },

            # Planning Specific Fields
            'agendas': planning_schema['agendas'],
            'no_agenda_assigned': {
                'type': 'boolean',
                'nullable': True
            },
            'ad_hoc_planning': {
                'type': 'boolean',
                'nullable': True
            },
            'exclude_rescheduled_and_cancelled': {
                'type': 'boolean',
                'nullable': True
            },
            'no_coverage': {
                'type': 'boolean',
                'nullable': True
            },
            'urgency': {
                'type': 'dict',
                'schema': {
                    'qcode': {'type': 'integer'},
                    'name': {'type': 'string'}
                }
            },
            'g2_content_type': {
                'type': 'dict',
                'schema': {
                    'qcode': {'type': 'string'},
                    'name': {'type': 'string'},
                    'content item type': {'type': 'string'}
                }
            },
            'featured': {
                'type': 'boolean',
                'nullable': True
            },
            'include_scheduled_updates': {
                'type': 'boolean',
                'nullable': True
            },
            'event_item': {
                'type': 'list',
                'nullable': True,
                'schema': planning_schema['event_item']
            }
        }
    }
}


class EventPlanningFiltersResource(superdesk.Resource):
    """Resource for Event and Planning Filters"""

    endpoint_name = endpoint
    url = endpoint
    schema = filters_schema
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'planning_eventsplanning_filters_management',
                  'PATCH': 'planning_eventsplanning_filters_management',
                  'DELETE': 'planning_eventsplanning_filters_management'}


class EventPlanningFiltersService(superdesk.Service):
    """Service for Event and Planning Filters"""

    def on_create(self, docs):
        for doc in docs:
            set_original_creator(doc)

    def on_created(self, docs):
        for doc in docs:
            self._push_notification(
                doc.get(config.ID_FIELD),
                'event_planning_filters:created'
            )

    def _push_notification(self, _id, event_name):
        """Push socket notification"""
        push_notification(
            event_name,
            item=str(_id),
            user=str(get_user_id())
        )

    def on_update(self, updates, original):
        updated = deepcopy(original)
        updated.update(updates)
        user_id = get_user_id()
        if user_id:
            updates['version_creator'] = user_id

    def on_updated(self, updates, original):
        self._push_notification(
            original.get(config.ID_FIELD),
            'event_planning_filters:updated'
        )

    def on_deleted(self, doc):
        self._push_notification(
            doc.get(config.ID_FIELD),
            'event_planning_filters:deleted'
        )
