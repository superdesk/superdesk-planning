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
from superdesk.services import BaseService
from .assignments import AssignmentsResource, AssignmentsService
from .assignments_content import AssignmentsContentResource, AssignmentsContentService
from .assignments_link import AssignmentsLinkResource, AssignmentsLinkService
from .assignments_unlink import AssignmentsUnlinkResource, AssignmentsUnlinkService
from .assignments_complete import AssignmentsCompleteResource, AssignmentsCompleteService
from .assignments_revert import AssignmentsRevertResource, AssignmentsRevertService
from .assignments_lock import AssignmentsLockResource, AssignmentsLockService,\
    AssignmentsUnlockResource, AssignmentsUnlockService
from .assignments_history import AssignmentsHistoryResource, AssignmentsHistoryService
from .delivery import DeliveryResource


def init_app(app):
    """Initialize assignments

    :param app: superdesk app
    """

    assignments_lock_service = AssignmentsLockService(AssignmentsLockResource.endpoint_name,
                                                      backend=superdesk.get_backend())
    AssignmentsLockResource(AssignmentsLockResource.endpoint_name, app=app, service=assignments_lock_service)

    assignments_unlock_service = AssignmentsUnlockService(AssignmentsUnlockResource.endpoint_name,
                                                          backend=superdesk.get_backend())
    AssignmentsUnlockResource(AssignmentsUnlockResource.endpoint_name, app=app, service=assignments_unlock_service)

    assignments_publish_service = AssignmentsService('assignments', backend=superdesk.get_backend())
    AssignmentsResource('assignments', app=app, service=assignments_publish_service)

    assignments_content_service = AssignmentsContentService('assignments_content', backend=superdesk.get_backend())
    AssignmentsContentResource('assignments_content', app=app, service=assignments_content_service)

    assignments_link_service = AssignmentsLinkService('assignments_link', backend=superdesk.get_backend())
    AssignmentsLinkResource('assignments_link', app=app, service=assignments_link_service)

    assignments_unlink_service = AssignmentsUnlinkService('assignments_unlink', backend=superdesk.get_backend())
    AssignmentsUnlinkResource('assignments_unlink', app=app, service=assignments_unlink_service)

    assignments_complete_service = AssignmentsCompleteService(AssignmentsCompleteResource.endpoint_name,
                                                              backend=superdesk.get_backend())
    AssignmentsCompleteResource(
        AssignmentsCompleteResource.endpoint_name,
        app=app,
        service=assignments_complete_service
    )

    assignments_revert_service = AssignmentsRevertService(AssignmentsRevertResource.endpoint_name,
                                                          backend=superdesk.get_backend())
    AssignmentsRevertResource(
        AssignmentsRevertResource.endpoint_name,
        app=app,
        service=assignments_revert_service
    )

    assignments_history_service = AssignmentsHistoryService('assignments_history', backend=superdesk.get_backend())
    AssignmentsHistoryResource('assignments_history', app=app, service=assignments_history_service)
    app.on_updated_assignments += assignments_history_service.on_item_updated
    app.on_deleted_item_assignments += assignments_history_service.on_item_deleted

    delivery_service = BaseService('delivery', backend=superdesk.get_backend())
    DeliveryResource('delivery', app=app, service=delivery_service)

    # Updating data/lock on assignments based on content item updates from authoring
    app.on_updated_archive += assignments_publish_service.update_assignment_on_archive_update
    app.on_archive_item_updated += assignments_publish_service.update_assignment_on_archive_operation
    app.on_item_lock += assignments_publish_service.validate_assignment_lock
    app.on_item_locked += assignments_publish_service.sync_assignment_lock
    app.on_item_unlocked += assignments_publish_service.sync_assignment_unlock
    app.on_updated_events += assignments_publish_service.on_events_updated

    # Track updates for an assignment if it's news story was updated
    if app.config.get('PLANNING_LINK_UPDATES_TO_COVERAGES', True):
        app.on_inserted_archive_rewrite += assignments_publish_service.create_delivery_for_content_update

        # Remove Assignment and Coverage upon deleting an Archive Rewrite
        app.on_deleted_resource_archive_rewrite +=\
            assignments_publish_service.unlink_assignment_on_delete_archive_rewrite

    app.client_config['planning_check_for_assignment_on_publish'] = \
        app.config.get('PLANNING_CHECK_FOR_ASSIGNMENT_ON_PUBLISH', False)

    app.client_config['planning_check_for_assignment_on_send'] = \
        app.config.get('PLANNING_CHECK_FOR_ASSIGNMENT_ON_SEND', False)

    if len(app.config.get('PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS', '')) == 0:
        app.client_config['planning_fulfil_on_publish_for_desks'] = []
    else:
        app.client_config['planning_fulfil_on_publish_for_desks'] = \
            app.config.get('PLANNING_FULFIL_ON_PUBLISH_FOR_DESKS', '').split(',')

    # Enhance the archive/published item resources with assigned desk/user information
    app.on_fetched_resource_archive += assignments_publish_service.on_fetched_resource_archive
    app.on_fetched_item_archive += assignments_publish_service.on_fetched_item_archive
    app.on_fetched_resource_published += assignments_publish_service.on_fetched_resource_archive
    app.on_fetched_item_published += assignments_publish_service.on_fetched_resource_archive
    app.on_updated_archive_spike += assignments_unlink_service.on_spike_item

    # Privileges
    superdesk.intrinsic_privilege(AssignmentsUnlockResource.endpoint_name, method=['POST'])

    # User Preferences
    superdesk.register_default_user_preference('assignments:default_sort', {
        'type': 'dict',
        'label': 'Default sort preferences for Assignment lists',
        'category': 'assignments',
        'sort': {},
        'default': None
    })
