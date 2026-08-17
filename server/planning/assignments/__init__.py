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
from quart_babel import lazy_gettext

from superdesk.signals import item_duplicate_async, item_duplicated_async
from planning import signals
from .assignments import AssignmentsResource, AssignmentsService
from .assignments_content import AssignmentsContentResource, AssignmentsContentService
from .assignments_link import (
    AssignmentsLinkResource,
    AssignmentsLinkService,
    on_archive_item_duplicate,
    on_archive_item_duplicated,
)
from .assignments_unlink import AssignmentsUnlinkResource, AssignmentsUnlinkService
from .assignments_complete import (
    AssignmentsCompleteResource,
    AssignmentsCompleteService,
)
from .assignments_revert import AssignmentsRevertResource, AssignmentsRevertService
from .delivery import DeliveryResource, DeliveryService

from .service import AssignmentsAsyncService
from .delivery_service import DeliveryAsyncService
from .assignments_history_async import AssignmentsHistoryAsyncService
from .module import assignments_resource_config, delivery_resource_config, assignments_history_resource_config

__all__ = [
    "assignments_resource_config",
    "AssignmentsAsyncService",
    "delivery_resource_config",
    "DeliveryAsyncService",
    "assignments_history_resource_config",
    "AssignmentsHistoryAsyncService",
]


def init_app(app):
    """Initialize assignments

    :param app: superdesk app
    """

    assignments_publish_service = AssignmentsService("assignments", backend=superdesk.get_backend())
    AssignmentsResource("assignments", app=app, service=assignments_publish_service)

    assignments_content_service = AssignmentsContentService("assignments_content", backend=superdesk.get_backend())
    AssignmentsContentResource("assignments_content", app=app, service=assignments_content_service)

    assignments_link_service = AssignmentsLinkService("assignments_link", backend=superdesk.get_backend())
    AssignmentsLinkResource("assignments_link", app=app, service=assignments_link_service)

    assignments_unlink_service = AssignmentsUnlinkService("assignments_unlink", backend=superdesk.get_backend())
    AssignmentsUnlinkResource("assignments_unlink", app=app, service=assignments_unlink_service)

    assignments_complete_service = AssignmentsCompleteService(
        AssignmentsCompleteResource.endpoint_name, backend=superdesk.get_backend()
    )
    AssignmentsCompleteResource(
        AssignmentsCompleteResource.endpoint_name,
        app=app,
        service=assignments_complete_service,
    )

    assignments_revert_service = AssignmentsRevertService(
        AssignmentsRevertResource.endpoint_name, backend=superdesk.get_backend()
    )
    AssignmentsRevertResource(
        AssignmentsRevertResource.endpoint_name,
        app=app,
        service=assignments_revert_service,
    )

    assignments_history_service = AssignmentsHistoryAsyncService()
    signals.assignments_updated.connect(assignments_history_service.on_item_updated)
    signals.assignments_deleted.connect(assignments_history_service.on_item_deleted)
    app.on_updated_assignments += assignments_history_service.on_item_updated
    app.on_deleted_item_assignments += assignments_history_service.on_item_deleted

    delivery_service = DeliveryService("delivery", backend=superdesk.get_backend())
    DeliveryResource("delivery", app=app, service=delivery_service)

    # listen to async signals
    signals.events_update.connect(assignments_publish_service.on_events_updated)

    # Updating data/lock on assignments based on content item updates from authoring
    app.on_updated_archive += assignments_publish_service.update_assignment_on_archive_update
    app.on_archive_item_updated += assignments_publish_service.update_assignment_on_archive_operation

    # Track updates for an assignment if it's news story was updated
    if app.config.get("PLANNING_LINK_UPDATES_TO_COVERAGES", True):
        app.on_inserted_archive_rewrite += assignments_publish_service.create_delivery_for_content_update

        # Remove Assignment and Coverage upon deleting an Archive Rewrite
        app.on_deleted_resource_archive_rewrite += (
            assignments_publish_service.unlink_assignment_on_delete_archive_rewrite
        )

    app.client_config["planning_check_for_assignment_on_publish"] = app.config.get(
        "PLANNING_CHECK_FOR_ASSIGNMENT_ON_PUBLISH", False
    )

    app.client_config["planning_check_for_assignment_on_send"] = app.config.get(
        "PLANNING_CHECK_FOR_ASSIGNMENT_ON_SEND", False
    )

    if len(app.config.get("PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS", "")) == 0:
        app.client_config["planning_fulfil_on_publish_for_desks"] = []
    else:
        app.client_config["planning_fulfil_on_publish_for_desks"] = app.config.get(
            "PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS", ""
        ).split(",")

    # Enhance the archive/published item resources with assigned desk/user information
    app.on_fetched_resource_archive += assignments_publish_service.on_fetched_resource_archive
    app.on_fetched_item_archive += assignments_publish_service.on_fetched_item_archive
    app.on_fetched_resource_published += assignments_publish_service.on_fetched_resource_archive
    app.on_fetched_item_published += assignments_publish_service.on_fetched_resource_archive
    app.on_updated_archive_spike += assignments_unlink_service.on_spike_item

    item_duplicate_async.connect(on_archive_item_duplicate)
    item_duplicated_async.connect(on_archive_item_duplicated)

    # User Preferences
    superdesk.register_default_user_preference(
        "assignments:default_sort",
        {"type": "dict", "sort": {}, "default": None},
        label=lazy_gettext("Default sort preferences for Assignment lists"),
        category=lazy_gettext("Assignments"),
    )
