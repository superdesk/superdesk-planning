# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from eve import Eve

from superdesk import get_backend

from .resource import EventsResource, EventsHistoryResource, EventsFilesResource
from .service import EventsService, EventsHistoryService, EventsFilesService


def init_app(app: Eve):
    events_service = EventsService(datasource="events", backend=get_backend())
    EventsResource(endpoint_name="events", app=app, service=events_service)

    events_history_service = EventsHistoryService(datasource="events_history", backend=get_backend())
    EventsHistoryResource(endpoint_name="events_history", app=app, service=events_history_service)

    events_files_service = EventsFilesService(datasource="events_files", backend=get_backend())
    EventsFilesResource(endpoint_name="events_files", app=app, service=events_files_service)
