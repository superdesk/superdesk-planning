import superdesk
from flask import render_template_string, current_app, render_template
from superdesk.errors import SuperdeskApiError
from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template
from apps.archive.common import insert_into_versions
from copy import deepcopy
from planning.common import WORKFLOW_STATE, format_address, get_contacts_from_item
from eve.utils import config
from superdesk.utc import utc_to_local, get_timezone_offset, utcnow


class PlanningArticleExportResource(superdesk.Resource):
    schema = {
        'items': {
            'type': 'list',
            'required': True,
        },
        'desk': superdesk.Resource.rel('desks', nullable=True),
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


def group_items_by_agenda(items):
    """
    Returns an array with all agendas for the provided items.

    Each agenda will have an attribute 'items'.
    An extra agenda with id: 'unassigned' is returned
        containing items without any agenda.
    """
    if len(items) == 0:
        return []

    agendas = [{'_id': 'unassigned', 'name': 'No Agenda Assigned', 'items': []}]
    for item in items:
        item_agendas = item.get('agendas', [])
        if len(item_agendas) == 0:
            item_agendas = ['unassigned']
        for agenda_id in item_agendas:
            agenda_in_array = [a for a in agendas if a['_id'] == agenda_id]
            if len(agenda_in_array) > 0:
                agenda_in_array[0]['items'].append(item)
            else:
                agenda = superdesk.get_resource_service('agenda').find_one(req=None, _id=str(agenda_id))
                if agenda is not None:
                    agenda['items'] = [item]
                    agendas.append(agenda)
    return agendas


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
                elif (c.get('assigned_to') or {}).get('desk'):
                    item['assignees'].append('Desk')

            item['contacts'] = get_contacts_from_item(item)

        if resource_type == 'planning':
            populate_assignees_contacts(deepcopy(item), item, users)
        else:
            for p in (item.get('plannings') or []):
                populate_assignees_contacts(p, item, users)

        users = superdesk.get_resource_service('users').find(where={
            '_id': {'$in': users}
        })
        users = ["{0}, {1}".format(u.get('last_name'), u.get('first_name')) for u in users]

        item['assignees'].extend(users)
        set_item_place(item)

        item['description_text'] = item.get('description_text') or (item.get('event') or {}).get('definition_short')
        item['slugline'] = item.get('slugline') or (item.get('event') or {}).get('name')

        # Handle dates and remote time-zones
        if item.get('dates') or (item.get('event') or {}).get('dates'):
            dates = item.get('dates') or item.get('event').get('dates')
            item['schedule'] = utc_to_local(config.DEFAULT_TIMEZONE, dates.get('start'))
            if get_timezone_offset(config.DEFAULT_TIMEZONE, utcnow()) !=\
                    get_timezone_offset(dates.get('tz'), utcnow()):
                item['schedule'] = "{} ({})".format(item['schedule'].strftime('%H%M'), item['schedule'].tzname())
            else:
                item['schedule'] = item['schedule'].strftime('%H%M')

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
    agendas = group_items_by_agenda(items)

    for key, value in template.items():
        if value.endswith(".html"):
            article[key.replace('_template', '')] = render_template(value, items=items, agendas=agendas)
        else:
            article[key] = render_template_string(value, items=items, agendas=agendas)

    return article


def get_desk_template(desk):
    default_content_template = desk.get('default_content_template')
    if default_content_template:
        return superdesk.get_resource_service('content_templates').find_one(req=None, _id=default_content_template)

    return {}


def set_item_place(item):
    item['place'] = item.get('place') or (item.get('event') or {}).get('place')
    item['place'] = [p.get('name') for p in item['place']] if item.get('place') else None


class PlanningArticleExportService(superdesk.Service):
    def create(self, docs):
        ids = []
        production = superdesk.get_resource_service('archive')
        for doc in docs:
            item_type = doc.pop('type')
            item_list = get_items(doc.pop('items', []), item_type)
            desk = superdesk.get_resource_service('desks').find_one(req=None, _id=doc.pop('desk')) or {}
            content_template = get_desk_template(desk)
            item = get_item_from_template(content_template)
            item[current_app.config['VERSION']] = 1
            item.setdefault('type', 'text')
            item.setdefault('slugline', 'Planning' if item_type == 'planning' else 'Event')
            item['task'] = {
                'desk': desk.get('_id'),
                'user': get_user_id(),
                'stage': desk.get('working_stage'),
            }
            item_from_template = generate_text_item(item_list, doc.pop('template', None), item_type)
            item.update(item_from_template)
            ids = production.post([item])
            insert_into_versions(doc=item)
            doc.update(item)
            ids.append(doc['_id'])
        return ids

    def export_events_to_text(self, items, format='utf-8'):
        rendered_item_list = []
        for item in items:
            state = item['state'] if item.get('state') in [WORKFLOW_STATE.CANCELLED, WORKFLOW_STATE.RESCHEDULED,
                                                           WORKFLOW_STATE.POSTPONED] else None
            location = item['location'][0] if len(item.get('location') or []) > 0 else None
            if location:
                format_address(location)
                location = location.get('name') if not location.get('formatted_address') else \
                    '{0}, {1}'.format(location.get('name'), location['formatted_address'])

            contacts = []
            for contact in get_contacts_from_item(item):
                contact_info = ['{0} {1}'.format(contact.get('first_name'), contact.get('last_name'))]
                phone = None
                if (contact.get('job_title')):
                    contact_info[0] = contact_info[0] + ' ({})'.format(contact['job_title'])
                if (len(contact.get('contact_email') or [])) > 0:
                    contact_info.append(contact['contact_email'][0])

                if (len(contact.get('contact_phone') or [])) > 0:
                    phone = next((p for p in contact['contact_phone'] if p.get('public')), None)
                elif len(contact.get('mobile') or []) > 0:
                    phone = next((m for m in contact['mobile'] if m.get('public')), None)

                if phone:
                    contact_info.append(phone.get('number'))

                contacts.append(", ".join(contact_info))

            date_time_format = "%a %d %b %Y, %H:%M"
            schedule = "{0}-{1}" .format(item['dates']['start'].strftime(date_time_format),
                                         item['dates']['end'].strftime("%H:%M"))
            if ((item['dates']['end'] - item['dates']['start']).total_seconds() / 60) >= (24 * 60):
                schedule = "{0} to {1}".format(item['dates']['start'].strftime(date_time_format),
                                               item['dates']['end'].strftime(date_time_format))

            set_item_place(item)
            rendered_item_list.append(
                render_template("events_download_format.txt",
                                item=item,
                                state=state,
                                location=location,
                                contacts=contacts,
                                schedule=schedule))

        if len(rendered_item_list) > 0:
            return str.encode("\r\n\r\n".join(rendered_item_list), format)
