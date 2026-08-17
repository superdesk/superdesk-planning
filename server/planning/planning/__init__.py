# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from planning import signals
from quart_babel import lazy_gettext

import superdesk
from superdesk.eve_async.eve_to_pydantic_datalayer import EveToPydanticDataLayer

from planning.history.planning import UnifiedPlanningHistoryService
from .planning import PlanningResource, PlanningService  # noqa
from .planning_schema import coverage_schema  # noqa
from .planning_lock import (
    PlanningLockResource,
    PlanningLockService,
    PlanningUnlockResource,
    PlanningUnlockService,
)
from .planning_post import PlanningPostService, PlanningPostResource
from .planning_cancel import PlanningCancelService, PlanningCancelResource
from .planning_reschedule import PlanningRescheduleService, PlanningRescheduleResource
from .planning_featured_lock import (
    PlanningFeaturedLockResource,
    PlanningFeaturedLockService,
    PlanningFeaturedUnlockResource,
    PlanningFeaturedUnlockService,
)
from .planning_files import PlanningFilesResource, PlanningFilesService

from .module import (
    planning_resource_config,
    planning_resource_config,
    planning_featured_resource_config,
    planning_autosave_resource_config,
)
from .planning_service import PlanningAsyncService
from .planning_featured_async_service import PlanningFeaturedAsyncService
from .planning_autosave_service import PlanningAutosaveAsyncService


__all__ = [
    "planning_resource_config",
    "PlanningAsyncService",
    "PlanningFeaturedAsyncService",
    "planning_featured_resource_config",
    "PlanningAutosaveAsyncService",
    "planning_autosave_resource_config",
]


def init_app(app):
    """Initialize planning.

    :param app: superdesk app
    """
    planning_service = PlanningService(
        PlanningResource.endpoint_name, backend=EveToPydanticDataLayer("unified_planning")
    )
    PlanningResource(PlanningResource.endpoint_name, app=app, service=planning_service)

    planning_lock_service = PlanningLockService("planning_lock", backend=superdesk.get_backend())
    PlanningLockResource("planning_lock", app=app, service=planning_lock_service)

    planning_unlock_service = PlanningUnlockService("planning_unlock", backend=superdesk.get_backend())
    PlanningUnlockResource("planning_unlock", app=app, service=planning_unlock_service)

    planning_post_service = PlanningPostService("planning_post", backend=superdesk.get_backend())
    PlanningPostResource("planning_post", app=app, service=planning_post_service)

    files_service = PlanningFilesService("planning_files", backend=superdesk.get_backend())
    PlanningFilesResource("planning_files", app=app, service=files_service)

    planning_cancel_service = PlanningCancelService(
        PlanningCancelResource.endpoint_name, backend=superdesk.get_backend()
    )
    PlanningCancelResource(PlanningCancelResource.endpoint_name, app=app, service=planning_cancel_service)

    planning_reschedule_service = PlanningRescheduleService(
        PlanningRescheduleResource.endpoint_name, backend=superdesk.get_backend()
    )
    PlanningRescheduleResource(
        PlanningRescheduleResource.endpoint_name,
        app=app,
        service=planning_reschedule_service,
    )

    planning_featured_lock_service = PlanningFeaturedLockService(
        PlanningFeaturedLockResource.endpoint_name, backend=superdesk.get_backend()
    )
    PlanningFeaturedLockResource(
        PlanningFeaturedLockResource.endpoint_name,
        app=app,
        service=planning_featured_lock_service,
    )

    planning_featured_unlock_service = PlanningFeaturedUnlockService(
        PlanningFeaturedUnlockResource.endpoint_name, backend=superdesk.get_backend()
    )
    PlanningFeaturedUnlockResource(
        PlanningFeaturedUnlockResource.endpoint_name,
        app=app,
        service=planning_featured_unlock_service,
    )

    planning_history_async_service = UnifiedPlanningHistoryService()

    # listen to async signals
    signals.planning_updated.connect(planning_history_async_service.on_item_updated)
    signals.planning_spiked.connect(planning_history_async_service.on_spike)
    signals.planning_unspiked.connect(planning_history_async_service.on_unspike)
    signals.planning_postponed.connect(planning_history_async_service.on_postpone)

    # Still include the old signals
    app.on_updated_planning_cancel += planning_history_async_service.on_cancel
    app.on_updated_planning_reschedule += planning_history_async_service.on_reschedule

    app.on_updated_assignments += PlanningAutosaveAsyncService().on_assignment_updated

    superdesk.privilege(
        name="planning_planning_management",
        label=lazy_gettext("Planning - Planning Item Management"),
        description=lazy_gettext("Ability to create and modify Planning items"),
    )

    superdesk.privilege(
        name="planning_planning_spike",
        label=lazy_gettext("Planning - Spike Planning Items"),
        description=lazy_gettext("Ability to spike a Planning Item"),
    )

    superdesk.privilege(
        name="planning_planning_unspike",
        label=lazy_gettext("Planning - Unspike Planning Items"),
        description=lazy_gettext("Ability to unspike a Planning Item"),
    )

    superdesk.privilege(
        name="planning_planning_post",
        label=lazy_gettext("Planning - Post Planning Items"),
        description=lazy_gettext("Ability to post a Planning Item"),
    )

    superdesk.privilege(
        name="planning_planning_unpost",
        label=lazy_gettext("Planning - Unpost Planning Items"),
        description=lazy_gettext("Ability to unpost a Planning Item"),
    )

    superdesk.privilege(
        name="planning_planning_featured",
        label=lazy_gettext("Planning - Featured Stories"),
        description=lazy_gettext("Ability to create and modify a featured stories list from planning items"),
    )

    superdesk.intrinsic_privilege(PlanningUnlockResource.endpoint_name, method=["POST"])
