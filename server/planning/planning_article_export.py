
import superdesk

from flask import render_template_string, current_app, render_template

from superdesk.errors import SuperdeskApiError
from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template
from apps.archive.common import insert_into_versions
from copy import deepcopy


class PlanningArticleExportResource(superdesk.Resource):
    schema = {
        'items': {
            'type': 'list',
            'required': True,
        },
        'desk': superdesk.Resource.rel('desks', required=True),
        'template': {'type': 'string'},
        'type': {
            'type': 'string',
            'default': 'planning',
        }
    }

    item_methods = []
    resource_methods = ['POST']
    privileges = {'POST': 'planning'}


def get_item(_id, resource):
    item = superdesk.get_resource_service(resource).find_one(None, _id=_id) or {}
    if item.get('event_item'):
        item['event'] = superdesk.get_resource_service('events').find_one(None, _id=item['event_item'])
    elif resource == 'events':
        item['plannings'] = superdesk.get_resource_service('events').get_plannings_for_event(item)

    return item


def get_items(ids, resource_type):
    resource = 'planning' if resource_type == 'planning' else 'events'
    return [get_item(_id, resource) for _id in ids]


def generate_text_item(items, template_name, resource_type):
    template = superdesk.get_resource_service('planning_export_templates').get_template(template_name, resource_type)
    if not template:
        raise SuperdeskApiError.badRequestError('Invalid template selected')

    for item in items:
        # Create list of assignee with preference to coverage_provider, if not, assigned user
        item['assignees'] = []
        item['contacts'] = []
        users = []

        def populate_assignees_contacts(planning, item, users):
            for c in (planning.get('coverages') or []):
                if (c.get('assigned_to') or {}).get('coverage_provider'):
                    item['assignees'].append(c['assigned_to']['coverage_provider']['name'])
                elif (c.get('assigned_to') or {}).get('user'):
                    users.append(c['assigned_to']['user'])

            contact_ids = item.get('event_contact_info') or []
            if (item.get('event') or {}).get('event_contact_info'):
                contact_ids = item['event']['event_contact_info']
            contacts = superdesk.get_resource_service('contacts').find(where={
                '_id': {'$in': contact_ids}
            })
            for contact in contacts:
                if contact.get('public'):
                    item['contacts'].append(contact)

        if resource_type == 'planning':
            populate_assignees_contacts(deepcopy(item), item, users)
        else:
            for p in (item.get('plannings') or []):
                populate_assignees_contacts(p, item, users)

        users = superdesk.get_resource_service('users').find(where={
            '_id': {'$in': users}
        })
        users = [u.get('display_name') for u in users]

        item['assignees'].extend(users)

    if resource_type == 'planning':
        labels = {}
        cv = superdesk.get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')
        if cv:
            labels = {_type['qcode']: _type['name'] for _type in cv['items']}

        for item in items:
            item['coverages'] = [labels.get(coverage.get('planning').get('g2_content_type'),
                                            coverage.get('planning').get('g2_content_type')) +
                                 (' (cancelled)' if coverage.get('workflow_status', '') == 'cancelled' else '')
                                 for coverage in item.get('coverages', [])
                                 if (coverage.get('planning') or {}).get('g2_content_type')]

    article = {}
    for key, value in template.items():
        if value.endswith(".html"):
            article[key] = render_template(value, items=items)
        else:
            article[key] = render_template_string(value, items=items)

    return article


def get_desk_template(desk):
    default_content_template = desk.get('default_content_template')
    if default_content_template:
        return superdesk.get_resource_service('content_templates').find_one(req=None, _id=default_content_template)

    return {}


class PlanningArticleExportService(superdesk.Service):
    def create(self, docs):
        ids = []
        production = superdesk.get_resource_service('archive')
        for doc in docs:
            item_type = doc.pop('type')
            item_list = get_items(doc.pop('items', []), item_type)
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=doc.pop('desk'))
            content_template = get_desk_template(desk)
            item = get_item_from_template(content_template)
            item[current_app.config['VERSION']] = 1
            item.setdefault('type', 'text')
            item.setdefault('slugline', 'Planning' if item_type == 'planning' else 'Event')
            item['task'] = {
                'desk': desk['_id'],
                'user': get_user_id(),
                'stage': desk['working_stage'],
            }
            item_from_template = generate_text_item(item_list, doc.pop('template', None), item_type)
            item.update(item_from_template)
            ids = production.post([item])
            insert_into_versions(doc=item)
            doc.update(item)
            ids.append(doc['_id'])
        return ids
