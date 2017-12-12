# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from .planning import PlanningResource, PlanningService, coverage_schema # noqa
from .planning_spike import PlanningSpikeResource, PlanningSpikeService, PlanningUnspikeResource, PlanningUnspikeService
from .planning_history import PlanningHistoryResource, PlanningHistoryService
from .planning_lock import PlanningLockResource, PlanningLockService, PlanningUnlockResource, PlanningUnlockService
from .planning_publish import PlanningPublishService, PlanningPublishResource
from .planning_duplicate import PlanningDuplicateService, PlanningDuplicateResource
from .planning_cancel import PlanningCancelService, PlanningCancelResource
from .planning_reschedule import PlanningRescheduleService, PlanningRescheduleResource
from .planning_postpone import PlanningPostponeService, PlanningPostponeResource
from .planning_types import PlanningTypesService, PlanningTypesResource
from .planning_export import PlanningExportResource, PlanningExportService, get_desk_template # noqa


def init_app(app):
    """Initialize planning.

    :param app: superdesk app
    """
    planning_service = PlanningService('planning', backend=superdesk.get_backend())
    PlanningResource('planning', app=app, service=planning_service)

    planning_lock_service = PlanningLockService('planning_lock', backend=superdesk.get_backend())
    PlanningLockResource('planning_lock', app=app, service=planning_lock_service)

    planning_unlock_service = PlanningUnlockService('planning_unlock', backend=superdesk.get_backend())
    PlanningUnlockResource('planning_unlock', app=app, service=planning_unlock_service)

    planning_spike_service = PlanningSpikeService('planning_spike', backend=superdesk.get_backend())
    PlanningSpikeResource('planning_spike', app=app, service=planning_spike_service)

    planning_unspike_service = PlanningUnspikeService('planning_unspike', backend=superdesk.get_backend())
    PlanningUnspikeResource('planning_unspike', app=app, service=planning_unspike_service)

    planning_publish_service = PlanningPublishService('planning_publish', backend=superdesk.get_backend())
    PlanningPublishResource('planning_publish', app=app, service=planning_publish_service)

    planning_duplicate_service = PlanningDuplicateService('planning_duplicate', backend=superdesk.get_backend())
    PlanningDuplicateResource('planning_duplicate', app=app, service=planning_duplicate_service)

    planning_type_service = PlanningTypesService(PlanningTypesResource.endpoint_name,
                                                 backend=superdesk.get_backend())
    PlanningTypesResource(PlanningTypesResource.endpoint_name,
                          app=app,
                          service=planning_type_service)

    planning_cancel_service = PlanningCancelService(PlanningCancelResource.endpoint_name,
                                                    backend=superdesk.get_backend())
    PlanningCancelResource(PlanningCancelResource.endpoint_name,
                           app=app,
                           service=planning_cancel_service)

    planning_reschedule_service = PlanningRescheduleService(
        PlanningRescheduleResource.endpoint_name,
        backend=superdesk.get_backend()
    )
    PlanningRescheduleResource(
        PlanningRescheduleResource.endpoint_name,
        app=app,
        service=planning_reschedule_service
    )

    planning_postpone_service = PlanningPostponeService(PlanningPostponeResource.endpoint_name,
                                                        backend=superdesk.get_backend())
    PlanningPostponeResource(PlanningPostponeResource.endpoint_name,
                             app=app,
                             service=planning_postpone_service)

    planning_history_service = PlanningHistoryService('planning_history', backend=superdesk.get_backend())
    PlanningHistoryResource('planning_history', app=app, service=planning_history_service)

    superdesk.register_resource(
        'planning_export',
        PlanningExportResource,
        PlanningExportService,
        privilege='planning',
        _app=app
    )

    app.on_inserted_planning += planning_history_service.on_item_created
    app.on_updated_planning += planning_history_service.on_item_updated
    app.on_updated_planning_spike += planning_history_service.on_spike
    app.on_updated_planning_unspike += planning_history_service.on_unspike
    app.on_updated_planning_cancel += planning_history_service.on_cancel
    app.on_updated_planning_reschedule += planning_history_service.on_reschedule
    app.on_updated_planning_postpone += planning_history_service.on_postpone

    app.on_locked_planning += planning_service.on_locked_planning

    superdesk.privilege(
        name='planning_planning_management',
        label='Planning - Planning Item Management',
        description='Ability to create and modify Planning items'
    )

    superdesk.privilege(
        name='planning_planning_spike',
        label='Planning - Spike Planning Items',
        description='Ability to spike a Planning Item'
    )

    superdesk.privilege(
        name='planning_planning_unspike',
        label='Planning - Unspike Planning Items',
        description='Ability to unspike a Planning Item'
    )

    superdesk.privilege(
        name='planning_planning_publish',
        label='Planning - Publish Planning Items',
        description='Ability to publish a Planning Item'
    )

    superdesk.intrinsic_privilege(PlanningUnlockResource.endpoint_name, method=['POST'])
