# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Search."""
import logging
from flask import json, current_app as app
from eve_elastic.elastic import get_dates, format_doc, ElasticCursor
from copy import deepcopy

import superdesk
from superdesk.metadata.utils import item_url
from superdesk.resource import build_custom_hateoas

from planning.planning.planning import planning_schema
from planning.events.events_schema import events_schema

logger = logging.getLogger(__name__)


class PlanningSearchService(superdesk.Service):

    repos = ['events', 'planning']

    @property
    def elastic(self):
        return app.data.elastic

    def _get_query(self, req):
        """Get elastic query."""
        args = getattr(req, 'args', {})
        query = json.loads(args.get('source')) if args.get('source') else {'query': {'filtered': {}}}
        return query

    def _get_types(self, req):
        """Get document types for the given query."""
        args = getattr(req, 'args', {})
        repos = args.get('repo')

        if repos is None:
            return self.repos.copy()
        else:
            repos = repos.split(',')
            return [repo for repo in repos if repo in self.repos]

    def get(self, req, lookup):
        """Run the query against events and planning indexes"""
        query = self._get_query(req)
        types = self._get_types(req)
        fields = self._get_projected_fields(req)

        params = {}
        if fields:
            params['_source'] = fields

        docs = self.elastic.search(query, types, params)

        # to avoid call on_fetched_resource callback from some internal resource
        on_fetched_resource = True
        try:
            on_fetched_resource = req.exec_on_fetched_resource
        except AttributeError:
            pass

        if on_fetched_resource:
            for resource in types:
                response = {app.config['ITEMS']: [doc for doc in docs if doc['_type'] == resource]}
                getattr(app, 'on_fetched_resource')(resource, response)
                getattr(app, 'on_fetched_resource_%s' % resource)(response)

        return docs

    def _get_resource_schema(self, resource):
        datasource = self.elastic.get_datasource(resource)
        schema = {}
        schema.update(superdesk.config.DOMAIN[datasource[0]].get('schema', {}))
        schema.update(superdesk.config.DOMAIN[resource].get('schema', {}))
        return schema

    def _parse_hits(self, hits):
        schemas = {
            'planning': self._get_resource_schema('planning'),
            'events': self._get_resource_schema('events')
        }

        docs = []
        for hit in hits.get('hits', {}).get('hits', []):
            item_type = hit.get('_type')
            schema = schemas.get(item_type)
            dates = get_dates(schema)
            doc = format_doc(hit, schema, dates)
            build_custom_hateoas({'self': {'title': doc['_type'], 'href': '/{}/{{_id}}'.format(doc['_type'])}}, doc)
            docs.append(doc)

        return ElasticCursor(hits, docs)

    def _get_projected_fields(self, req):
        """Get elastic projected fields."""
        if app.data.elastic.should_project(req):
            return app.data.elastic.get_projected_fields(req)

    def _get_index(self, repos):
        """Get index id for all repos."""
        indexes = {app.data.elastic.index}
        for repo in repos:
            indexes.add(app.config['ELASTICSEARCH_INDEXES'].get(repo, app.data.elastic.index))
        return ','.join(indexes)


class PlanningSearchResource(superdesk.Resource):
    resource_methods = ['GET']
    item_methods = []
    item_url = item_url
    endpoint_name = 'planning_search'

    schema = deepcopy(planning_schema)
    schema.update(events_schema)
