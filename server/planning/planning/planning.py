# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning"""

import logging
from copy import deepcopy

from quart_babel import gettext as _

from eve.methods.common import resolve_document_etag
from eve.utils import ParsedRequest

from superdesk.core import get_app_config
from superdesk.eve_async.service import AsyncBaseService
from superdesk.eve_async.cursors import AsyncEveCursor
from superdesk.resource_fields import ID_FIELD
from superdesk import Resource
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import item_url
from superdesk.users.services import current_user_has_privilege
from superdesk.publish_async.utils import get_next_sequence_number

from planning.types import PlanningItemType
from planning.common import (
    prepare_ingested_item_for_storage,
    TO_BE_CONFIRMED_FIELD,
    set_ingest_version_datetime,
    is_new_version,
    update_ingest_on_patch,
)

from planning.signals import planning_ingested
from planning.unified.common import convert_unified_planning_to_legacy_format, convert_legacy_planning_to_unified_format

logger = logging.getLogger(__name__)


class PlanningService(AsyncBaseService):
    """Service class for the planning model."""

    async def post_in_mongo(self, docs, **kwargs):
        """Post an ingested item(s)"""

        for doc in docs:
            prepare_ingested_item_for_storage(doc)
            self._resolve_defaults(doc)
            set_ingest_version_datetime(doc)

        await self.on_create_async(docs)
        resolve_document_etag(docs, self.datasource)
        ids = await self.backend.create_in_mongo_async(self.datasource, docs, **kwargs)
        await self.on_created_async(docs)
        for doc in docs:
            await planning_ingested.send(doc, None)
        return ids

    async def patch_in_mongo(self, id, document, original):
        """Patch an ingested item onto an existing item locally"""
        prepare_ingested_item_for_storage(document)
        update_ingest_on_patch(document, original)
        response = await self.backend.update_in_mongo_async(self.datasource, id, document, original)
        await self.on_updated_async(document, original, from_ingest=True)
        await planning_ingested.send(document, original)
        return response

    async def on_fetched_async(self, docs: dict) -> None:
        for doc in docs["_items"]:
            convert_unified_planning_to_legacy_format(doc)

    async def on_fetched_item_async(self, doc: dict) -> None:
        convert_unified_planning_to_legacy_format(doc)

    def is_new_version(self, new_item, old_item):
        return is_new_version(new_item, old_item)

    def ingest_cancel(self, item, feeding_service):
        """Ignore cancelling on ingest, this will happen in ``update_post_item``"""

        pass

    async def find_one_async(self, req, **lookup):
        item = await super().find_one_async(req, **lookup)
        if item:
            convert_unified_planning_to_legacy_format(item)

        return item

    async def create_async(self, docs: list[dict], skip_signals: bool = True, **kwargs):
        for doc in docs:
            doc["type"] = PlanningItemType.PLANNING
            convert_legacy_planning_to_unified_format(doc)

        response = await self.backend.create_async(self.datasource, docs, skip_signals=skip_signals, **kwargs)

        for doc in docs:
            convert_unified_planning_to_legacy_format(doc)

        return response

    async def post_async(self, docs: list[dict], **kwargs):
        return await self.create_async(docs, skip_signals=False)

    def should_update(self, old_item, new_item, provider):
        return True

    async def set_ingest_provider_sequence_async(self, item, provider):
        """Sets the value of ingest_provider_sequence in item.

        :param item: object to which ingest_provider_sequence to be set
        :param provider: ingest_provider object, used to build the key name of sequence
        """
        sequence_number = await get_next_sequence_number(
            key_name="ingest_providers_{_id}".format(_id=provider[ID_FIELD]),
            max_seq_number=get_app_config("MAX_VALUE_OF_INGEST_SEQUENCE"),
        )
        item["ingest_provider_sequence"] = str(sequence_number)

    async def update_async(self, id, updates, original, skip_signals: bool = True):
        if "planning_date" in updates or "all_day" in updates:
            updates["dates"] = (original.get("dates") or {}).copy()

        if "planning_date" in updates:
            updates["dates"]["start"] = updates.pop("planning_date")
        if "all_day" in updates:
            updates["dates"]["all_day"] = updates.pop("all_day")
        if TO_BE_CONFIRMED_FIELD in updates:
            updates["time_to_be_confirmed"] = updates.pop(TO_BE_CONFIRMED_FIELD)
        if "description_text" in updates:
            updates["definition_long"] = updates.pop("description_text")

        unified_original = deepcopy(original)
        convert_legacy_planning_to_unified_format(unified_original)
        new_updates = await self.backend.update_async(
            self.datasource,
            id,
            updates,
            unified_original,
            skip_signals=skip_signals,
        )

        if (new_updates.get("dates") or {}).get("start"):
            new_updates["planning_date"] = new_updates["dates"]["start"]
            new_updates.pop("dates")

        if "definition_long" in new_updates:
            new_updates["description_text"] = new_updates.pop("definition_long")

        return new_updates

    async def patch_async(self, id, updates: dict):
        original = await self.find_one_async(req=None, _id=id)
        if original is None:
            raise SuperdeskApiError.notFoundError(_(f"Item with id {id} not found"))

        return await self.update_async(id, updates, original, skip_signals=False)

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege("planning_planning_management"):
            return False, "User does not have sufficient permissions."
        return True, ""

    async def get_async(self, req: ParsedRequest | None, lookup: dict | None) -> AsyncEveCursor:
        if req is None:
            req = ParsedRequest()

        lookup = dict(lookup or {})
        lookup["type"] = PlanningItemType.PLANNING.value
        return await self.backend.get_async(self.datasource, req=req, lookup=lookup)


class PlanningResource(Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    endpoint_name = url = "planning"
    item_url = item_url
    allow_unknown = True
    datasource = {
        "source": "planning",
        "search_backend": "elastic",
    }
    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {
        "POST": "planning_planning_management",
        "PATCH": "planning_planning_management",
        "DELETE": "planning",
    }
    etag_ignore_fields = ["_planning_schedule", "_updates_schedule"]

    mongo_indexes = {
        "planning_recurrence_id": ([("planning_recurrence_id", 1)], {"background": True}),
    }

    merge_nested_documents = True
