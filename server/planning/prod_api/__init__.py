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

from planning.prod_api.assignments import init_app as init_assignments_app
from planning.prod_api.events import init_app as init_events_app
from planning.prod_api.planning import init_app as init_planning_app


def init_app(app: Eve):
    init_assignments_app(app)
    init_events_app(app)
    init_planning_app(app)
