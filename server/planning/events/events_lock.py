# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy
import logging

from superdesk.eve_async.service import AsyncBaseService
from superdesk.resource_fields import ID_FIELD
from superdesk.flask import request
from superdesk.resource import Resource, build_custom_hateoas
from superdesk.metadata.utils import item_url
from apps.archive.common import get_user, get_auth
from planning.item_lock import LockService
from apps.common.components.utils import get_component
from planning.common import update_returned_document
from planning.events.events_schema import events_schema
from planning.types import EventResourceModel


CUSTOM_HATEOAS_EVENTS = {"self": {"title": "Events", "href": "/events/{_id}"}}
logger = logging.getLogger(__name__)


class EventsLockResource(Resource):
    endpoint_name = "events_lock"
    url = "events/<{0}:item_id>/lock".format(item_url)
    schema = deepcopy(events_schema)
    datasource = {"source": "events"}
    resource_methods = ["GET", "POST"]
    resource_title = endpoint_name
    privileges = {"POST": "planning_event_management"}


class EventsLockService(AsyncBaseService):
    async def create_async(self, docs, **kwargs):
        item_id = request.view_args["item_id"]
        lock_action = docs[0].get("lock_action", "edit")
        return await self.lock_item(item_id, lock_action, docs[0])

    async def on_created_async(self, docs):
        build_custom_hateoas(CUSTOM_HATEOAS_EVENTS, docs[0], _id=str(docs[0][ID_FIELD]))

    async def lock_item(self, item_id, action, doc):
        events_service = EventResourceModel.get_service()

        user_id = get_user(required=True)["_id"]
        session_id = get_auth()["_id"]
        lock_action = action
        lock_service = get_component(LockService)

        item = await events_service.find_by_id_raw(item_id)
        assert item is not None, "Expected item to be a dict, got None"

        await lock_service.validate_relationship_locks(item, "events")
        updated_item = lock_service.lock(item, user_id, session_id, lock_action, "events")

        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_EVENTS)


class EventsUnlockResource(Resource):
    endpoint_name = "events_unlock"
    url = "events/<{0}:item_id>/unlock".format(item_url)
    schema = deepcopy(events_schema)
    datasource = {"source": "events"}
    resource_methods = ["GET", "POST"]
    resource_title = endpoint_name


class EventsUnlockService(AsyncBaseService):
    async def create_async(self, docs, **kwargs):
        item_id = request.view_args["item_id"]
        return await self.unlock_item(item_id, docs[0])

    async def on_created_async(self, docs):
        build_custom_hateoas(CUSTOM_HATEOAS_EVENTS, docs[0], _id=str(docs[0][ID_FIELD]))

    async def unlock_item(self, item_id, doc):
        events_service = EventResourceModel.get_service()

        user_id = get_user(required=True)["_id"]
        session_id = get_auth()["_id"]
        lock_service = get_component(LockService)

        item = await events_service.find_by_id_raw(item_id)
        assert item is not None, "Expected item to be a dict, got None"

        updated_item = lock_service.unlock(item, user_id, session_id, "events")
        return update_returned_document(doc, updated_item, CUSTOM_HATEOAS_EVENTS)
