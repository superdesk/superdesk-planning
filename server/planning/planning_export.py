
import superdesk

from flask import render_template_string, current_app

from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template
from apps.archive.common import insert_into_versions


TEMPLATE = '''
{% for item in items %}
<p><b>{{ item.headline or item.slugline }}</b></p>
<p>{{ item.description_text }}</p>
<p></p>
{% if item.get('event', {}).get('location') %}
<p>Location: {{ item.event.location[0].name }}.</p>
{% endif %}
<p>Editorial note: {{ item.ednote }}</p>
{% if item.coverages %}
<p>Planned coverage: {{ item.coverages | join(', ') }}
{% endif %}
<p>---</p>
{% endfor %}
'''


class PlanningExportResource(superdesk.Resource):
    schema = {
        'items': {
            'type': 'list',
            'required': True,
        },
        'desk': superdesk.Resource.rel('desks', required=True)
    }

    item_methods = []
    resource_methods = ['POST']
    privileges = {'POST': 'planning'}


def get_item(_id):
    item = superdesk.get_resource_service('planning').find_one(None, _id=_id) or {}
    if item.get('event_item'):
        item['event'] = superdesk.get_resource_service('events').find_one(None, _id=item['event_item'])
    return item


def generate_body(ids):
    items = [get_item(_id) for _id in ids]
    template = current_app.config.get('PLANNING_EXPORT_BODY_TEMPLATE', TEMPLATE)
    cv = superdesk.get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')
    if cv:
        labels = {_type['qcode']: _type['name'] for _type in cv['items']}
    else:
        labels = {}
    for item in items:
        item['coverages'] = [labels.get(coverage.get('planning').get('g2_content_type'),
                                        coverage.get('planning').get('g2_content_type'))
                             for coverage in item.get('coverages', [])
                             if (coverage.get('planning') or {}).get('g2_content_type')]
    return render_template_string(template, items=items)


def get_desk_template(desk):
    default_content_template = desk.get('default_content_template')
    if default_content_template:
        return superdesk.get_resource_service('content_templates').find_one(req=None, _id=default_content_template)

    return {}


class PlanningExportService(superdesk.Service):
    def create(self, docs):
        ids = []
        production = superdesk.get_resource_service('archive')
        for doc in docs:
            planning_items = doc.pop('items', [])
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=doc.pop('desk'))
            template = get_desk_template(desk)
            item = get_item_from_template(template)
            item[current_app.config['VERSION']] = 1
            item.setdefault('type', 'text')
            item.setdefault('slugline', 'Planning')
            item['body_html'] = generate_body(planning_items)
            item['task'] = {
                'desk': desk['_id'],
                'user': get_user_id(),
                'stage': desk['working_stage'],
            }
            ids = production.post([item])
            insert_into_versions(doc=item)
            doc.update(item)
            ids.append(doc['_id'])
        return ids
