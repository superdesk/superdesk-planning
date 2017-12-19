# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning Search."""
from flask import json, current_app as app
import superdesk
import logging
from superdesk.metadata.utils import item_url
from superdesk.resource import build_custom_hateoas

logger = logging.getLogger(__name__)


class SearchService(superdesk.Service):

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
        hits = self.elastic.es.search(body=query,
                                      index=self._get_index(types),
                                      doc_type=types)

        docs = self.elastic._parse_hits(hits, 'planning')

        for resource in types:
            response = {app.config['ITEMS']: [doc for doc in docs if doc['_type'] == resource]}
            getattr(app, 'on_fetched_resource')(resource, response)
            getattr(app, 'on_fetched_resource_%s' % resource)(response)

        return docs

    def find_one(self, req, **lookup):
        """Find item by id in all collections."""
        hits = self.elastic.es.mget({'ids': [lookup[app.config['ID_FIELD']]]}, self._get_index(self.repos))
        hits['hits'] = {'hits': hits.pop('docs', [])}
        docs = self.elastic._parse_hits(hits, 'planning')
        return docs.first()

    def _get_index(self, repos):
        """Get index id for all repos."""
        indexes = {app.data.elastic.index}
        for repo in repos:
            indexes.add(app.config['ELASTICSEARCH_INDEXES'].get(repo, app.data.elastic.index))
        return ','.join(indexes)

    def on_fetched(self, doc):
        """
        Overriding to add HATEOS for each individual item in the response.

        :param doc: response doc
        :type doc: dict
        """
        docs = doc[app.config['ITEMS']]
        for item in docs:
            build_custom_hateoas({'self': {'title': item['_type'], 'href': '/{}/{{_id}}'.format(item['_type'])}}, item)


class SearchResource(superdesk.Resource):
    resource_methods = ['GET']
    item_methods = ['GET']
    item_url = item_url
    endpoint_name = 'planning_search'


def init_app(app):
    superdesk.register_resource(SearchResource.endpoint_name,
                                SearchResource,
                                SearchService,
                                _app=app)
