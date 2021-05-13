# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2021-03-16 10:50

from eve.utils import config

from superdesk.commands.data_updates import BaseDataUpdate
from superdesk import get_resource_service


class DataUpdate(BaseDataUpdate):

    resource = 'locations'

    def forwards(self, mongodb_collection, mongodb_database):
        vocabularies = get_resource_service('vocabularies')
        countries = {
            country['name'].lower(): country
            for country in (vocabularies.find_one(req=None, _id='countries') or {}).get('items') or []
        }
        regions = {
            region['name'].lower(): region
            for region in (vocabularies.find_one(req=None, _id='regions') or {}).get('items') or []
        }

        for location in mongodb_collection.find({}) or []:
            address = location.get('address') or {}
            external = (address.get('external') or {}).get('nominatim') or {}

            if not external.get('address'):
                # Previously when a location was manually created
                # The value of `city` was stored as `area`
                # and the value of `state` was stored as `locality`.
                # Fix this up (with keeping the original)
                if address.get('area'):
                    address['city'] = address['area']
                if address.get('locality'):
                    address['state'] = address['locality']
            else:
                # Copy the values directly from the Nominatim data
                address['suburb'] = external['address'].get('suburb')
                address['city'] = external['address'].get('city') or \
                    external['address'].get('town') or \
                    external['address'].get('village')
                address['state'] = external['address'].get('state') or \
                    external['address'].get('territory') or \
                    external['address'].get('region')

                # Calculating `title` was previously using `type` for the lookup
                # when it should have been using `class`
                if external['address'].get(external.get('class')):
                    address['title'] = external['address'].get(external['class'])

            # Make sure the state has correct capitalisation
            # with the corresponding CV item
            if address.get('state') and regions.get(address['state'].lower()):
                address['state'] = regions[address['state'].lower()]['name']

            # Make sure the country has correct capitalisation
            # with the corresponding CV item
            if address.get('country') and countries.get(address['country'].lower()):
                address['country'] = countries[address['country'].lower()]['name']

            # Add name translations
            if external.get('namedetails'):
                location['translations'] = {
                    'name': external['namedetails']
                }

            # Use service.system_update so Elasticsearch is updated as well
            get_resource_service(self.resource).system_update(
                location.get(config.ID_FIELD),
                {'address': address},
                location
            )

    def backwards(self, mongodb_collection, mongodb_database):
        pass
