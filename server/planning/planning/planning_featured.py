# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Featured"""

import superdesk
from superdesk import get_resource_service
from eve.utils import config
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utc_to_local
from flask import current_app as app

ID_DATE_FORMAT = '%Y%m%d'


class PlanningFeaturedService(superdesk.Service):
    """Service class for the planning featured model."""

    def on_create(self, docs):
        for doc in docs:
            date = utc_to_local(doc.get('tz') or app.config['DEFAULT_TIMEZONE'], doc.get('date'))
            _id = date.strftime(ID_DATE_FORMAT)

            items = self.find(where={'_id': _id})
            if items.count() > 0:
                raise SuperdeskApiError.forbiddenError(
                    message="Featured story already exists for this date.")

            self.validate_featured_attrribute(doc.get('items'))
            doc['_id'] = _id

    def on_update(self, updates, original):
        # Find all planning items in the list
        added_featured = [id for id in updates.get('items') if id not in original.get('items')]
        self.validate_featured_attrribute(added_featured)

    def validate_featured_attrribute(self, planning_ids):
        planning_service = get_resource_service('planning')
        for planning_id in planning_ids:
            planning_item = planning_service.find_one(req=None, _id=planning_id)
            if not planning_item.get('featured'):
                raise SuperdeskApiError.forbiddenError(
                    message="A planning item in the list is not featured.")


planning_featured_schema = {
    # Identifiers
    config.ID_FIELD: {
        'type': 'string',
        'regex': 'regex("[0-9]{8}")'
    },
    'date': {
        'type': 'datetime',
        "nullable": False,
    },
    'items': {'type': 'list'},
    'tz': {'type': 'string'},
}


class PlanningFeaturedResource(superdesk.Resource):
    """Resource for planning featured data model"""

    url = 'planning_featured'
    item_url = r'regex("[-_\w]+")'
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    public_methods = ['GET', 'PATCH']
    schema = planning_featured_schema
    datasource = {'source': 'planning_featured'}

    privileges = {
        'POST': 'planning_planning_featured',
        'PATCH': 'planning_planning_featured'
    }
