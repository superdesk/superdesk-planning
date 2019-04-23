# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import os
import superdesk
from superdesk.tests.environment import before_feature, before_step, after_scenario   # noqa
from superdesk.tests.environment import setup_before_all, setup_before_scenario
from superdesk.io.commands.update_ingest import ingest_items
from app import get_app
from settings import INSTALLED_APPS


def setup_providers(context):
    """Setup the ingest provider required for behave test"""
    app = context.app
    context.providers = {}
    context.ingest_items = ingest_items
    path_to_fixtures = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'steps', 'fixtures')
    providers = [
        {'name': 'ntb', 'source': 'ntb', 'feeding_service': 'event_file', 'feed_parser': 'ntb_event_xml',
         'is_closed': False, 'config': {'path': path_to_fixtures}}
    ]

    with app.test_request_context(app.config['URL_PREFIX']):
        result = superdesk.get_resource_service('ingest_providers').post(providers)
        context.providers['ntb'] = result[0]


def before_all(context):
    config = {
        'INSTALLED_APPS': INSTALLED_APPS,
        'ELASTICSEARCH_FORCE_REFRESH': True,
    }
    setup_before_all(context, config, app_factory=get_app)


def before_scenario(context, scenario):
    config = {
        'INSTALLED_APPS': INSTALLED_APPS,
        'ELASTICSEARCH_FORCE_REFRESH': True,
    }

    if 'link_updates' in scenario.tags:
        config['PLANNING_LINK_UPDATES_TO_COVERAGES'] = True
    else:
        config['PLANNING_LINK_UPDATES_TO_COVERAGES'] = False

    setup_before_scenario(context, scenario, config, app_factory=get_app)

    if scenario.status != 'skipped' and 'events_ingest' in scenario.tags:
        setup_providers(context)
