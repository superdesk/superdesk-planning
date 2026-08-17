# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Events"""


import pytz
import logging
import itertools

from typing import Dict, Any, Optional
from datetime import datetime
from dateutil import parser

from eve.methods.common import resolve_document_etag
from eve.utils import ParsedRequest
from quart_babel import gettext as _

import superdesk
from superdesk.core import get_app_config, get_current_app
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.eve_async.cursors import AsyncEveCursor
from superdesk.errors import SuperdeskApiError
from superdesk.users.services import current_user_has_privilege
from superdesk.publish_async.utils import get_next_sequence_number

from planning.events.events_history_async_service import EventsHistoryAsyncService
from planning.types import Event, PLANNING_RELATED_EVENT_LINK_TYPE
from planning.types.unified import PlanningItemType
from planning.common import (
    prepare_ingested_item_for_storage,
    format_address,
    get_event_max_multi_day_duration,
    LOCK_ACTION,
    sanitize_input_data,
    set_ingest_version_datetime,
    is_new_version,
    update_ingest_on_patch,
)
from planning.utils import get_related_planning_for_events_async
from planning.unified.common import get_related_planning_for_events


logger = logging.getLogger(__name__)

# based on onclusive provided content fields for now
CONTENT_FIELDS = {
    "name",
    "definition_short",
    "definition_long",
    "links",
    "ednote",
    "subject",
    "anpa_category",
    "location",
    "event_contact_info",
}


def get_subject_str(subject: Dict[str, str]) -> str:
    return ":".join(
        [
            subject.get("name", ""),
            subject.get("qcode", ""),
            subject.get("scheme", ""),
            str(subject.get("translations", "")),
        ]
    )


def is_event_updated(new_item: Event, old_item: Event) -> bool:
    if new_item.get("name") != old_item.get("name"):
        return True
    new_subject = set([get_subject_str(subject) for subject in new_item.get("subject", [])])
    old_subject = set([get_subject_str(subject) for subject in old_item.get("subject", [])])
    if new_subject != old_subject:
        return True
    old_location = old_item.get("location", [])
    new_location = new_item.get("location", [])
    if new_location != old_location:
        return True
    return False


async def get_user_updated_keys(event_id: str) -> set[str]:
    history_service = EventsHistoryAsyncService()
    updates = await history_service.get_by_id(event_id)
    updated_keys: set[str] = set()
    for update in updates:
        if update.get("operation") == "ingested" or not update.get("user_id"):
            continue
        if update.get("update"):
            updated_keys.update(update["update"].keys())
    return updated_keys


class EventsService(AsyncBaseService):
    """Service class for the events model."""

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
        return ids

    async def patch_in_mongo(self, _id: str, document, original) -> Optional[Dict[str, Any]]:
        """Patch an ingested item onto an existing item locally"""
        prepare_ingested_item_for_storage(document)

        content_fields = get_current_app().config.get("EVENT_INGEST_CONTENT_FIELDS", CONTENT_FIELDS)
        updated_keys = await get_user_updated_keys(_id)
        for key in updated_keys:
            if key in document and key in content_fields and original.get(key):
                document[key] = original[key]

        set_planning_schedule(document)
        update_ingest_on_patch(document, original)

        events_history = EventsHistoryAsyncService()
        await events_history.on_item_updated(document, original, "ingested")

        response = await self.backend.update_in_mongo_async(self.datasource, _id, document, original)
        await self.on_updated_async(document, original, from_ingest=True)
        return response

    def is_new_version(self, new_item, old_item):
        return is_new_version(new_item, old_item) or is_event_updated(new_item, old_item)

    def ingest_cancel(self, item, feeding_service):
        """Ignore cancelling on ingest, this will happen in ``update_post_item``"""

        pass

    async def on_fetched_async(self, docs):
        for doc in docs["_items"]:
            await self._enhance_event_item(doc)

    async def on_fetched_item_async(self, doc):
        await self._enhance_event_item(doc)

    async def _enhance_event_item(self, doc):
        cursor = await get_related_planning_for_events([doc[ID_FIELD]], projection=["_id"])
        planning_ids = [plan.id async for plan in cursor]
        if len(planning_ids):
            doc["planning_ids"] = planning_ids

        for location in doc.get("location") or []:
            format_address(location)

        # this is to fix the existing events have original creator as empty string
        if not doc.get("original_creator"):
            doc.pop("original_creator", None)

    async def get_async(self, req: ParsedRequest | None, lookup: dict | None) -> AsyncEveCursor:
        if req is None:
            req = ParsedRequest()

        lookup = dict(lookup or {})
        lookup["type"] = PlanningItemType.EVENT.value
        return await self.backend.get_async(self.datasource, req=req, lookup=lookup)

    async def get_all_items_in_relationship(
        self, item: Event, event_link_type: PLANNING_RELATED_EVENT_LINK_TYPE = "primary"
    ):
        # Get recurring items
        if item.get("recurrence_id"):
            all_items = self.find(where={"recurrence_id": item.get("recurrence_id")})
            # Now, get associated planning items with the same recurrence
            return itertools.chain(
                all_items,
                await (
                    await get_resource_service("planning").find_async(
                        where={"recurrence_id": item.get("recurrence_id")}
                    )
                ).to_list(),
            )
        else:
            # Get associated planning items
            return await get_related_planning_for_events_async([item[ID_FIELD]], event_link_type)

    async def on_locked_event(self, doc, user_id):
        await self._enhance_event_item(doc)

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

    async def create_async(self, docs: list[dict], skip_signals: bool = True, **kwargs):
        for doc in docs:
            doc["type"] = "event"
        return await self.backend.create_async(self.datasource, docs, skip_signals=skip_signals, **kwargs)

    async def post_async(self, docs: list[dict], **kwargs):
        return await self.create_async(docs, skip_signals=False)

    async def update_async(self, id, updates, original, skip_signals: bool = True):
        return await self.backend.update_async(self.datasource, id, updates, original, skip_signals=skip_signals)

    async def patch_async(self, id, updates: dict):
        original = await self.find_one_async(req=None, _id=id)
        if original is None:
            raise SuperdeskApiError.notFoundError(_(f"Item with id {id} not found"))

        return await self.update_async(id, updates, original, skip_signals=False)

    # TODO-UNIFIED: Remove once all event actions are upgraded
    def validate_event(self, updates, original=None):
        """Validate the event

        @:param dict event: event created or updated
        """
        self._validate_multiday_event_duration(updates)
        self._validate_dates(updates, original)
        self._validate_convert_to_recurring(updates, original)
        self._validate_template(updates, original)

        # if len(updates.get('calendars', [])) > 0:
        # existing_calendars = get_resource_service('vocabularies').find_one(req=None, _id='event_calendars')
        # for calendar in updates['calendars']:
        # cal = [x for x in existing_calendars.get('items', []) if x['qcode'] == calendar.get('qcode')]
        # if not cal:
        # raise SuperdeskApiError(message="Calendar does not exist.")
        # if not cal[0].get('is_active'):
        # raise SuperdeskApiError(message="Disabled calendar cannot be selected.")

        # Remove duplicated calendars
        # uniq_qcodes = list_uniq_with_order([o['qcode'] for o in updates['calendars']])
        # updates['calendars'] = [cal for cal in existing_calendars.get('items', []) if cal['qcode'] in uniq_qcodes]
        sanitize_input_data(updates)

    def _validate_convert_to_recurring(self, updates, original):
        """Validates if the convert to recurring action is valid.

        :param updates:
        :param original:
        :return:
        """
        if not original:
            return

        if (
            original.get(LOCK_ACTION) == "convert_recurring"
            and updates.get("dates", {}).get("recurring_rule", None) is None
        ):
            raise SuperdeskApiError(message="Event recurring rules are mandatory for convert to recurring action.")
        if original.get(LOCK_ACTION) == "convert_recurring" and original.get("recurrence_id"):
            raise SuperdeskApiError(message="Event is already converted to recurring event.")

    def _validate_dates(self, updates, original=None):
        """Validate the dates

        @:param dict event:
        """
        event = updates if updates.get("dates") or not original else original
        dates = event.get("dates", {})
        start_date = dates.get("start")
        end_date = dates.get("end")

        if not start_date or not end_date:
            raise SuperdeskApiError(message="Event START DATE and END DATE are mandatory.")

        if (
            dates.get("no_end_time") is True
            and end_date.date() < get_local_date(dates.get("start"), dates.get("tz")).date()
        ):
            raise SuperdeskApiError(message="END TIME should be after START TIME")
        elif dates.get("no_end_time") is not True and end_date < start_date:
            raise SuperdeskApiError(message="END TIME should be after START TIME")

        if (
            event.get("dates", {}).get("recurring_rule")
            and not event["dates"]["recurring_rule"].get("until")
            and not event["dates"]["recurring_rule"].get("count")
        ):
            raise SuperdeskApiError(message="Recurring event should have an end (until or count)")

    def _validate_multiday_event_duration(self, event):
        """Validate that the multiday event duration is not greater than PLANNING_MAX_MULTI_DAY_DURATION

        @:param dict event: event created or updated
        """
        max_duration = get_event_max_multi_day_duration()
        if not max_duration > 0:
            return

        if not event.get("dates"):
            return

        dates = event.get("dates")
        if not dates:
            return

        start = dates.get("start")
        end = dates.get("end")

        if not start or not end:
            return

        # Parse dates
        start = parser.parse(start) if isinstance(start, str) else start
        end = parser.parse(end) if isinstance(end, str) else end

        event_duration = end - start

        if event_duration.days > max_duration:
            raise SuperdeskApiError.badRequestError(
                message="Event duration is greater than {} days.".format(max_duration)
            )

    @staticmethod
    def _validate_template(updates, original):
        """Ensures that event template can't be changed

        :param updates: updates to event that should be saved
        :type updates: dict
        :param original: original event before update
        :type original: dict
        :return:
        """
        if not original:
            return

        # we can't change `template` id
        if "template" in updates and updates["template"] != original["template"]:
            raise SuperdeskApiError.badRequestError(
                message="Request is not valid",
                payload={"template": "This value can't be changed."},
            )

    @staticmethod
    def can_edit(item, user_id):
        # Check privileges
        if not current_user_has_privilege("planning_event_management"):
            return False, "User does not have sufficient permissions."
        return True, ""

    def should_update(self, old_item, new_item, provider) -> bool:
        """Determine if an ingest feed event should update the local event.

        Allows updates when:
        - Event doesn't exist locally
        - Event is not cancelled/killed
        - Event is cancelled/killed but has no manual editor marker

        Key behavior: Ingest feeds must not update manually unposted events.
        Provider-origin cancellations remain ingest-updatable, so cancelled/killed
        alone does not block updates.

        Args:
            old_item: Existing event (None if doesn't exist)
            new_item: Incoming event from feed
            provider: Ingest provider config

        Returns:
            True if should update, False otherwise
        """
        if old_item is None:
            return True

        is_cancelled_or_killed = old_item.get("pubstatus") == "cancelled" or old_item.get("state") == "killed"
        if not is_cancelled_or_killed:
            return True

        manually_touched = old_item.get("version_creator") is not None
        return not manually_touched


class EventsResource(superdesk.Resource):
    """Resource for events data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 15.4 for schema details
    """

    endpoint_name = url = "events"
    # schema = events_schema
    item_url = r'regex("[\w,.:-]+")'
    resource_methods = ["GET", "POST"]
    datasource = {
        "source": "events",
        "search_backend": "elastic",
        "default_sort": [("dates.start", 1)],
    }
    item_methods = ["GET", "PATCH"]
    mongo_indexes = {
        "recurrence_id_1": ([("recurrence_id", 1)], {"background": True}),
        "state": ([("state", 1)], {"background": True}),
        "dates_start_1": ([("dates.start", 1)], {"background": True}),
        "dates_end_1": ([("dates.end", 1)], {"background": True}),
        "template": [("template", 1)],
    }
    privileges = {
        "POST": "planning_event_management",
        "PATCH": "planning_event_management",
    }
    allow_unknown = True
    merge_nested_documents = True


def set_planning_schedule(event):
    if event and event.get("dates") and event["dates"].get("start"):
        event["_planning_schedule"] = [{"scheduled": event["dates"]["start"]}]


def get_local_date(date: datetime, tz: str) -> datetime:
    try:
        return date.astimezone(pytz.timezone(tz))
    except pytz.exceptions.UnknownTimeZoneError:
        return date
