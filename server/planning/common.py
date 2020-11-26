# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import re
import time
from flask import current_app as app
from collections import namedtuple
from datetime import timedelta
from superdesk.resource import not_analyzed, build_custom_hateoas
from superdesk import get_resource_service, logger
from superdesk.metadata.item import ITEM_TYPE, CONTENT_STATE
from superdesk.utc import utcnow
from superdesk.celery_app import celery
from apps.archive.common import get_user, get_auth
from apps.publish.enqueue import get_enqueue_service
from .item_lock import LOCK_SESSION, LOCK_ACTION, LOCK_TIME, LOCK_USER
from eve.utils import config, ParsedRequest
from werkzeug.datastructures import MultiDict
from superdesk.etree import parse_html
import json
from bson import ObjectId

ITEM_STATE = 'state'
ITEM_EXPIRY = 'expiry'

UPDATE_SINGLE = 'single'
UPDATE_FUTURE = 'future'
UPDATE_ALL = 'all'
UPDATE_METHODS = (UPDATE_SINGLE, UPDATE_FUTURE, UPDATE_ALL)

workflow_state = ['draft', 'active', 'ingested', 'scheduled', 'killed',
                  'cancelled', 'rescheduled', 'postponed', 'spiked']

WORKFLOW_STATE = namedtuple('WORKFLOW_STATE', ['DRAFT', 'ACTIVE', 'INGESTED', 'SCHEDULED', 'KILLED',
                                               'CANCELLED', 'RESCHEDULED', 'POSTPONED', 'SPIKED']
                            )(*workflow_state)

post_state = ['usable', 'cancelled']
POST_STATE = namedtuple('POST_STATE', ['USABLE', 'CANCELLED'])(*post_state)

PLANNING_ITEM_CUSTOM_HATEOAS = {'self': {'title': 'planning', 'href': '/planning/{_id}'}}
EVENT_ITEM_CUSTOM_HATEOAS = {'self': {'title': 'events', 'href': '/events/{_id}'}}
MAX_MULTI_DAY_EVENT_DURATION = 'MAX_MULTI_DAY_EVENT_DURATION'


POST_STATE_SCHEMA = {
    'type': 'string',
    'allowed': post_state,
    'nullable': True,
    'mapping': not_analyzed
}

WORKFLOW_STATE_SCHEMA = {
    'type': 'string',
    'allowed': workflow_state,
    'default': WORKFLOW_STATE.DRAFT,
    'mapping': not_analyzed
}

assignment_workflow_state = ['draft', 'assigned', 'in_progress', 'completed', 'submitted', 'cancelled']
ASSIGNMENT_WORKFLOW_STATE = namedtuple('ASSIGNMENT_WORKFLOW_STATE',
                                       ['DRAFT', 'ASSIGNED', 'IN_PROGRESS',
                                        'COMPLETED', 'SUBMITTED', 'CANCELLED'])(*assignment_workflow_state)

DEFAULT_ASSIGNMENT_PRIORITY = 2

item_actions = ['cancel', 'postpone', 'reschedule', 'update_time', 'convert_recurring', 'planning_cancel',
                'cancel_all_coverage', 'edit']
ITEM_ACTIONS = namedtuple('ITEM_ACTIONS',
                          ['CANCEL', 'POSTPONED', 'RESCHEDULE', 'UPDATE_TIME',
                           'CONVERT_RECURRING', 'PLANNING_CANCEL', 'CANCEL_ALL_COVERAGE',
                           'EDIT'])(*item_actions)

spiked_state = ['both', 'draft', 'spiked']
SPIKED_STATE = namedtuple('SPIKED_STATE', ['BOTH', 'NOT_SPIKED', 'SPIKED'])(*spiked_state)
TEMP_ID_PREFIX = 'tempId-'
TO_BE_CONFIRMED_FIELD = '_time_to_be_confirmed'
TO_BE_CONFIRMED_FIELD_SCHEMA = {'type': 'boolean'}


def set_item_expiry(doc):
    expiry_minutes = app.settings.get('PLANNING_EXPIRY_MINUTES', None)
    if expiry_minutes is not None:
        doc[ITEM_EXPIRY] = utcnow() + timedelta(minutes=expiry_minutes)
    else:
        doc[ITEM_EXPIRY] = None


def get_max_recurrent_events(current_app=None):
    if current_app is not None:
        return int(current_app.config.get('MAX_RECURRENT_EVENTS', 200))
    return int(app.config.get('MAX_RECURRENT_EVENTS', 200))


def planning_auto_assign_to_workflow(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_AUTO_ASSIGN_TO_WORKFLOW', False)
    return app.config.get('PLANNING_AUTO_ASSIGN_TO_WORKFLOW', False)


def event_templates_enabled(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_EVENT_TEMPLATES_ENABLED', False)
    return app.config.get('PLANNING_EVENT_TEMPLATES_ENABLED', False)


def get_long_event_duration_threshold(current_app=None):
    if current_app is not None:
        return current_app.config.get('LONG_EVENT_DURATION_THRESHOLD', -1)
    return app.config.get('LONG_EVENT_DURATION_THRESHOLD', -1)


def get_planning_allow_scheduled_updates(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_ALLOW_SCHEDULED_UPDATES', True)
    return app.config.get('PLANNING_ALLOW_SCHEDULED_UPDATES', True)


def get_planning_use_xmp_for_pic_assignments(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS', False)
    return app.config.get('PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS', False)


def get_planning_xmp_assignment_mapping(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_XMP_ASSIGNMENT_MAPPING', '')
    return app.config.get('PLANNING_XMP_ASSIGNMENT_MAPPING', '')


def get_planning_use_xmp_for_pic_slugline(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_USE_XMP_FOR_PIC_SLUGLINE', False)
    return app.config.get('PLANNING_USE_XMP_FOR_PIC_SLUGLINE', False)


def get_planning_xmp_slugline_mapping(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_XMP_SLUGLINE_MAPPING', '')
    return app.config.get('PLANNING_XMP_SLUGLINE_MAPPING', '')


def get_planning_allowed_coverage_link_types(current_app=None):
    return (current_app or app).config.get(
        'PLANNING_ALLOWED_COVERAGE_LINK_TYPES',
        []
    )


def get_assignment_acceptance_email_address(current_app=None):
    if current_app is not None:
        return current_app.config.get('PLANNING_ACCEPT_ASSIGNMENT_EMAIL', '')
    return app.config.get('PLANNING_ACCEPT_ASSIGNMENT_EMAIL', '')


def remove_lock_information(item):
    item.update({
        LOCK_USER: None,
        LOCK_SESSION: None,
        LOCK_TIME: None,
        LOCK_ACTION: None
    })


def get_coverage_cancellation_state():
    coverage_states = get_resource_service('vocabularies').find_one(
        req=None,
        _id='newscoveragestatus'
    )

    coverage_cancel_state = None
    if coverage_states:
        coverage_cancel_state = next((x for x in coverage_states.get('items', [])
                                      if x['qcode'] == 'ncostat:notint'), None)
        coverage_cancel_state.pop('is_active', None)

    return coverage_cancel_state


def is_locked_in_this_session(item, user_id=None, session_id=None):
    if user_id is None:
        user = get_user(required=True)
        user_id = str(user.get(config.ID_FIELD))

    if session_id is None:
        session = get_auth()
        session_id = str(session.get(config.ID_FIELD))

    return str(item.get(LOCK_USER)) == user_id and str(item.get(LOCK_SESSION)) == session_id


def format_address(location=None, seperator=' '):
    """Location is enhanced with the formatted address

    :param dict location:
    """
    if not location:
        return

    address = location.get('address') or {}
    formatted_address = []
    if address.get('line'):
        formatted_address.append(address.get('line')[0])

    formatted_address.append(address.get('area'))
    formatted_address.append(address.get('locality'))
    formatted_address.append(address.get('postal_code'))
    formatted_address.append(address.get('country'))

    location['formatted_address'] = seperator.join([a for a in formatted_address if a]).strip()


def get_formatted_address(location, seperator=' '):
    """Return the formatted address for the loaction

    :param location:
    :return:
    """
    format_address(location, seperator=seperator)
    return location.get('name', '') + seperator + location.get('formatted_address', '')


def get_street_map_url(current_app=None):
    """Get the Street Map URL"""
    if current_app is not None:
        return current_app.config.get('STREET_MAP_URL', 'https://www.google.com.au/maps/?q=')
    return app.config.get('STREET_MAP_URL', 'https://www.google.com.au/maps/?q=')


def get_item_post_state(item, new_post_state, repost=False):
    if repost:
        return item.get('state') if item.get('state') in [WORKFLOW_STATE.SCHEDULED,
                                                          WORKFLOW_STATE.KILLED,
                                                          WORKFLOW_STATE.POSTPONED] else WORKFLOW_STATE.SCHEDULED

    if new_post_state == POST_STATE.CANCELLED:
        return WORKFLOW_STATE.KILLED

    if item.get('pubstatus') != POST_STATE.USABLE:
        # posting for first time, default to 'schedule' state
        return WORKFLOW_STATE.SCHEDULED

    return item.get('state')


def post_required(updates, original):
    pub_status = None
    # Save&Post or Save&Unpost
    if updates.get('pubstatus'):
        pub_status = updates['pubstatus']
    elif original.get('pubstatus') == POST_STATE.USABLE:
        # From item actions
        pub_status = POST_STATE.USABLE

    return pub_status is not None


def update_post_item(updates, original):
    """Method to update(re-post) a posted item after the item is updated"""
    pub_status = None
    # Save&Post or Save&Unpost
    if updates.get('pubstatus'):
        pub_status = updates['pubstatus']
    elif original.get('pubstatus') == POST_STATE.USABLE:
        # From item actions
        pub_status = POST_STATE.USABLE

    if pub_status is not None:
        if original.get(ITEM_TYPE):
            resource_name = 'events_post' if original.get(ITEM_TYPE) == 'event' else 'planning_post'
            item_post_service = get_resource_service(resource_name)
            doc = {
                'etag': updates.get('_etag'),
                original.get(ITEM_TYPE): original.get(config.ID_FIELD),
                'pubstatus': pub_status
            }
            return item_post_service.post([doc])


def get_coverage_type_name(qcode):
    """
    Given the qcode for a coverage type return the coresponding name

    :param qcode:
    :return: the name
    """
    coverage_types = get_resource_service('vocabularies').find_one(req=None, _id='g2_content_type')

    coverage_type = {}
    if coverage_types:
        coverage_type = next((x for x in coverage_types.get('items', []) if x['qcode'] == qcode), {})

    return coverage_type.get('name', qcode)


def remove_autosave_on_spike(item):
    if item.get('lock_action') == 'edit':
        autosave_service = get_resource_service('planning_autosave')
        if item.get('type') == 'event':
            autosave_service = get_resource_service('event_autosave')

        autosave_service.delete_action(lookup={'_id': item.get(config.ID_FIELD)})


def update_returned_document(doc, item, custom_hateoas):
    doc.clear()
    doc.update(item)
    build_custom_hateoas(custom_hateoas, doc)
    return [doc['_id']]


def get_version_item_for_post(item):
    version = int(time.time() * 1000)
    item.setdefault(config.VERSION, version)
    item.setdefault('item_id', item['_id'])
    return version, item


@celery.task(soft_time_limit=600)
def enqueue_planning_item(id):
    """
    Get the version of the item to be published from the planning versions collection and enqueue it.

    :param id:
    :return:
    """
    planning_version = get_resource_service('published_planning').find_one(req=None, _id=id)
    if planning_version:
        try:
            get_enqueue_service('publish').enqueue_item(planning_version.get('published_item'), 'event')
        except Exception:
            logger.exception('Failed to queue {} item {}'.format(planning_version.get('type'), id))
    else:
        logger.error('Failed to retrieve planning item from planning versions with id: {}'.format(id))


def sanitize_query_text(text):
    """Sanitize the query text"""
    if text:
        regex = re.compile('/')
        text = regex.sub('\\/', text)
        regex = re.compile('[()]')
        text = regex.sub('', text)
    return text


def get_start_of_next_week(date=None, start_of_week=0):
    """Get the start of the next week based on the date and start of week"""
    current_date = (date if date else utcnow()).replace(hour=0, minute=0, second=0, microsecond=0)
    weekday = current_date.isoweekday()
    weekDay = 0 if weekday == 7 else weekday
    diff = start_of_week - weekDay if weekday < start_of_week else 7 - weekDay + start_of_week
    return current_date + timedelta(days=diff)


def get_event_max_multi_day_duration(current_app=None):
    """Get the max multi day duration"""
    if current_app is not None:
        return int(current_app.config.get(MAX_MULTI_DAY_EVENT_DURATION, 0))
    return int(app.config.get(MAX_MULTI_DAY_EVENT_DURATION, 0))


def set_original_creator(doc):
    """Set the original creator"""
    usr = get_user()
    user = str(usr.get('_id', doc.get('original_creator', ''))) or None
    if not user:
        doc.pop('original_creator', None)
        return
    doc['original_creator'] = user


def list_uniq_with_order(list):
    seen = set()
    seen_add = seen.add
    return [x for x in list if not (x in seen or seen_add(x))]


def set_ingested_event_state(updates, original):
    """Set the ingested event state to draft"""
    if not updates.get('version_creator'):
        return

    # don't change status to draft when event was duplicated
    if ((original.get(ITEM_STATE) == WORKFLOW_STATE.INGESTED
         and not updates.get('duplicate_to')
         and not updates.get(ITEM_STATE))):
        updates[ITEM_STATE] = WORKFLOW_STATE.DRAFT


def set_actioned_date_to_event(updates, original):
    # If event lasts more than a day, set actioned_date
    if type(updates) is dict and ((original['dates']['end'] -
                                  original['dates']['start']).total_seconds() / 60) >= (24 * 60):
        now = utcnow()
        if original['dates']['start'] < now and original['dates']['end'] > now:
            updates['actioned_date'] = now
        else:
            updates['actioned_date'] = original['dates']['start']


def get_archive_items_for_assignment(assignment_id, descending_rewrite_seq=True):
    if not assignment_id:
        return []

    req = ParsedRequest()
    req.args = MultiDict()
    must_not = [{'term': {'state': 'spiked'}}]
    must = [{'term': {'assignment_id': str(assignment_id)}},
            {'term': {'type': 'text'}}]

    query = {
        'query': {
            'filtered': {
                'filter': {
                    'bool': {
                        'must': must,
                        'must_not': must_not
                    }
                }
            }
        }
    }
    query['sort'] = [{'rewrite_sequence': 'desc' if descending_rewrite_seq else 'asc'}]
    query['size'] = 200

    req.args['source'] = json.dumps(query)
    req.args['repo'] = 'archive,published,archived'
    return list(get_resource_service('search').get(req, None))


def get_related_items(item, assignment=None):
    # If linking updates is not configured, return just this item
    if not planning_link_updates_to_coverage():
        return [item]

    req = ParsedRequest()
    req.args = MultiDict()
    must_not = [{'term': {'state': 'spiked'}}]
    must = [{'term': {'event_id': item.get('event_id')}},
            {'term': {'type': 'text'}}]

    if assignment:
        must.append({"term": {"assignment_id": str(assignment.get(config.ID_FIELD))}})

    query = {
        'query': {
            'filtered': {
                'filter': {
                    'bool': {
                        'must': must,
                        'must_not': must_not
                    }
                }
            }
        }
    }
    query['sort'] = [{'rewrite_sequence': 'asc'}]
    query['size'] = 200

    req.args['source'] = json.dumps(query)
    req.args['repo'] = 'archive,published,archived'
    items_list = get_resource_service('search').get(req, None)

    archive_list = {}
    for i in items_list:
        # If item is published, get archive item or the item itself
        if i.get(config.ID_FIELD) not in archive_list:
            archive_list[i.get(config.ID_FIELD)] = i.get('archive_item') or i

    # This is to ensure if elastic search is not updated, we add or remove the item
    if str(item.get(config.ID_FIELD)) not in archive_list:
        return list(archive_list.values()) + [item]
    else:
        return list(archive_list.values())


def update_assignment_on_link_unlink(assignment_id, item, published_updated=[]):
    published_states = [CONTENT_STATE.SCHEDULED,
                        CONTENT_STATE.PUBLISHED,
                        CONTENT_STATE.KILLED,
                        CONTENT_STATE.RECALLED,
                        CONTENT_STATE.CORRECTED]
    if item.get('state') in published_states and item.get(config.ID_FIELD) not in published_updated \
            and not item.get('_type') == 'archived':
        # This will also update corrected, killed version of the published item
        get_resource_service('published').update_published_items(
            item[config.ID_FIELD],
            'assignment_id', assignment_id)

        published_updated.append(item.get(config.ID_FIELD))

    if item.get('_type') == 'archived':
        get_resource_service('archived').system_update(ObjectId(item[config.ID_FIELD]),
                                                       {'assignment_id': assignment_id}, item)
    else:
        get_resource_service('archive').system_update(item[config.ID_FIELD], {'assignment_id': assignment_id}, item)


def planning_link_updates_to_coverage(current_app=None):
    return (current_app if current_app else app).config.get('PLANNING_LINK_UPDATES_TO_COVERAGES', False)


def is_valid_event_planning_reason(updates, original):
    """Custom validation for reason field.

    This method is called from item action endpoints to validate the reason is required or not.
    It looks for the reason field schema in the planning_types resource based on the item_type and lock_action.
    To turn on the reason field validation for event_postpone endpoint add following to the planning_types collection
    {
        "_id": "event_postpone",
        "name": "event_postpone",
        "schema": {
            "reason": { "required": True }
        }
    }

    :param dict updates: updates for the endpoint
    :param dict original: original document
    """
    if not original:
        return True

    lock_action = original.get(LOCK_ACTION)
    item_type = original.get(ITEM_TYPE)

    # get the validator based on the item_type and lock_action
    validator = get_resource_service('planning_types').find_one(
        req=None,
        name='{}_{}'.format(item_type, lock_action)
    ) or {}

    if not validator.get('schema'):
        return True

    reason_mapping = validator.get('schema').get('reason') or {}
    if reason_mapping.get('required') and not updates.get('reason'):
        return False
    return True


def get_contacts_from_item(item):
    contact_ids = item.get('event_contact_info') or []
    if (item.get('event') or {}).get('event_contact_info'):
        contact_ids = item['event']['event_contact_info']
    contact_ids = [str(c) for c in contact_ids]
    query = {"query": {"bool": {"must": [{"terms": {"_id": contact_ids}}, {"term": {"public": "true"}}]}}}
    contacts = get_resource_service('contacts').search(query)
    return list(contacts)


def get_next_assignment_status(assignment, next_state):
    current_state = ((assignment or {}).get('assigned_to') or {}).get('state')
    if current_state == ASSIGNMENT_WORKFLOW_STATE.CANCELLED:
        return ASSIGNMENT_WORKFLOW_STATE.CANCELLED
    elif current_state == ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
        return ASSIGNMENT_WORKFLOW_STATE.COMPLETED
    else:
        return next_state


def get_first_paragraph_text(input_string):
    try:
        elem = parse_html(input_string, content='html')
    except ValueError as e:
        logger.warning(e)
    else:
        # all non-empty paragraphs: ignores <p><br></p> sections
        return get_text_from_elem(elem) or get_text_from_elem(elem, tag=None)


def get_text_from_elem(elem, tag='.//p'):
    if not tag:
        for t in elem.itertext():
            return t  # Return first text item

    for p in elem.iterfind(tag):
        if p.text:
            return p.text


def get_delivery_publish_time(updates, original={}):
    schdl_stngs = (updates.get('schedule_settings') or original.get('schedule_settings', {}))
    return schdl_stngs.get('utc_publish_schedule') or updates.get('firstpublished') or original.get('firstpublished')


def get_coverage_for_assignment(assignment):
    planning_item = get_resource_service('planning').find_one(req=None, _id=assignment.get('planning_item'))
    return next((c for c in (planning_item or {}).get('coverages', [])
                 if c['coverage_id'] == assignment['coverage_item']), None)


def strip_text_fields(item, fields=['name', 'slugline']):
    if not item:
        return

    for f in fields:
        if item.get(f):
            item[f] = item[f].strip()


def sanitize_array_fields(item, fields=['calendars', 'place', 'contacts', 'anpa_category', 'subject',
                                        'files', 'links', 'agenda', 'coverages']):
    for field in fields:
        if field in item:
            if not isinstance(item[field], list):
                item[field] = []
            else:
                item[field] = [v for v in item[field] if v is not None]


def sanitize_input_data(item):
    if not item:
        return

    strip_text_fields(item)
    sanitize_array_fields(item)

    if item.get('type') == 'planning':
        for c in item.get('coverages') or []:
            sanitize_array_fields(c.get('planning') or {}, ['keyword', 'genre'])


def is_content_link_to_coverage_allowed(archive_item):
    allowed_coverage_link_types = get_planning_allowed_coverage_link_types()

    return True if not len(allowed_coverage_link_types) else \
        archive_item['type'] in allowed_coverage_link_types
