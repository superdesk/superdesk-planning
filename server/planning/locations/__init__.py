# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask_babel import lazy_gettext
import superdesk
from .locations_service import LocationsResource, LocationsService


def init_app(app):
    locations_search_service = LocationsService('locations', backend=superdesk.get_backend())
    LocationsResource('locations', app=app, service=locations_search_service)

    superdesk.privilege(
        name='planning_locations_management',
        label=lazy_gettext('Planning - Manage locations'),
        description=lazy_gettext('Ability to create, edit and delete locations'),
    )
