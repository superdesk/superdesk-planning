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

from .resource import PlanningResource
from .service import PlanningService


def init_app(app: Eve):
    planning_service = PlanningService(datasource="planning", backend=get_backend())
    PlanningResource(endpoint_name="planning", app=app, service=planning_service)
