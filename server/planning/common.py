# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import current_app as app
from superdesk.utc import utcnow
from datetime import timedelta
from collections import namedtuple
from superdesk.resource import not_analyzed
from superdesk import get_resource_service
from .item_lock import LOCK_SESSION, LOCK_ACTION, LOCK_TIME, LOCK_USER
from superdesk.metadata.item import ITEM_TYPE
from datetime import datetime, time
import tzlocal
import pytz
from apps.archive.common import get_user, get_auth
from eve.utils import config

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

published_state = ['usable', 'cancelled']
PUBLISHED_STATE = namedtuple('PUBLISHED_STATE', ['USABLE', 'CANCELLED'])(*published_state)

PLANNING_ITEM_CUSTOM_HATEOAS = {'self': {'title': 'planning', 'href': '/planning/{_id}'}}
EVENT_ITEM_CUSTOM_HATEOAS = {'self': {'title': 'events', 'href': '/events/{_id}'}}

PUBLISHED_STATE_SCHEMA = {
    'type': 'string',
    'allowed': published_state,
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
                                        'COMPLETED', 'SUBMITTED', 'cancelled'])(*assignment_workflow_state)

item_actions = ['cancel', 'postpone', 'reschedule', 'update_time', 'convert_recurring', 'planning_cancel',
                'cancel_all_coverage', 'edit']
ITEM_ACTIONS = namedtuple('ITEM_ACTIONS',
                          ['CANCEL', 'POSTPONED', 'RESCHEDULE', 'UPDATE_TIME',
                           'CONVERT_RECURRING', 'PLANNING_CANCEL', 'CANCEL_ALL_COVERAGE',
                           'EDIT'])(*item_actions)


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
        user_id = user.get(config.ID_FIELD)

    if session_id is None:
        session = get_auth()
        session_id = session.get(config.ID_FIELD)

    return item.get(LOCK_USER) == user_id and item.get(LOCK_SESSION) == session_id


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


def get_item_publish_state(item, new_publish_state):
    if new_publish_state == PUBLISHED_STATE.CANCELLED:
        return WORKFLOW_STATE.KILLED

    if item.get('pubstatus') != PUBLISHED_STATE.USABLE:
        # Publishing for first time, default to 'schedule' state
        return WORKFLOW_STATE.SCHEDULED

    return item.get('state')


def publish_required(updates, original):
    pub_status = None
    # Save&Publish or Save&Unpublish
    if updates.get('pubstatus'):
        pub_status = updates['pubstatus']
    elif original.get('pubstatus') == PUBLISHED_STATE.USABLE:
        # From item actions
        pub_status = PUBLISHED_STATE.USABLE

    return pub_status is not None


def update_published_item(updates, original):
    """Method to update(re-publish) a published item after the item is updated"""
    pub_status = None
    # Save&Publish or Save&Unpublish
    if updates.get('pubstatus'):
        pub_status = updates['pubstatus']
    elif original.get('pubstatus') == PUBLISHED_STATE.USABLE:
        # From item actions
        pub_status = PUBLISHED_STATE.USABLE

    if pub_status is not None:
        if original.get(ITEM_TYPE):
            resource_name = 'events_publish' if original.get(ITEM_TYPE) == 'event' else 'planning_publish'
            item_publish_service = get_resource_service(resource_name)
            doc = {
                'etag': updates.get('_etag'),
                original.get(ITEM_TYPE): original.get(config.ID_FIELD),
                'pubstatus': pub_status
            }
            item_publish_service.post([doc])
