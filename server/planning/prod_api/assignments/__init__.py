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

from .resource import AssignmentsResource
from .service import (
    AssignmentsService,
    on_fetched_resource_archive,
    on_fetched_item_archive,
)


def init_app(app: Eve):
    assignments_service = AssignmentsService(datasource="assignments", backend=get_backend())
    AssignmentsResource(endpoint_name="assignments", app=app, service=assignments_service)

    app.on_fetched_resource_archive += on_fetched_resource_archive
    app.on_fetched_item_archive += on_fetched_item_archive
