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
from .item_lock import LOCK_SESSION, LOCK_ACTION, LOCK_TIME, LOCK_USER

ITEM_STATE = 'state'
ITEM_EXPIRY = 'expiry'

UPDATE_SINGLE = 'single'
UPDATE_FUTURE = 'future'
UPDATE_ALL = 'all'
UPDATE_METHODS = (UPDATE_SINGLE, UPDATE_FUTURE, UPDATE_ALL)

workflow_state = ['in_progress', 'ingested', 'published', 'killed',
                  'cancelled', 'rescheduled', 'postponed', 'spiked']

WORKFLOW_STATE = namedtuple('WORKFLOW_STATE', ['IN_PROGRESS', 'INGESTED', 'PUBLISHED', 'KILLED',
                                               'CANCELLED', 'RESCHEDULED', 'POSTPONED', 'SPIKED']
                            )(*workflow_state)

published_state = ['usable', 'cancelled']
PUBLISHED_STATE = namedtuple('PUBLISHED_STATE', ['USABLE', 'CANCELLED'])(*published_state)

PUBLISHED_STATE_SCHEMA = {
    'type': 'string',
    'allowed': published_state,
    'nullable': True,
    'mapping': not_analyzed
}

WORKFLOW_STATE_SCHEMA = {
    'type': 'string',
    'allowed': workflow_state,
    'default': WORKFLOW_STATE.IN_PROGRESS,
    'mapping': not_analyzed
}


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
