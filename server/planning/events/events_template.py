# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

import logging
from flask import current_app as app
from eve.utils import config, ParsedRequest
from superdesk import Resource, get_resource_service
from superdesk.services import BaseService
from superdesk.metadata.item import metadata_schema
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from superdesk.utils import ListCursor
from apps.archive.common import get_user

logger = logging.getLogger(__name__)


class EventsTemplateResource(Resource):
    """
    Resource for events template
    """

    endpoint_name = 'events_template'
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'DELETE', 'PATCH', 'PUT']
    privileges = {
        'GET': 'planning_event_management',
        'POST': 'planning_event_templates',
        'DELETE': 'planning_event_templates',
        'PATCH': 'planning_event_templates',
        'PUT': 'planning_event_templates'
    }
    _event_fields = {
        'slugline': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'name': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'definition_short': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'definition_long': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'internal_note': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'ednote': {
            'type': 'string',
            'required': False,
            'readonly': True
        },
        'links': {
            'type': 'list',
            'readonly': True
        },
        'occur_status': {
            'type': 'dict',
            'schema': {
                'qcode': {
                    'type': 'string'
                },
                'name': {
                    'type': 'string'
                },
                'label': {
                    'type': 'string'
                },
            },
            'readonly': True
        },
        'files': {
            'type': 'list',
            'schema': Resource.rel('events_files'),
            'readonly': True
        },
        'calendars': {
            'type': 'list',
            'schema': {
                'type': 'dict',
                'schema': {
                    'qcode': {
                        'type': 'string'
                    },
                    'name': {
                        'type': 'string'
                    },
                    'is_active': {
                        'type': 'boolean'
                    }
                }
            },
            'readonly': True
        },
        'location': {
            'type': 'list',
            'schema': {
                'type': 'dict'
            },
            'readonly': True
        },
        'event_contact_info': {
            'type': 'list',
            'schema': Resource.rel('contacts'),
            'readonly': True
        },
        'subject': {
            'type': 'list',
            'schema': {
                'type': 'dict'
            },
            'readonly': True
        }
    }
    schema = {
        'template_name': {
            'type': 'string',
            'required': True,
            'empty': False,
            'unique': True
        },
        'based_on_event': Resource.rel(
            'events',
            type=metadata_schema[config.ID_FIELD]['type'],
            embeddable=False,
            required=True
        ),
        'data': {
            'type': 'dict',
            'schema': _event_fields
        }
    }


class EventsTemplateService(BaseService):
    """
    CRUD service for events templates
    """

    def on_create(self, docs):
        for doc in docs:
            self._fill_event_template(doc)

    def on_created(self, docs):
        user = get_user()
        for doc in docs:
            push_notification(
                'events-template:created',
                item=str(doc.get(config.ID_FIELD)),
                user=str(user.get(config.ID_FIELD))
            )

    def on_update(self, updates, original):
        self._validate_based_on_event(updates, original)

    def on_updated(self, updates, original):
        user = get_user()
        push_notification(
            'events-template:updated',
            item=str(original[config.ID_FIELD]),
            user=str(user.get(config.ID_FIELD))
        )

    def on_replace(self, doc, original):
        self._validate_based_on_event(doc, original)

    def on_replaced(self, document, original):
        user = get_user()
        push_notification(
            'events-template:replaced',
            item=str(original[config.ID_FIELD]),
            user=str(user.get(config.ID_FIELD))
        )

    def on_deleted(self, doc):
        user = get_user()
        push_notification(
            'events-template:deleted',
            item=str(doc[config.ID_FIELD]),
            user=str(user.get(config.ID_FIELD))
        )

    @staticmethod
    def _validate_based_on_event(updates, original):
        # we can't change `based_on_event` id
        if 'based_on_event' in updates and updates['based_on_event'] != original['based_on_event']:
            raise SuperdeskApiError.badRequestError(
                message="Request is not valid",
                payload={"based_on_event": "This value can't be changed."}
            )

    @staticmethod
    def _get_event(_id):
        return get_resource_service('events').find_one(None, _id=_id)

    def _fill_event_template(self, doc):
        event = self._get_event(doc['based_on_event'])
        doc['data'] = {}

        for field in ('slugline', 'name', 'definition_short', 'definition_long', 'anpa_category',
                      'internal_note', 'ednote', 'links', 'files', 'calendars', 'place',
                      'location', 'event_contact_info', 'subject', 'occur_status'):
            if field in event and event[field]:
                doc['data'][field] = event[field]


class RecentEventsTemplateResource(Resource):
    resource_methods = ['GET']
    item_methods = []
    endpoint_name = 'recent_events_template'


class RecentEventsTemplateService(BaseService):
    """
    Recent event templates
    """

    def on_fetched(self, doc):
        # remove hateoas `_links` from each item
        for item in doc['_items']:
            del item['_links']

    def get(self, req, lookup):
        """Return recently used event templates.

        `limit` query param can be used to override default limit.
        Default limit is 5.

        :param req: parsed request
        :param lookup: additional filter
        :return:
        """
        if req is None:
            req = ParsedRequest()

        limit = req.args.get('limit', type=int)
        pipeline = [
            {
                '$match': {
                    "template": {
                        '$ne': None
                    }
                }
            },
            {
                '$group': {
                    '_id': "$template",
                }
            },
            {
                '$sort': {
                    "_created": -1
                }
            }
        ]
        if limit:
            pipeline.append({'$limit': limit})

        templates_ids = [
            _['_id'] for _ in app.data.mongo.pymongo(resource='events').db['events'].aggregate(pipeline)
        ]
        templates = list(
            app.data.mongo.pymongo(resource='events_template').db['events_template'].find({
                '_id': {
                    '$in': templates_ids
                }
            })
        )
        # keep `templates_ids` ordering
        templates.sort(key=lambda template: templates_ids.index(template['_id']))
        # query not used templates
        templates += app.data.mongo.pymongo(resource='events_template').db['events_template'].find({
            '_id': {
                '$nin': templates_ids
            }
        })

        return ListCursor(templates)
