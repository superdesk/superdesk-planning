# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from eve.utils import config, ParsedRequest
from eve.methods.common import resolve_embedded_fields, resolve_embedded_documents
from superdesk import Service, Resource
from superdesk.utils import ListCursor
from .events import EventsResource
from .planning import PlanningResource
from .planning.planning_featured import PlanningFeaturedResource
import logging

logger = logging.getLogger(__name__)


class PublishedPlanningService(Service):
    def _resolve_embedded_item(self, doc, req):
        """Resolve embedded fields

        :param dict doc: document to resolved embedded fields
        :param req: request object
        :return:
        """
        if not req:
            return

        if doc.get('type') == 'event':
            # get the embedded fields from events resources
            fields = resolve_embedded_fields(EventsResource.endpoint_name, req) or []
            resolve_embedded_documents(doc.get('published_item'), EventsResource.endpoint_name, fields)
        elif doc.get('type') == 'planning':
            fields = resolve_embedded_fields(PlanningResource.endpoint_name, req) or []
            resolve_embedded_documents(doc.get('published_item'), PlanningResource.endpoint_name, fields)
        elif doc.get('type') == 'planning_featured':
            fields = resolve_embedded_fields(PlanningFeaturedResource.endpoint_name, req) or []
            resolve_embedded_documents(doc.get('published_item'), PlanningFeaturedResource.endpoint_name, fields)

    def get(self, req, lookup):
        cursor = super().get(req, lookup)
        if req and req.embedded:
            documents = []
            for doc in cursor:
                self._resolve_embedded_item(doc, req)
                documents.append(doc)

            cursor = ListCursor(docs=documents)

        return cursor

    def get_last_published_item(self, item_id):
        """Get the last published item

        :param item_id: Id of the planning item or event ite,
        :return:
        """
        req = ParsedRequest()
        req.sort = '-version'
        return self.find_one(req=req, item_id=item_id)


class PublishedPlanningResource(Resource):
    """
    Resource for storing the published versions of planning and events as published
    """

    url = 'published_planning'
    schema = {
        config.ID_FIELD: {
            'type': 'string',
            'unique': True
        },
        # Id of the item
        'item_id': {
            'type': 'string'
        },
        # The version of the item stored
        'version': {
            'type': 'integer'
        },
        # Indicates if the item is a version of a planning item or an event
        'type': {
            'type': 'string'
        },
        # The item as published
        'published_item': {
            'type': 'dict',
            'schema': {},
            'allow_unknown': True,
        }
    }

    item_methods = ['GET']
    resource_methods = ['GET']
    mongo_indexes = {'item_id_1_version_1': [('item_id', 1), ('version', 1)]}
