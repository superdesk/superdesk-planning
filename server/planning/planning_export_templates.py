# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from superdesk.utils import ListCursor


class PlanningExportTemplatesResource(superdesk.Resource):
    endpoint_name = 'planning_export_templates'
    schema = {
        'name': {
            'type': 'string',
            'iunique': True,
            'required': True,
            'nullable': False,
            'empty': False
        },
        'type': {
            'type': 'string',
            'allowed': ['event', 'planning']
        },
        'data': {'type': 'dict'},
        'label': {'type': 'string'},
    }
    resource_methods = ['GET']


default_export_templates = [{
    'name': 'default_planning',
    'label': 'Default Planning Template',
    'type': 'planning',
    'data': {
        'body_html': '''
{% for item in items %}
<p><b>{{ item.name or item.headline or item.slugline }}</b></p>
<p>{{ item.description_text }}</p>
<p></p>
{% if item.get('event', {}).get('location') %}
<p>Location: {{ item.event.location[0].name }}.</p>
{% endif %}
{% if item.get('ednote', '') != '' %}
<p>Editorial note: {{ item.ednote }}</p>
{% endif %}
{% if item.coverages %}
<p>Planned coverage: {{ item.coverages | join(', ') }}
{% endif %}
<p>---</p>
{% endfor %}
'''
    }
}, {
    'name': 'default_event',
    'label': 'Default Event Template',
    'type': 'event',
    'data': {
        'body_html': '''
{% for item in items %}
<p><b>{{ item.name }}</b>{% if item.get('location') %}{{ ', ' + item.location[0].name }}
{% endif %}{{ ', ' + item.dates.start.strftime('%H%M - ') }}{{ item.get('assignees')|join(', ') }}</p>
<p>---</p>
{% endfor %}
'''
    }
}]


class PlanningExportTemplatesService(superdesk.Service):
    def get(self, req, lookup):
        export_templates = list(super().get(req, lookup))
        export_templates.extend(default_export_templates)

        return ListCursor(export_templates)

    def get_template(self, name, type):
        template = self.find_one(req=None, name=name)
        if template:
            return template.get('data')

        template = next((t for t in default_export_templates if t['type'] == type), {})
        return template.get('data') if template else None
