# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from dateutil import tz

from flask import render_template_string, current_app, render_template
from eve.utils import config
from bson import ObjectId

from superdesk.utc import utc_to_local, get_timezone_offset, utcnow
from superdesk import get_resource_service, Resource, Service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import get_schema

from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template

from planning.common import WORKFLOW_STATE, format_address, get_contacts_from_item, ASSIGNMENT_WORKFLOW_STATE,\
    get_first_paragraph_text
from planning.archive import create_item_from_template


PLACEHOLDER_TEXT = r'{{content}}'
PLACEHOLDER_HTML = '<p>%s</p>' % PLACEHOLDER_TEXT


class PlanningArticleExportResource(Resource):
    schema = get_schema(versioning=True)
    schema.update({
        'items': {
            'type': 'list',
            'required': True,
        },
        'desk': Resource.rel('desks', nullable=True),
        'template': {'type': 'string'},
        'type': {
            'type': 'string',
            'default': 'planning',
        },
        'article_template': Resource.rel('content_templates', nullable=True)
    })

    item_methods = []
    resource_methods = ['POST']
    privileges = {'POST': 'planning'}


def get_item(_id, resource):
    item = get_resource_service(resource).find_one(None, _id=_id) or {}
    if item.get('event_item'):
        item['event'] = get_resource_service('events').find_one(None, _id=item['event_item'])
    elif resource == 'events':
        item['plannings'] = get_resource_service('events').get_plannings_for_event(item)

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
    Each item.agenda will be converted from an id to
        the actual agenda object
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
                agenda = get_resource_service('agenda').find_one(req=None, _id=str(agenda_id))
                if agenda is not None and agenda['is_enabled']:
                    agenda['items'] = [item]
                    agendas.append(agenda)

    # replace each agenda id with the actual object
    for item in items:
        item_agendas_ids = item.get('agendas', [])
        item_agendas = []
        for agenda_id in item_agendas_ids:
            agenda_in_array = [a for a in agendas if a['_id'] == agenda_id]
            if len(agenda_in_array) > 0:
                item_agendas.append(agenda_in_array[0])
        item['agendas'] = item_agendas

    return agendas


def inject_internal_converages(items):
    coverage_labels = {}
    cv = get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')
    if cv:
        coverage_labels = {_type['qcode']: _type['name'] for _type in cv['items']}

    for item in items:
        if item.get('coverages'):
            item['internal_coverages'] = []
            for coverage in item.get('coverages'):
                user = None
                assigned_to = coverage.get('assigned_to') or {}

                if assigned_to.get('coverage_provider'):
                    user = assigned_to['coverage_provider']
                elif assigned_to.get('user'):
                    user = get_resource_service('users').find_one(req=None, _id=assigned_to.get('user'))

                coverage_type = coverage.get('planning').get('g2_content_type')
                label = coverage_labels.get(coverage_type, coverage_type)
                if user is not None:
                    item['internal_coverages'].append({"user": user, "type": label})
                else:
                    item['internal_coverages'].append({"type": label})


def generate_text_item(items, template_name, resource_type):
    template = get_resource_service('planning_export_templates').get_export_template(template_name, resource_type)
    archive_service = get_resource_service('archive')
    if not template:
        raise SuperdeskApiError.badRequestError('Invalid template selected')

    for item in items:
        # Create list of assignee with preference to coverage_provider, if not, assigned user
        item['published_archive_items'] = []
        item['assignees'] = []
        item['text_assignees'] = []
        item['contacts'] = []
        text_users = []
        text_desks = []
        users = []
        desks = []

        def enhance_coverage(planning, item, users):

            def _enhance_assigned_provider(coverage, item, assigned_to):
                """
                Enhances the text_assignees with the contact details if it's assigned to an external provider
                """
                if assigned_to.get('contact'):
                    provider_contact = get_resource_service('contacts').find_one(req=None,
                                                                                 _id=assigned_to.get('contact'))

                    assignee_str = "{0} - {1} {2} ".format(assigned_to['coverage_provider']['name'],
                                                           provider_contact.get('first_name', ''),
                                                           provider_contact.get('last_name', ''))
                    phone_number = [n.get('number') for n in provider_contact.get('mobile', []) +
                                    provider_contact.get('contact_phone', [])]
                    if len(phone_number):
                        assignee_str += ' ({0})'.format(phone_number[0])

                    # If there is an internal note on the coverage that is different to the internal note
                    # on the planning
                    if (coverage.get('planning', {})).get('internal_note', '') \
                            and item.get('internal_note', '') !=\
                            (coverage.get('planning', {})).get('internal_note', ''):
                        assignee_str += ' ({0})'.format((coverage.get('planning', {})).get('internal_note', ''))

                    item['text_assignees'].append(assignee_str)
                else:
                    item['text_assignees'].append(assigned_to['coverage_provider']['name'])

            for c in (planning.get('coverages') or []):
                is_text = c.get('planning', {}).get('g2_content_type', '') == 'text'
                completed = (c.get('assigned_to') or {}).get('state') == ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                assigned_to = c.get('assigned_to') or {}
                user = None
                desk = None
                if assigned_to.get('coverage_provider'):
                    item['assignees'].append(assigned_to['coverage_provider']['name'])
                    if is_text and not completed:
                        _enhance_assigned_provider(c, item, assigned_to)
                elif assigned_to.get('user'):
                    user = assigned_to['user']
                    users.append(user)
                elif assigned_to.get('desk'):
                    desk = assigned_to.get('desk')
                    desks.append(desk)

                # Get abstract from related text item if coverage is 'complete'
                if is_text:
                    if completed:
                        results = list(archive_service.get_from_mongo(req=None,
                                                                      lookup={
                                                                          'assignment_id': ObjectId(
                                                                              c['assigned_to']['assignment_id']),
                                                                          'state': {'$in': ['published', 'corrected']},
                                                                          'pubstatus': 'usable',
                                                                          'rewrite_of': None
                                                                      }))
                        if len(results) > 0:
                            item['published_archive_items'].append({
                                'archive_text': get_first_paragraph_text(results[0].get('abstract')) or '',
                                'archive_slugline': results[0].get('slugline') or ''
                            })
                    elif c.get('news_coverage_status', {}).get('qcode') == 'ncostat:int':
                        if user:
                            text_users.append({'user': user,
                                               'note': (c.get('planning', {})).get('internal_note', '') if (c.get(
                                                   'planning', {})).get('internal_note', '') != item.get(
                                                   'internal_note') else None})
                        else:
                            text_desks.append(desk)

            item['contacts'] = get_contacts_from_item(item)

        if resource_type == 'planning':
            enhance_coverage(item, item, users)
        else:
            for p in (item.get('plannings') or []):
                enhance_coverage(p, item, users)

        users = get_resource_service('users').find(where={
            '_id': {'$in': users}
        })

        desks = get_resource_service('desks').find(where={
            '_id': {'$in': desks}
        })

        for u in users:
            name = u.get('display_name', "{0} {1}".format(u.get('first_name'), u.get('last_name')))
            item['assignees'].append(name)
            text_user = next((_i for _i in text_users if _i['user'] == str(u.get('_id'))) or [], None)
            if text_user:
                item['text_assignees'].append(
                    '{0} ({1})'.format(name, text_user.get('note')) if text_user.get('note') else '{0}'.format(name))

        for d in desks:
            item['assignees'].append(d['name'])
            if str(d['_id']) in text_desks:
                item['text_assignees'].append(d['name'])

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

    agendas = []
    if resource_type == 'planning':
        agendas = group_items_by_agenda(items)
        inject_internal_converages(items)

        labels = {}
        cv = get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')
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
            article[key.replace('_template', '')] = render_template(value, items=items, agendas=agendas)
        else:
            article[key] = render_template_string(value, items=items, agendas=agendas)

    return article


def get_desk_template(desk):
    default_content_template = desk.get('default_content_template')
    if default_content_template:
        return get_resource_service('content_templates').find_one(req=None, _id=default_content_template)

    return {}


def set_item_place(item):
    item['place'] = item.get('place') or (item.get('event') or {}).get('place')
    item['place'] = [p.get('name') for p in item['place']] if item.get('place') else None


class PlanningArticleExportService(Service):
    def create(self, docs, **kwargs):
        ids = []
        for doc in docs:
            item_type = doc.pop('type')
            item_list = get_items(doc.pop('items', []), item_type)
            desk = get_resource_service('desks').find_one(req=None, _id=doc.pop('desk')) or {}
            article_template = doc.pop('article_template', None)
            if article_template:
                content_template = get_resource_service('content_templates').find_one(
                    req=None, _id=article_template) or {}
            else:
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
            fields_to_override = []
            for key, val in item_from_template.items():
                placeholder = PLACEHOLDER_HTML if '_html' in key else PLACEHOLDER_TEXT
                if item.get(key) and placeholder in item[key]:
                    item[key] = item[key].replace(placeholder, val)
                    fields_to_override.append(key)
                else:
                    item[key] = val

            item = create_item_from_template(item, fields_to_override)
            doc.update(item)
            ids.append(doc['_id'])
        return ids

    def export_events_to_text(self, items, format='utf-8', template=None, tz_offset=None):
        for item in items:
            item['formatted_state'] = item['state'] if item.get('state') in [WORKFLOW_STATE.CANCELLED,
                                                                             WORKFLOW_STATE.RESCHEDULED,
                                                                             WORKFLOW_STATE.POSTPONED] else None
            location = item['location'][0] if len(item.get('location') or []) > 0 else None
            if location:
                format_address(location)
                item['formatted_location'] = location.get('name') if not location.get('formatted_address') else \
                    '{0}, {1}'.format(location.get('name'), location['formatted_address'])

            item['contacts'] = []
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

                item['contacts'].append(", ".join(contact_info))

            date_time_format = "%a %d %b %Y, %H:%M"
            item['dates']['start'] = utc_to_local(config.DEFAULT_TIMEZONE, item['dates']['start'])
            item['dates']['end'] = utc_to_local(config.DEFAULT_TIMEZONE, item['dates']['end'])
            item['schedule'] = "{0}-{1}" .format(item['dates']['start'].strftime(date_time_format),
                                                 item['dates']['end'].strftime("%H:%M"))
            if ((item['dates']['end'] - item['dates']['start']).total_seconds() / 60) >= (24 * 60):
                item['schedule'] = "{0} to {1}".format(item['dates']['start'].strftime(date_time_format),
                                                       item['dates']['end'].strftime(date_time_format))

            if tz_offset:
                tz_browser = tz.tzoffset('', int(tz_offset))
                item['browser_start'] = (item['dates']['start']).astimezone(tz_browser)
                item['browser_end'] = (item['dates']['end']).astimezone(tz_browser)

            set_item_place(item)

        return str.encode(render_template(template, items=items), format)
