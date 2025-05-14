# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import asyncio
import logging

from os import path
from copy import copy

from apps.prepopulate.app_populate import AppPopulateCommand
from superdesk.tests.environment import (
    setup_before_all,
    before_feature,
    before_scenario_async as setup_before_scenario,
    before_step,
    after_scenario,
)
from superdesk.default_settings import MODULES as CORE_MODULES

from app import get_app
from settings import INSTALLED_APPS, env, MODULES


logger = logging.getLogger(__name__)


def before_all(context):
    TEST_MODULES = copy(MODULES)
    TEST_MODULES.extend(CORE_MODULES)
    config = {
        "INSTALLED_APPS": INSTALLED_APPS,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "MODULES": TEST_MODULES,
    }

    LOG_CONFIG_FILE = env("LOG_CONFIG_FILE", "../e2e/server/logging_config.yml")
    if LOG_CONFIG_FILE:
        config["LOG_CONFIG_FILE"] = LOG_CONFIG_FILE

    setup_before_all(context, config, app_factory=get_app)


def run_async_task(task):
    """
    Runs async task until completes and logs any exceptions.
    """
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(task)
    except Exception as e:
        logger.exception(e)
        raise e


def before_scenario(context, scenario):
    run_async_task(before_scenario_async(context, scenario))


async def before_scenario_async(context, scenario):
    # Update app config based on scenario tags
    current_app = context.app
    if "link_updates" in scenario.tags:
        current_app.config["PLANNING_LINK_UPDATES_TO_COVERAGES"] = True
    else:
        current_app.config["PLANNING_LINK_UPDATES_TO_COVERAGES"] = False

    if "no_scheduled_updates" in scenario.tags:
        current_app.config["PLANNING_ALLOW_SCHEDULED_UPDATES"] = False
    else:
        current_app.config["PLANNING_ALLOW_SCHEDULED_UPDATES"] = True

    if "skipped" in scenario.tags:
        scenario.mark_skipped()

    await setup_before_scenario(context, scenario)

    if "planning_cvs" in scenario.tags:
        async with context.app.app_context():
            cmd = AppPopulateCommand()
            filename = path.join(path.abspath(path.dirname("features/steps/fixtures/")), "vocabularies.json")
            await cmd.run(filename)
