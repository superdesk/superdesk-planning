# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import superdesk
import superdesk.schema as schema
from copy import deepcopy
from superdesk.utils import ListCursor
from planning.common import planning_link_updates_to_coverage


def is_field_enabled(field, planning_type):
    editor = planning_type.get('editor', {})
    return editor.get(field, {}).get('enabled', False)


class DateTimeField(schema.SchemaField):
    """Dict schema field."""

    def __repr__(self):
        return 'datetime'

    def __init__(self, required=False, schema=None):
        """Initialize"""
        super().__init__()
        self.schema['type'] = 'datetime'
        self.schema['required'] = required


class BaseSchema(schema.Schema):
    slugline = schema.StringField()


class StringRequiredForAction(schema.SchemaField):
    def __repr__(self):
        return 'string'

    def __init__(self, required=False, dependencies=None):
        """Initialize"""
        super().__init__()
        self.schema['type'] = 'string'
        self.schema['required'] = required
        self.schema['dependencies'] = dependencies


subjectField = schema.ListField(required=False, mandatory_in_list={'scheme': {}}, schema={
    'type': 'dict',
    'schema': {
        'name': {},
        'qcode': {},
        'scheme': {
            'type': 'string',
            'required': True,
            'nullable': True,
            'allowed': []
        },
        'service': {'nullable': True},
        'parent': {'nullable': True}
    }
})


class EventSchema(BaseSchema):
    """
    The event schema is used for validation of the event edit form
    """

    anpa_category = schema.ListField()
    calendars = schema.ListField()
    dates = schema.DictField(required=True)
    definition_long = schema.StringField()
    definition_short = schema.StringField()
    ednote = schema.StringField()
    event_contact_info = schema.ListField()
    files = schema.ListField()
    internal_note = schema.StringField()
    language = schema.StringField()
    links = schema.ListField()
    location = schema.StringField()
    name = schema.StringField(required=True)
    occur_status = schema.DictField()
    occur_status.schema['schema'] = {
        "qcode": {
            "type": "string",
            "required": True
        },
        "name": {
            "type": "string",
            "required": False
        },
        "label": {
            "type": "string",
            "required": False
        }
    }
    place = schema.ListField()
    reference = schema.StringField()
    slugline = schema.StringField()
    subject = subjectField


class PlanningSchema(BaseSchema):
    """
    The planning schema used to validate the planning form
    """

    agendas = schema.ListField()
    anpa_category = schema.ListField()
    description_text = schema.StringField()
    ednote = schema.StringField()
    files = schema.ListField()
    flags = schema.DictField()
    headline = schema.StringField()
    internal_note = schema.StringField()
    language = schema.StringField()
    name = schema.StringField()
    place = schema.ListField()
    planning_date = DateTimeField(required=True)
    slugline = schema.StringField(required=True)
    subject = subjectField
    urgency = schema.IntegerField()


class CoverageSchema(BaseSchema):
    contact_info = schema.StringField()
    ednote = schema.StringField()
    files = schema.ListField()
    flags = schema.DictField()
    g2_content_type = schema.ListField(required=True)
    genre = schema.ListField()
    headline = schema.StringField()
    internal_note = schema.StringField()
    keyword = schema.ListField()
    language = schema.StringField()
    news_coverage_status = schema.ListField()
    scheduled = DateTimeField()
    slugline = schema.StringField()


DEFAULT_EDITOR = [{
    'name': 'event',
    'editor': {
        'anpa_category': {'enabled': True},
        'calendars': {'enabled': True},
        'dates': {
            'enabled': True,
            'default_duration_on_change': 1,
            'all_day': {'enabled': True}
        },
        'definition_long': {'enabled': True},
        'definition_short': {'enabled': True},
        'ednote': {'enabled': True},
        'event_contact_info': {'enabled': True},
        'files': {'enabled': True},
        'internal_note': {'enabled': True},
        'language': {'enabled': False},
        'links': {'enabled': True},
        'location': {'enabled': True},
        'name': {'enabled': True},
        'occur_status': {'enabled': True},
        'place': {'enabled': False},
        'reference': {'enabled': False},
        'slugline': {'enabled': True},
        'subject': {'enabled': True},
    },
    'schema': dict(EventSchema)
}, {
    'name': 'planning',
    'editor': {
        'agendas': {'enabled': True},
        'anpa_category': {'enabled': True},
        'description_text': {'enabled': True},
        'ednote': {'enabled': True},
        'files': {'enabled': False},
        'flags': {'enabled': True},
        'headline': {'enabled': False},
        'internal_note': {'enabled': True},
        'language': {'enabled': False},
        'name': {'enabled': False},
        'place': {'enabled': False},
        'planning_date': {'enabled': True},
        'slugline': {'enabled': True},
        'subject': {'enabled': True},
        'urgency': {'enabled': True},
    },
    'schema': dict(PlanningSchema)
}, {
    'name': 'coverage',
    'editor': {
        'contact_info': {'enabled': False},
        'ednote': {'enabled': True},
        'files': {'enabled': False},
        'flags': {'enabled': True},
        'g2_content_type': {'enabled': True},
        'genre': {'enabled': True},
        'headline': {'enabled': False},
        'internal_note': {'enabled': True},
        'keyword': {'enabled': False},
        'language': {'enabled': False},
        'news_coverage_status': {'enabled': True},
        'scheduled': {'enabled': True},
        'slugline': {'enabled': True},
    },
    'schema': dict(CoverageSchema)
}, {
    'name': 'advanced_search',
    'editor': {
        'event': {
            'slugline': {
                'enabled': True,
                'index': 1
            },
            'reference': {
                'enabled': False,
                'index': 2
            },
            'name': {
                'enabled': True,
                'index': 3
            },
            'anpa_category': {
                'enabled': True,
                'index': 4
            },
            'subject': {
                'enabled': True,
                'index': 5
            },
            'source': {
                'enabled': True,
                'index': 6
            },
            'location': {
                'enabled': True,
                'index': 7
            },
            'state': {
                'enabled': True,
                'index': 8
            },
            'pub_status': {
                'enabled': True,
                'index': 9
            },
            'spike_state': {
                'enabled': True,
                'index': 10
            },
            'start_date_time': {
                'enabled': True,
                'index': 11
            },
            'end_date_time': {
                'enabled': True,
                'index': 12
            },
            'date_filter': {
                'enabled': True,
                'index': 13
            },
        },
        'planning': {
            'slugline': {
                'enabled': True,
                'index': 1
            },
            'content_type': {
                'enabled': True,
                'index': 2
            },
            'no_coverage': {
                'enabled': True,
                'index': 3
            },
            'featured': {
                'enabled': True,
                'index': 4
            },
            'anpa_category': {
                'enabled': True,
                'index': 5
            },
            'subject': {
                'enabled': True,
                'index': 6
            },
            'urgency': {
                'enabled': True,
                'index': 7
            },
            'state': {
                'enabled': True,
                'index': 8
            },
            'pub_status': {
                'enabled': True,
                'index': 9
            },
            'spike_state': {
                'enabled': True,
                'index': 10
            },
            'start_date_time': {
                'enabled': True,
                'index': 11
            },
            'end_date_time': {
                'enabled': True,
                'index': 12
            },
            'date_filter': {
                'enabled': True,
                'index': 13
            }
        },
        'combined': {
            'slugline': {
                'enabled': True,
                'index': 1
            },
            'reference': {
                'enabled': False,
                'index': 2
            },
            'anpa_category': {
                'enabled': True,
                'index': 3
            },
            'subject': {
                'enabled': True,
                'index': 4
            },
            'state': {
                'enabled': True,
                'index': 5
            },
            'pub_status': {
                'enabled': True,
                'index': 6
            },
            'spike_state': {
                'enabled': True,
                'index': 7
            },
            'start_date_time': {
                'enabled': True,
                'index': 8
            },
            'end_date_time': {
                'enabled': True,
                'index': 9
            },
            'date_filter': {
                'enabled': True,
                'index': 10
            }
        }
    },
    'schema': {}
}, {
    'name': 'event_postpone',
    'schema': {},
    'editor': {},
}, {
    'name': 'event_reschedule',
    'schema': {},
    'editor': {},
}, {
    'name': 'event_cancel',
    'schema': {},
    'editor': {},
}, {
    'name': 'planning_planning_cancel',
    'schema': {},
    'editor': {},
}, {
    'name': 'planning_cancel_all_coverage',
    'schema': {},
    'editor': {},
}, {
    'name': 'coverage_cancel_coverage',
    'schema': {},
    'editor': {},
}]

logger = logging.getLogger(__name__)

planning_types_schema = {
    # The name identfies the form in the UI to which the type relates
    'name': {
        'type': 'string',
        'iunique': True,
        'required': True,
        'nullable': False,
        'empty': False
    },
    # editor controls which fields are visible in the UI
    'editor': {
        'type': 'dict',
        'schema': {},
        'allow_unknown': True,
        'keysrules': {'type': 'string'},
    },
    # schema controls the validation of fields at the front end.
    'schema': {
        'type': 'dict',
        'schema': {},
        'allow_unknown': True,
        'keysrules': {'type': 'string'},
    },

    # postSchema controls the validation of fields when posting.
    'postSchema': {
        'type': 'dict',
        'schema': {},
        'allow_unknown': True,
        'keysrules': {'type': 'string'},
    },

    # list fields config
    'list': {
        'type': 'dict',
        'schema': {},
        'allow_unknown': True,
        'keysrules': {'type': 'string'},
    },

    # list fields when seeing events/planning when exporting or downloading
    'export_list': {
        'type': 'list',
        'schema': {
            'type': 'string'
        }
    },

    'init_version': {
        'type': 'integer',
    }
}


class PlanningTypesService(superdesk.Service):
    """Planning types service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    def find_one(self, req, **lookup):
        try:
            planning_type = super().find_one(req, **lookup)

            # lookup name from either **lookup of planning_item(if lookup has only '_id')
            lookup_name = lookup.get('name')
            if not lookup_name and planning_type:
                lookup_name = planning_type.get('name')

            default_planning_type = next((ptype for ptype in DEFAULT_EDITOR
                                          if ptype.get('name') == lookup_name), None)
            if not planning_type:
                return default_planning_type

            self.merge_planning_type(planning_type, default_planning_type)
            return planning_type
        except IndexError:
            return None

    def get(self, req, lookup):
        planning_types = list(super().get(req, lookup))
        merged_planning_types = []

        for default_planning_type in DEFAULT_EDITOR:
            planning_type = next((p for p in planning_types
                                  if p.get('name') == default_planning_type.get('name')), None)

            # If nothing is defined in database for this planning_type, use default
            if planning_type is None:
                merged_planning_types.append(default_planning_type)
            else:
                self.merge_planning_type(planning_type, default_planning_type)
                merged_planning_types.append(planning_type)

        if not planning_link_updates_to_coverage():
            coverage_type = [t for t in merged_planning_types if t['name'] == 'coverage'][0]
            coverage_type['editor']['flags']['enabled'] = False

        return ListCursor(merged_planning_types)

    def merge_planning_type(self, planning_type, default_planning_type):
        # Update schema fields with database schema fields
        default_type = {'schema': {}, 'editor': {}}
        updated_planning_type = deepcopy(default_planning_type or default_type)
        updated_planning_type['schema'].update(planning_type.get('schema', {}))
        updated_planning_type['editor'].update(planning_type.get('editor', {}))

        planning_type['schema'] = updated_planning_type['schema']
        planning_type['editor'] = updated_planning_type['editor']


class PlanningTypesResource(superdesk.Resource):
    endpoint_name = 'planning_types'
    schema = planning_types_schema
    resource_methods = ['GET']
    merge_nested_documents = True
