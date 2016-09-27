# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from superdesk.metadata.utils import item_url


class PlanningService(superdesk.Service):
    pass


class PlanningResource(superdesk.Resource):
    resource_methods = ['GET']
    item_methods = ['GET']
    public_methods = ['GET']
    item_url = item_url


def init_app(app):
    search_service = PlanningService('planning', backend=superdesk.get_backend())
    PlanningResource('planning', app=app, service=search_service)
