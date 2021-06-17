# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2021-06-17 14:14

from eve.utils import config

from superdesk.commands.data_updates import BaseDataUpdate
from superdesk import get_resource_service


class DataUpdate(BaseDataUpdate):
    """Populate `location.address.city` from Nominatim metadata"""

    resource = 'locations'

    def forwards(self, mongodb_collection, mongodb_database):
        for location in mongodb_collection.find({}) or []:
            address = location.get('address') or {}
            external = (address.get('external') or {}).get('nominatim') or {}

            if address.get('city') or not external.get('address'):
                # Skip this location entry if the city is already populated
                # or there is no associated Nominatim metadata
                continue

            address['city'] = external['address'].get('city') or \
                external['address'].get('town') or \
                external['address'].get('village') or \
                external['address'].get('county')

            if not address['city']:
                # If we still don't have a city, then skip this location too

                continue

            # Use service.system_update so Elasticsearch is updated as well
            get_resource_service(self.resource).system_update(
                location.get(config.ID_FIELD),
                {'address': address},
                location
            )

    def backwards(self, mongodb_collection, mongodb_database):
        pass
