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
from .planning_validate import PlanningValidateResource, PlanningValidateService


def init_app(app):
    """Initialize planning validators.

    """

    validate_service = PlanningValidateService(PlanningValidateResource.endpoint_name, backend=superdesk.get_backend())
    PlanningValidateResource(PlanningValidateResource.endpoint_name, app=app, service=validate_service)
