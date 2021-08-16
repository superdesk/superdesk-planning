# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource
from superdesk.metadata.utils import item_url
from superdesk.auth_server.scopes import Scope


class AssignmentsResource(Resource):
    url = "assignments"
    resource_title = "Assignment"
    item_url = item_url
    item_methods = ["GET"]
    resource_methods = ["GET"]
    allow_unknown = True
    datasource = {
        "source": "assignments",
        "search_backend": "elastic",
        "default_sort": [("_updated", -1)],
    }
    privileges = {"GET": Scope.ASSIGNMENTS_READ.name}
