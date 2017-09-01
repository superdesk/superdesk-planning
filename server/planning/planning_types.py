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
from superdesk.utils import ListCursor


class BaseSchema(schema.Schema):
    slugline = schema.StringField()


class EventSchema(BaseSchema):
    """
    The event schema is used for validation of the event edit form
    """

    anpa_category = schema.ListField()
    definition_long = schema.StringField()
    definition_short = schema.StringField()
    internal_note = schema.StringField()
    location = schema.StringField()
    name = schema.StringField(required=True)
    occur_status = schema.ListField()
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
    calendars = schema.ListField()
    files = schema.ListField()
    links = schema.ListField()


class PlanningSchema(BaseSchema):
    """
    The planning schema used to validate the planning form
    """

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
    g2_content_type = schema.ListField()
    genre = schema.ListField()
    headline = schema.StringField()
    internal_note = schema.StringField()


DEFAULT_EDITOR = [{
    'name': 'events',
    'editor': {
        'slugline': {'enabled': True},
        'anpa_category': {'enabled': True},
        'definition_long': {'enabled': True},
        'definition_short': {'enabled': True},
        'internal_note': {'enabled': True},
        'location': {'enabled': True},
        'name': {'enabled': True},
        'occur_status': {'enabled': True},
        'subject': {'enabled': True},
        'calendars': {'enabled': True},
        'files': {'enabled': True},
        'links': {'enabled': True}
    },
    'schema': dict(EventSchema)},
    {
        'name': 'planning',
        'editor': {
            'slugline': {'enabled': True},
            'anpa_category': {'enabled': True},
            'description_text': {'enabled': True},
            'ednote': {'enabled': True},
            'headline': {'enabled': True},
            'internal_note': {'enabled': True},
            'subject': {'enabled': True},
            'agendas': {'enabled': True},
            'flags': {'enabled': True}
        },
        'schema': dict(PlanningSchema)},
    {
        'name': 'coverage',
        'editor': {
            'slugline': {'enabled': True},
            'ednote': {'enabled': True},
            'g2_content_type': {'enabled': True},
            'genre': {'enabled': True},
            'headline': {'enabled': True},
            'internal_note': {'enabled': True},
            'scheduled': {'enabled': True}
        },
        'schema': dict(CoverageSchema)}]

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
        {'type': 'dict'}
}


class PlanningTypesService(superdesk.Service):
    """Planning types service

    Provide a service that returns what fields should be shown in the edit forms in planning, in the edit dictionary.
    Also provide a schema to allow the client to validate the values entered in the forms.
    Entries can be overridden by providing alternates in the planning_types mongo collection.
    """

    def get(self, req, lookup):
        planning_types = list(super().get(req, lookup))

        # If the name does not exist in the list returned from mongo then we need to insert is from the DEFAULT_EDITOR
        # list
        overidden_names = [l.get('name') for l in planning_types]
        for planning_type in DEFAULT_EDITOR:
            if not planning_type.get('name') in overidden_names:
                planning_types.append(planning_type)

        return ListCursor(planning_types)


class PlanningTypesResource(superdesk.Resource):
    endpoint_name = 'planning_types'
    schema = planning_types_schema
    resource_methods = ['GET']
