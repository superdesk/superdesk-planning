# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

import logging
from eve.utils import ParsedRequest

from superdesk import get_resource_service
from superdesk.core import get_current_app
from superdesk.resource_fields import ID_FIELD
from superdesk import Resource
from superdesk.eve_async.service import AsyncBaseService
from superdesk.metadata.item import metadata_schema
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from superdesk.utils import ListCursor
from planning.common import DUPLICATE_EVENT_IGNORED_FIELDS
from apps.archive.common import get_user
from .events_schema import events_schema

logger = logging.getLogger(__name__)


class EventsTemplateResource(Resource):
    """
    Resource for events template
    """

    endpoint_name = "events_template"
    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "DELETE", "PATCH", "PUT"]

    privileges = {
        "GET": "planning_event_management",
        "POST": "planning_event_templates",
        "DELETE": "planning_event_templates",
        "PATCH": "planning_event_templates",
        "PUT": "planning_event_templates",
    }
    _event_fields = {
        "slugline": {"type": "string", "required": False, "readonly": True},
        "name": {"type": "string", "required": False, "readonly": True},
        "definition_short": {"type": "string", "required": False, "readonly": True},
        "definition_long": {"type": "string", "required": False, "readonly": True},
        "internal_note": {"type": "string", "required": False, "readonly": True},
        "ednote": {"type": "string", "required": False, "readonly": True},
        "links": {"type": "list", "readonly": True},
        "occur_status": {
            "type": "dict",
            "allow_unknown": True,
            "schema": {
                "qcode": {"type": "string"},
                "name": {"type": "string"},
                "label": {"type": "string"},
            },
            "readonly": True,
        },
        "files": {
            "type": "list",
            "schema": Resource.rel("events_files"),
            "readonly": True,
        },
        "calendars": {
            "type": "list",
            "schema": {
                "type": "dict",
                "allow_unknown": True,
                "schema": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"},
                    "is_active": {"type": "boolean"},
                },
            },
            "readonly": True,
        },
        "location": {"type": "list", "schema": {"type": "dict"}, "readonly": True},
        "event_contact_info": {
            "type": "list",
            "schema": Resource.rel("contacts"),
            "readonly": True,
        },
        "subject": {"type": "list", "schema": {"type": "dict"}, "readonly": True},
        "embedded_planning": events_schema["embedded_planning"],
    }

    schema = {
        "template_name": {
            "type": "string",
            "required": True,
            "empty": False,
            "unique": True,
        },
        "based_on_event": Resource.rel(
            "events",
            type=metadata_schema[ID_FIELD]["type"],
            embeddable=False,
            required=True,
        ),
        "data": {"type": "dict", "schema": _event_fields, "allow_unknown": True},
    }


class EventsTemplateService(AsyncBaseService):
    """
    CRUD service for events templates
    """

    async def on_create_async(self, docs):
        for doc in docs:
            await self._fill_event_template(doc)

    async def on_created_async(self, docs):
        user = get_user()
        for doc in docs:
            push_notification(
                "events-template:created",
                item=str(doc.get(ID_FIELD)),
                user=str(user.get(ID_FIELD)),
            )

    async def on_update_async(self, updates, original):
        self._validate_based_on_event(updates, original)

    async def on_updated_async(self, updates, original):
        user = get_user()
        push_notification(
            "events-template:updated",
            item=str(original[ID_FIELD]),
            user=str(user.get(ID_FIELD)),
        )

    async def on_replace_async(self, document, original):
        self._validate_based_on_event(document, original)

    async def on_replaced_async(self, document, original):
        user = get_user()
        push_notification(
            "events-template:replaced",
            item=str(original[ID_FIELD]),
            user=str(user.get(ID_FIELD)),
        )

    async def on_deleted_async(self, doc):
        user = get_user()
        push_notification(
            "events-template:deleted",
            item=str(doc[ID_FIELD]),
            user=str(user.get(ID_FIELD)),
        )

    @staticmethod
    def _validate_based_on_event(updates, original):
        # we can't change `based_on_event` id
        if "based_on_event" in updates and updates["based_on_event"] != original["based_on_event"]:
            raise SuperdeskApiError.badRequestError(
                message="Request is not valid",
                payload={"based_on_event": "This value can't be changed."},
            )

    @staticmethod
    async def _get_event(_id):
        return await get_resource_service("events").find_one_async(req=None, _id=_id)

    async def _fill_event_template(self, doc):
        event = await self._get_event(doc["based_on_event"])
        assert event is not None, "Expected event to be a dict, got None"
        doc.setdefault("data", {}).update(event.copy())
        for field in DUPLICATE_EVENT_IGNORED_FIELDS:
            doc["data"].pop(field, None)


class RecentEventsTemplateResource(Resource):
    resource_methods = ["GET"]
    item_methods = []
    endpoint_name = "recent_events_template"


class RecentEventsTemplateService(AsyncBaseService):
    """
    Recent event templates
    """

    async def on_fetched_async(self, doc):
        # remove hateoas `_links` from each item
        for item in doc["_items"]:
            del item["_links"]

    async def get_async(self, req, lookup):
        """Return recently used event templates.

        `limit` query param can be used to override default limit.
        Default limit is 5.

        :param req: parsed request
        :param lookup: additional filter
        :return:
        """
        if req is None:
            req = ParsedRequest()

        limit = req.args.get("limit", type=int)
        pipeline = [
            {"$match": {"template": {"$ne": None}}},
            {
                "$group": {
                    "_id": "$template",
                }
            },
            {"$sort": {"_created": -1}},
        ]
        if limit:
            pipeline.append({"$limit": limit})

        app = get_current_app()
        templates_ids = [_["_id"] for _ in app.data.mongo.pymongo(resource="events").db["events"].aggregate(pipeline)]
        templates = await (
            app.data.mongo_async.pymongo(resource="events_template")
            .db["events_template"]
            .find({"_id": {"$in": templates_ids}})
        ).to_list()
        # keep `templates_ids` ordering
        templates.sort(key=lambda template: templates_ids.index(template["_id"]))
        # query not used templates
        templates += await (
            app.data.mongo_async.pymongo(resource="events_template")
            .db["events_template"]
            .find({"_id": {"$nin": templates_ids}})
        ).to_list()

        return ListCursor(templates)
