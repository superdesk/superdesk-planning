# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from os import path

from apps.prepopulate.app_populate import AppPopulateCommand
from superdesk.tests.environment import before_feature, before_step, after_scenario   # noqa
from superdesk.tests.environment import setup_before_all, setup_before_scenario
from app import get_app
from settings import INSTALLED_APPS


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

    if 'no_scheduled_updates' in scenario.tags:
        config['PLANNING_ALLOW_SCHEDULED_UPDATES'] = False

    setup_before_scenario(context, scenario, config, app_factory=get_app)

    if 'planning_cvs' in scenario.tags:
        with context.app.app_context():
            cmd = AppPopulateCommand()
            filename = path.join(path.abspath(path.dirname("features/steps/fixtures/")), "vocabularies.json")
            cmd.run(filename)
