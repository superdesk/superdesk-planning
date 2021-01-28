# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#
# Author  : MarkLark86
# Creation: 2021-01-28 11:12

from superdesk.commands.data_updates import BaseDataUpdate
from eve.utils import config


# This script converts `events_planning_filters` documents to newer schema
# Required after changes in PR: https://github.com/superdesk/superdesk-planning/pull/1511
class DataUpdate(BaseDataUpdate):

    resource = 'events_planning_filters'

    def forwards(self, mongodb_collection, mongodb_database):
        for search_filter in mongodb_collection.find({}):
            if search_filter.get('item_type'):
                # `item_type` was added along with the schema changes
                # so if it is defined, then no need to upgrade this document
                continue

            filter_id = search_filter.get(config.ID_FIELD)
            params = {}

            if len(search_filter.get('agendas') or []):
                # Convert Agenda dictionary to array of IDs
                params['agendas'] = [
                    agenda.get(config.ID_FIELD)
                    for agenda in search_filter['agendas']
                ]

            if len(search_filter.get('calendars') or []):
                params['calendars'] = search_filter['calendars']

            if len(search_filter.get('places') or []):
                params['place'] = search_filter['places']

            mongodb_collection.update(
                {'_id': filter_id},
                {
                    '$set': {
                        'item_type': 'combined',
                        'params': params
                    },
                    '$unset': {
                        'agendas': '',
                        'calendars': '',
                        'places': ''
                    }
                }
            )

    def backwards(self, mongodb_collection, mongodb_database):
        for search_filter in mongodb_collection.find({}):
            filter_id = search_filter.get(config.ID_FIELD)
            params = search_filter.get('params') or {}
            updates = {}

            if len(params.get('agendas') or []):
                updates['agendas'] = {
                    '_id': agenda_id
                    for agenda_id in params['agendas']
                }

            if len(params.get('calendars') or []):
                updates['calendars'] = params['calendars']

            if len(params.get('place') or []):
                updates['places'] = params['place']

            mongodb_collection.update(
                {'_id': filter_id},
                {
                    '$set': updates,
                    '$unset': {
                        'item_type': '',
                        'params': ''
                    }
                }
            )
