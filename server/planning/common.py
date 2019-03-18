# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import tzlocal
import pytz
import re
from flask import current_app as app
from datetime import datetime, time, timedelta
from collections import namedtuple
from eve.utils import config
from superdesk.resource import not_analyzed, build_custom_hateoas
from superdesk import get_resource_service, logger
from superdesk.metadata.item import ITEM_TYPE
from superdesk.utc import utcnow
from superdesk.celery_app import celery
from apps.archive.common import get_user, get_auth
from apps.publish.enqueue import get_enqueue_service
from .item_lock import LOCK_SESSION, LOCK_ACTION, LOCK_TIME, LOCK_USER

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


def get_local_end_of_day(day=None, timezone=None):
    tz = pytz.timezone(timezone or tzlocal.get_localzone().zone)
    day = day or datetime.now(tz).date()

    return tz.localize(
        datetime.combine(day, time(23, 59, 59)), is_dst=None
    ).astimezone(pytz.utc)


def is_locked_in_this_session(item, user_id=None, session_id=None):
    if user_id is None:
        user = get_user(required=True)
        user_id = str(user.get(config.ID_FIELD))

    if session_id is None:
        session = get_auth()
        session_id = str(session.get(config.ID_FIELD))

    return str(item.get(LOCK_USER)) == user_id and str(item.get(LOCK_SESSION)) == session_id


def format_address(location=None):
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

    location['formatted_address'] = " ".join([a for a in formatted_address if a]).strip()


def get_street_map_url(current_app=None):
    """Get the Street Map URL"""
    if current_app is not None:
        return current_app.config.get('STREET_MAP_URL', 'https://www.google.com.au/maps/?q=')
    return app.config.get('STREET_MAP_URL', 'https://www.google.com.au/maps/?q=')


def get_item_post_state(item, new_post_state, repost=False):
    if repost:
        return item.get('state') if item.get('state') in [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.KILLED]\
            else WORKFLOW_STATE.SCHEDULED

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
    version = int((datetime.utcnow() - datetime.min).total_seconds() * 100000.0)
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
    if original.get(ITEM_STATE) == WORKFLOW_STATE.INGESTED and not updates.get('duplicate_to'):
        updates[ITEM_STATE] = WORKFLOW_STATE.DRAFT
