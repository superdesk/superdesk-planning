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

from superdesk.eve_async.eve_to_pydantic_datalayer import EveToPydanticDataLayer

from planning import signals
from .events import EventsResource, EventsService
from planning.files import EventsFilesResource, FilesAsyncService
from .events_history import EventsHistoryResource, EventsHistoryService
from .events_template import (
    EventsTemplateResource,
    EventsTemplateService,
    RecentEventsTemplateResource,
    RecentEventsTemplateService,
)

from .events_service import EventsAsyncService
from .events_history_async_service import EventsHistoryAsyncService
from .module import events_resource_config, events_history_resource_config

__all__ = [
    "EventsAsyncService",
    "events_resource_config",
    "EventsHistoryAsyncService",
    "events_history_resource_config",
]


def init_app(app):
    """Initialize events

    :param app: superdesk app
    """

    events_search_service = EventsService(
        EventsResource.endpoint_name, backend=EveToPydanticDataLayer("unified_planning")
    )
    EventsResource(EventsResource.endpoint_name, app=app, service=events_search_service)

    files_service = FilesAsyncService("events_files", backend=superdesk.get_backend())
    EventsFilesResource("events_files", app=app, service=files_service)

    events_history_service = EventsHistoryService("events_history", backend=superdesk.get_backend())
    EventsHistoryResource("events_history", app=app, service=events_history_service)

    events_template_service = EventsTemplateService(
        EventsTemplateResource.endpoint_name, backend=superdesk.get_backend()
    )
    EventsTemplateResource(EventsTemplateResource.endpoint_name, app=app, service=events_template_service)

    recent_events_template_service = RecentEventsTemplateService(
        RecentEventsTemplateResource.endpoint_name, backend=superdesk.get_backend()
    )
    EventsTemplateResource(
        RecentEventsTemplateResource.endpoint_name,
        app=app,
        service=recent_events_template_service,
    )

    events_history_async_service = EventsHistoryAsyncService()

    # listen to async signals
    signals.event_time_updated.connect(events_history_async_service.on_update_time)
    signals.event_spiked.connect(events_history_async_service.on_spike)
    signals.event_unspiked.connect(events_history_async_service.on_unspike)
    signals.event_postponed.connect(events_history_async_service.on_postpone)
    signals.event_cancel.connect(events_history_async_service.on_cancel)
    signals.event_reschedule.connect(events_history_async_service.on_reschedule)
    signals.event_rescheduled.connect(events_history_async_service.on_reschedule)

    app.on_deleted_item_events -= events_history_service.on_item_deleted
    app.on_deleted_item_events += events_history_service.on_item_deleted
    app.on_updated_events_reschedule += events_history_service.on_reschedule

    # Privileges
    superdesk.privilege(
        name="planning_event_management",
        label=lazy_gettext("Planning - Event Management"),
        description=lazy_gettext("Ability to create and modify Events"),
    )

    superdesk.privilege(
        name="planning_event_spike",
        label=lazy_gettext("Planning - Spike Event Items"),
        description=lazy_gettext("Ability to spike an Event"),
    )

    superdesk.privilege(
        name="planning_event_unspike",
        label=lazy_gettext("Planning - Unspike Event Items"),
        description=lazy_gettext("Ability to unspike an Event"),
    )

    superdesk.privilege(
        name="planning_event_post",
        label=lazy_gettext("Planning - Post Event Items"),
        description=lazy_gettext("Ability to post an Event"),
    )

    superdesk.privilege(
        name="planning_event_unpost",
        label=lazy_gettext("Planning - Unpost Event Items"),
        description=lazy_gettext("Ability to unpost an Event"),
    )

    superdesk.privilege(
        name="planning_event_templates",
        label=lazy_gettext("Planning - Event Templates"),
        description=lazy_gettext("Ability to create and manage Event templates"),
    )

    superdesk.register_default_user_preference("events_templates:recent", {})
