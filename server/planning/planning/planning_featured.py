# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Featured"""

import superdesk
from superdesk.resource import not_analyzed
from superdesk import get_resource_service, logger
from eve.utils import config
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utc_to_local, utcnow
from apps.archive.common import update_dates_for
from planning.common import get_version_item_for_post, enqueue_planning_item, set_original_creator
from apps.auth import get_user_id
from superdesk.metadata.item import metadata_schema, ITEM_TYPE
from flask import current_app as app
from copy import deepcopy

ID_DATE_FORMAT = '%Y%m%d'


class PlanningFeaturedService(superdesk.Service):
    """Service class for the planning featured model."""

    def on_create(self, docs):
        for doc in docs:
            date = utc_to_local(doc.get('tz') or app.config['DEFAULT_TIMEZONE'], doc.get('date'))
            _id = date.strftime(ID_DATE_FORMAT)

            items = self.find(where={'_id': _id})
            if items.count() > 0:
                raise SuperdeskApiError.badRequestError(
                    message="Featured story already exists for this date.")

            self.validate_featured_attrribute(doc.get('items'))
            doc['_id'] = _id
            self.post_featured_planning(doc)
            # set the author
            set_original_creator(doc)

            # set timestamps
            update_dates_for(doc)

    def on_created(self, docs):
        for doc in docs:
            self.enqueue_published_item(doc, doc)

    def on_update(self, updates, original):
        # Find all planning items in the list
        added_featured = [id for id in updates.get('items') if id not in original.get('items')]
        self.validate_featured_attrribute(added_featured)
        updates['version_creator'] = str(get_user_id())
        self.post_featured_planning(updates, original)

    def on_updated(self, updates, original):
        self.enqueue_published_item(updates, original)

    def post_featured_planning(self, updates, original={}):
        if updates.get('posted', False):
            self.validate_post_status(updates.get('items', original.get('items' or [])))
            updates['posted'] = True
            updates['last_posted_time'] = utcnow()
            updates['last_posted_by'] = str(get_user_id())

    def enqueue_published_item(self, updates, original):
        if updates.get('posted', False):
            plan = deepcopy(original)
            plan.update(updates)
            version, plan = get_version_item_for_post(plan)

            # Create an entry in the planning versions collection for this published version
            version_id = get_resource_service('published_planning').post([{'item_id': plan['_id'],
                                                                           'version': version,
                                                                           'type': 'planning_featured',
                                                                           'published_item': plan}])
            if version_id:
                # Asynchronously enqueue the item for publishing.
                enqueue_planning_item.apply_async(kwargs={'id': version_id[0]}, serializer="eve/json")
            else:
                logger.error('Failed to save planning_featured version for featured item id {}'.format(plan['_id']))

    def validate_featured_attrribute(self, planning_ids):
        planning_service = get_resource_service('planning')
        for planning_id in planning_ids:
            planning_item = planning_service.find_one(req=None, _id=planning_id)
            if not planning_item.get('featured'):
                raise SuperdeskApiError.badRequestError(
                    message="A planning item in the list is not featured.")

    def validate_post_status(self, planning_ids):
        planning_service = get_resource_service('planning')
        for planning_id in planning_ids:
            planning_item = planning_service.find_one(req=None, _id=planning_id)
            if not planning_item.get('pubstatus', None):
                raise SuperdeskApiError.badRequestError(
                    message="Not all planning items are posted. Aborting post action.")

    def get_id_for_date(self, date):
        local_date = utc_to_local(app.config['DEFAULT_TIMEZONE'], date)
        return local_date.strftime(ID_DATE_FORMAT)


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
    'posted': {'type': 'boolean'},
    'last_posted_time': {'type': 'datetime'},
    'last_posted_by': metadata_schema['version_creator'],
    'original_creator': metadata_schema['original_creator'],
    'version_creator': metadata_schema['version_creator'],
    'firstcreated': metadata_schema['firstcreated'],
    'versioncreated': metadata_schema['versioncreated'],
    # Item type used by superdesk publishing
    ITEM_TYPE: {
        'type': 'string',
        'mapping': not_analyzed,
        'default': 'planning_featured'
    }
}


class PlanningFeaturedResource(superdesk.Resource):
    """Resource for planning featured data model"""

    url = 'planning_featured'
    endpoint_name = url
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

    merge_nested_documents = True
