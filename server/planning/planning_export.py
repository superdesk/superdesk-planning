
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
{% if item.get('event') %}
<p>Location: {{ item.event.location[0].name }}.</p>
{% endif %}
<p>Editorial note: {{ item.ednote }}</p>
<p>Planned coverage: {% for coverage in item._coverages %}
    {{ coverage.g2_content_type }}{% if not loop.last %}, {% endif %}
{% endfor %}</p>
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
    return render_template_string(template, items=items)


class PlanningExportService(superdesk.Service):
    def create(self, docs):
        ids = []
        template = superdesk.get_resource_service('content_templates').find_one(req=None,
                                                                                template_type='planning_export')
        if not template:
            template = {'data': {}}
        production = superdesk.get_resource_service('archive')
        for doc in docs:
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=doc.pop('desk'))
            planning_items = doc.pop('items', [])
            item = get_item_from_template(template)
            item[current_app.config['VERSION']] = 1
            item.setdefault('type', 'text')
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
