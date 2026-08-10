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
from copy import copy

from superdesk import get_resource_service
from apps.prepopulate.app_populate import AppPopulateCommand
from superdesk.tests.environment import (
    setup_before_all,
    before_feature_async as setup_before_feature_async,
    before_scenario_async as setup_before_scenario,
    before_step,
    after_scenario,
)
from superdesk.default_settings import MODULES as CORE_MODULES

from app import get_app
from settings import INSTALLED_APPS, env, MODULES

from planning.tests import clear_planning_signal_listeners
from features.utils import run_async_task


def before_all(context):
    TEST_MODULES = copy(MODULES)
    TEST_MODULES.extend(CORE_MODULES)
    config = {
        "INSTALLED_APPS": INSTALLED_APPS,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "MODULES": TEST_MODULES,
        "PLANNING_USE_XMP_FOR_PIC_ASSIGNMENTS": False,
        "PLANNING_USE_XMP_FOR_PIC_SLUGLINE": False,
        "PLANNING_XMP_SLUGLINE_MAPPING": {},
        "PLANNING_XMP_ASSIGNMENT_MAPPING": "",
        "PLANNING_LINK_UPDATES_TO_COVERAGES": False,
        "PLANNING_ALLOW_SCHEDULED_UPDATES": True,
        "PLANNING_AUTO_ASSIGN_TO_WORKFLOW": False,
        "ASSIGNMENT_MANUAL_REASSIGNMENT_ONLY": False,
    }

    LOG_CONFIG_FILE = env("LOG_CONFIG_FILE", "../e2e/server/logging_config.yml")
    if LOG_CONFIG_FILE:
        config["LOG_CONFIG_FILE"] = LOG_CONFIG_FILE

    setup_before_all(context, config, app_factory=get_app)


def before_scenario(context, scenario):
    run_async_task(before_scenario_async(context, scenario))


def before_feature(context, feature):
    run_async_task(before_feature_async(context, feature))


async def before_feature_async(context, feature):
    clear_planning_signal_listeners()
    await setup_before_feature_async(context, feature)


async def before_scenario_async(context, scenario):
    await setup_before_scenario(context, scenario)

    # Update app config based on scenario tags
    current_app = context.app
    if "link_updates" in scenario.tags:
        current_app.config["PLANNING_LINK_UPDATES_TO_COVERAGES"] = True
    _update_signals_for_link_coverage_updates_setting(current_app)

    if "no_scheduled_updates" in scenario.tags:
        current_app.config["PLANNING_ALLOW_SCHEDULED_UPDATES"] = False

    if "skipped" in scenario.tags:
        scenario.mark_skipped()

    if "planning_cvs" in scenario.tags:
        async with context.app.app_context():
            cmd = AppPopulateCommand()
            filename = path.join(path.dirname(__file__), "steps", "fixtures", "vocabularies.json")
            await cmd.run(filename)


def _update_signals_for_link_coverage_updates_setting(app):
    # Update signals based on ``PLANNING_LINK_UPDATES_TO_COVERAGES`` config
    # As these signals are connected on ``planning.init_app`` which happens on before_feature stage
    assignments_publish_service = get_resource_service("assignments")
    app.on_inserted_archive_rewrite -= assignments_publish_service.create_delivery_for_content_update
    app.on_deleted_resource_archive_rewrite -= (
        assignments_publish_service.unlink_assignment_on_delete_archive_rewrite
    )

    if app.config.get("PLANNING_LINK_UPDATES_TO_COVERAGES"):
        app.on_inserted_archive_rewrite += assignments_publish_service.create_delivery_for_content_update
        app.on_deleted_resource_archive_rewrite += (
            assignments_publish_service.unlink_assignment_on_delete_archive_rewrite
        )
