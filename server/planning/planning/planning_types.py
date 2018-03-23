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


class EventSchema(BaseSchema):
    """
    The event schema is used for validation of the event edit form
    """

    place = schema.ListField()
    anpa_category = schema.ListField()
    definition_long = schema.StringField()
    definition_short = schema.StringField()
    internal_note = schema.StringField()
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
    subject = schema.ListField(required=False, mandatory_in_list={'scheme': {}}, schema={
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
    contacts = schema.ListField()
    calendars = schema.ListField()
    files = schema.ListField()
    links = schema.ListField()
    dates = schema.DictField(required=True)
    ednote = schema.StringField()


class PlanningSchema(BaseSchema):
    """
    The planning schema used to validate the planning form
    """

    planning_date = DateTimeField(required=True)
    slugline = schema.StringField(required=True)
    place = schema.ListField()
    anpa_category = schema.ListField()
    description_text = schema.StringField()
    ednote = schema.StringField()
    headline = schema.StringField()
    internal_note = schema.StringField()
    subject = schema.ListField(required=False, mandatory_in_list={'scheme': {}}, schema={
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
    agendas = schema.ListField()
    flags = schema.DictField()


class CoverageSchema(BaseSchema):
    ednote = schema.StringField()
    g2_content_type = schema.ListField(required=True)
    genre = schema.ListField()
    keyword = schema.ListField()
    headline = schema.StringField()
    internal_note = schema.StringField()
    news_coverage_status = schema.ListField()


DEFAULT_EDITOR = [{
    'name': 'event',
    'editor': {
        'slugline': {'enabled': True},
        'place': {'enabled': False},
        'anpa_category': {'enabled': True},
        'definition_long': {'enabled': True},
        'definition_short': {'enabled': True},
        'internal_note': {'enabled': True},
        'location': {'enabled': True},
        'name': {'enabled': True},
        'occur_status': {'enabled': True},
        'subject': {'enabled': True},
        'contacts': {'enabled': True},
        'calendars': {'enabled': True},
        'files': {'enabled': True},
        'links': {'enabled': True},
        'dates': {
            'enabled': True,
            'default_duration_on_change': 1
        },
        'ednote': {'enabled': True}
    },
    'schema': dict(EventSchema)
}, {
    'name': 'planning',
    'editor': {
        'planning_date': {'enabled': True},
        'slugline': {'enabled': True},
        'place': {'enabled': False},
        'anpa_category': {'enabled': True},
        'description_text': {'enabled': True},
        'ednote': {'enabled': True},
        'internal_note': {'enabled': True},
        'subject': {'enabled': True},
        'agendas': {'enabled': True},
        'flags': {'enabled': True},
        'urgency': {'enabled': True}
    },
    'schema': dict(PlanningSchema)
}, {
    'name': 'coverage',
    'editor': {
        'slugline': {'enabled': True},
        'keyword': {'enabled': False},
        'ednote': {'enabled': True},
        'g2_content_type': {'enabled': True},
        'genre': {'enabled': True},
        'internal_note': {'enabled': True},
        'scheduled': {'enabled': True},
        'news_coverage_status': {'enabled': True}
    },
    'schema': dict(CoverageSchema)
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
    'editor':
        {'type': 'dict'},
    # schema controls the validation of fields at the front end.
    'schema':
        {'type': 'dict'},

    # publishSchema controls the validation of fields when publishing.
    'publishSchema':
        {'type': 'dict'}
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

        return ListCursor(merged_planning_types)

    def merge_planning_type(self, planning_type, default_planning_type):
        # Update schema fields with database schema fields
        updated_planning_type = deepcopy(default_planning_type)
        updated_planning_type['schema'].update(planning_type.get('schema', {}))
        updated_planning_type['editor'].update(planning_type.get('editor', {}))

        planning_type['schema'] = updated_planning_type['schema']
        planning_type['editor'] = updated_planning_type['editor']


class PlanningTypesResource(superdesk.Resource):
    endpoint_name = 'planning_types'
    schema = planning_types_schema
    resource_methods = ['GET']
