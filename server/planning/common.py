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


NOT_ANALYZED = {'type': 'string', 'index': 'not_analyzed'}

STATE_SCHEMA = {
    'type': 'string',
    'allowed': ['active', 'spiked', 'ingested'],
    'default': 'active',
    'mapping': NOT_ANALYZED
}

ITEM_EXPIRY = 'expiry'
ITEM_STATE = 'state'
ITEM_SPIKED = 'spiked'
ITEM_ACTIVE = 'active'


def set_item_expiry(doc):
    expiry_minutes = app.settings.get('PLANNING_EXPIRY_MINUTES', None)
    if expiry_minutes is not None:
        doc[ITEM_EXPIRY] = utcnow() + timedelta(minutes=expiry_minutes)
    else:
        doc[ITEM_EXPIRY] = None
