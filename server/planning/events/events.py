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

from copy import deepcopy
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dateutil import parser

from eve.methods.common import resolve_document_etag


import superdesk
from superdesk.core import get_app_config, get_current_app
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk.notification import push_notification
from superdesk.utc import get_date, utcnow
from superdesk.users.services import current_user_has_privilege
from superdesk.publish_async.utils import get_next_sequence_number
from apps.auth import get_user, get_user_id
from apps.archive.common import get_auth, update_dates_for

from planning.events.events_reschedule import reschedule_single_event
from planning.events.events_history_async_service import EventsHistoryAsyncService
from planning.types import (
    EmbeddedCoverageItem,
    Event,
    PlanningRelatedEventLink,
    PLANNING_RELATED_EVENT_LINK_TYPE,
    EmbeddedPlanningDict,
)
from planning.common import (
    TEMP_ID_PREFIX,
    UPDATE_SINGLE,
    get_max_recurrent_events,
    WORKFLOW_STATE,
    ITEM_STATE,
    prepare_ingested_item_for_storage,
    remove_lock_information,
    format_address,
    update_post_item,
    post_required,
    POST_STATE,
    get_event_max_multi_day_duration,
    set_original_creator,
    set_ingested_event_state,
    LOCK_ACTION,
    sanitize_input_data,
    set_ingest_version_datetime,
    is_new_version,
    update_ingest_on_patch,
)
from planning.utils import (
    get_planning_event_link_method,
    get_related_planning_for_events,
    get_related_event_ids_for_planning,
)
from .events_schema import events_schema
from .events_sync import sync_event_metadata_with_planning_items
from .events_utils import get_recurring_event_updates_iterator, generate_recurring_dates

logger = logging.getLogger(__name__)


organizer_roles = {
    "eorol:artAgent": "Artistic agent",
    "eorol:general": "General organiser",
    "eorol:tech": "Technical organiser",
    "eorol:travAgent": "Travel agent",
    "eorol:venue": "Venue organiser",
}

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


# TODO-ASYNC: this method was migrated to events_utils and it uses pydantic models instead
def get_events_embedded_planning(event: Event) -> List[EmbeddedPlanningDict]:
    def get_coverage_id(coverage: EmbeddedCoverageItem) -> str:
        if not coverage.get("coverage_id"):
            coverage["coverage_id"] = TEMP_ID_PREFIX + "-" + generate_guid(type=GUID_NEWSML)
        return coverage["coverage_id"]

    return [
        EmbeddedPlanningDict(
            planning_id=planning.get("planning_id"),
            update_method=planning.get("update_method") or "single",
            coverages={get_coverage_id(coverage): coverage for coverage in planning.get("coverages") or []},
        )
        for planning in event.pop("embedded_planning", [])
    ]


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
            self._enhance_event_item(doc)

    async def on_fetched_item_async(self, doc):
        self._enhance_event_item(doc)

    def _enhance_event_item(self, doc):
        plannings = get_related_planning_for_events([doc[ID_FIELD]])

        if len(plannings):
            doc["planning_ids"] = [planning.get("_id") for planning in plannings]

        for location in doc.get("location") or []:
            format_address(location)

        # this is to fix the existing events have original creator as empty string
        if not doc.get("original_creator"):
            doc.pop("original_creator", None)

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
            return get_related_planning_for_events([item[ID_FIELD]], event_link_type)

    def on_locked_event(self, doc, user_id):
        self._enhance_event_item(doc)

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

    async def on_create_async(self, docs):
        # events generated by recurring rules
        generated_events = []

        for event in docs:
            # generates an unique id
            if "guid" not in event:
                event["guid"] = generate_guid(type=GUID_NEWSML)
            event[ID_FIELD] = event["guid"]

            # SDCP-638
            if not event.get("language"):
                try:
                    event["language"] = event["languages"][0]
                except (KeyError, IndexError):
                    event["language"] = get_app_config("DEFAULT_LANGUAGE")

            # family_id get on ingest we don't need it planning
            event.pop("family_id", None)

            # set the author
            set_original_creator(event)

            # set timestamps
            update_dates_for(event)

            # overwrite expiry date
            overwrite_event_expiry_date(event)

            # We ignore the 'update_method' on create
            if "update_method" in event:
                del event["update_method"]

            # Remove the 'expired' flag if it is set, as no new Event can be created
            # as expired
            if "expired" in event:
                del event["expired"]

            set_planning_schedule(event)
            planning_item = event.get("_planning_item")

            # validate event
            self.validate_event(event)

            # If _created_externally is true, generate_recurring_events is restricted.
            if event["dates"].get("recurring_rule", None) and not event["dates"]["recurring_rule"].get(
                "_created_externally", False
            ):
                event["dates"]["start"] = get_date(event["dates"]["start"])
                event["dates"]["end"] = get_date(event["dates"]["end"])
                recurring_events = generate_recurring_events(event)
                generated_events.extend(recurring_events)
                # remove the event that contains the recurring rule. We don't need it anymore
                docs.remove(event)  # todo: why we remove that event and not update it?

                # Set the current Event to the first Event in the new series
                # This will make sure the ID of the Event can be used when
                # using 'event' from here on, such as when linking to a Planning item
                event = recurring_events[0]
                # And set the Planning Item from the original
                # (generate_recurring_events removes this field)
                event["_planning_item"] = planning_item

            if planning_item:
                await self._link_to_planning(event)
                del event["_planning_item"]

        if generated_events:
            docs.extend(generated_events)

    async def create_async(self, docs: List[Event], **kwargs):
        """Saves the list of Events to Mongo & Elastic

        Also extracts out the ``embedded_planning`` before saving the Event(s)
        And then uses them to synchronise/process the associated Planning item(s)
        """

        embedded_planning_lists: list[tuple[Event, list[EmbeddedPlanningDict]]] = []
        for event in docs:
            emb_planning = get_events_embedded_planning(event)
            if len(emb_planning):
                embedded_planning_lists.append((event, emb_planning))  # type: ignore

        ids = self.backend.create(self.datasource, docs, **kwargs)

        if len(embedded_planning_lists):
            for event, embedded_planning in embedded_planning_lists:
                await sync_event_metadata_with_planning_items(None, event, embedded_planning)

        return ids

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

    async def on_created_async(self, docs):
        """Send WebSocket Notifications for created Events

        Generate the list of IDs for recurring and non-recurring events
        Then send this list off to the clients so they can fetch these events
        """
        notifications_sent = []
        history_service = EventsHistoryAsyncService()

        for doc in docs:
            event_id = str(doc.get(ID_FIELD))

            if doc.get("state") == "ingested":
                await history_service.on_item_created([doc])

            # If we duplicated this event, update the history
            if doc.get("duplicate_from"):
                parent_id = doc["duplicate_from"]
                parent_event = self.find_one(req=None, _id=parent_id)

                await history_service.on_item_updated({"duplicate_id": event_id}, parent_event, "duplicate")
                await history_service.on_item_updated({"duplicate_id": parent_id}, doc, "duplicate_from")

                duplicate_ids = parent_event.get("duplicate_to", [])
                duplicate_ids.append(event_id)
                self.patch(parent_id, {"duplicate_to": duplicate_ids, ID_FIELD: parent_id})

            event_type = "events:created"
            user_id = str(doc.get("original_creator", ""))

            if doc.get("recurrence_id"):
                event_type = "events:created:recurring"
                event_id = str(doc["recurrence_id"])

            # Don't send notification if one has already been sent
            # This is to ensure recurring events doesn't send multiple notifications
            if event_id in notifications_sent or "previous_recurrence_id" in doc:
                continue

            notifications_sent.append(event_id)
            push_notification(event_type, item=event_id, user=user_id)

    @staticmethod
    def can_edit(item, user_id):
        # Check privileges
        if not current_user_has_privilege("planning_event_management"):
            return False, "User does not have sufficient permissions."
        return True, ""

    async def update_async(self, id, updates, original):
        """Updated the Event in Mongo & Elastic

        Also extracts out the ``embedded_planning`` before saving the Event
        And then uses them to synchronise/process the associated Planning item(s)
        """

        updates.setdefault("versioncreated", utcnow())

        # Extract the ``embedded_planning`` from the updates
        embedded_planning = get_events_embedded_planning(updates)

        item = self.backend.update(self.datasource, id, updates, original)

        # Process ``embedded_planning`` field, and sync Event metadata with associated Planning/Coverages
        await sync_event_metadata_with_planning_items(original, updates, embedded_planning)

        return item

    async def on_update_async(self, updates, original):
        """Update single or series of recurring events.

        Determine if the supplied event is a single event or a
        series of recurring events, and call the appropriate method
        for the event type.
        """
        if "skip_on_update" in updates:
            # this is a recursive update (see below)
            del updates["skip_on_update"]
            return

        if updates.get("dates") and original.get("dates"):
            for field in original.get("dates"):  # we need to preserve non updated values
                updates["dates"].setdefault(field, original["dates"][field])

        update_method = updates.pop("update_method", UPDATE_SINGLE)

        user = get_user()
        user_id = user.get(ID_FIELD) if user else None

        if user_id:
            updates["version_creator"] = user_id
            set_ingested_event_state(updates, original)

        lock_user = original.get("lock_user", None)
        str_user_id = str(user.get(ID_FIELD)) if user_id else None

        if lock_user and str(lock_user) != str_user_id:
            raise SuperdeskApiError.forbiddenError("The item was locked by another user")

        # If only the `recurring_rule` was provided, then fill in the rest from the original
        # This can happen, for example, when converting a single Event to a series of Recurring Events
        if list(updates.get("dates") or {}) == ["recurring_rule"]:
            new_dates = deepcopy(original["dates"])
            new_dates.update(updates["dates"])
            updates["dates"] = new_dates

        # validate event
        self.validate_event(updates, original)

        # Run the specific methods based on if the original is a
        # single or a series of recurring events
        if not original.get("dates", {}).get("recurring_rule", None) or update_method == UPDATE_SINGLE:
            await self._update_single_event(updates, original)
        else:
            await self._update_recurring_events(updates, original, update_method)

    async def on_updated_async(self, updates, original, from_ingest: Optional[bool] = None):
        # If this Event was converted to a recurring series
        # Then update all associated Planning items with the recurrence_id
        if updates.get("recurrence_id") and not original.get("recurrence_id"):
            await get_resource_service("planning").on_event_converted_to_recurring(updates, original)

        if not updates.get("duplicate_to"):
            posted = await update_post_item(updates, original)
            if posted:
                new_event = await get_resource_service("events").find_one_async(req=None, _id=original.get(ID_FIELD))
                updates["_etag"] = new_event["_etag"]
                updates["state_reason"] = new_event.get("state_reason")

        if original.get("lock_user") and "lock_user" in updates and updates.get("lock_user") is None:
            # when the event is unlocked by the patch.
            push_notification(
                "events:unlock",
                item=str(original.get(ID_FIELD)),
                user=str(get_user_id()),
                lock_session=str(get_auth().get("_id")),
                etag=updates["_etag"],
                recurrence_id=original.get("recurrence_id") or None,
                from_ingest=from_ingest,
                type=original.get("type"),
            )

        await self.delete_event_files(updates, original)

        if "location" not in updates and original.get("location"):
            updates["location"] = original["location"]

        updates[ID_FIELD] = original[ID_FIELD]
        self._enhance_event_item(updates)

    async def on_deleted_async(self, doc):
        push_notification(
            "events:delete",
            item=str(doc.get(ID_FIELD)),
            user=str(get_user_id()),
            lock_session=str(get_auth().get("_id")),
        )

    async def _update_single_event(self, updates, original):
        """Updates the metadata of a single event.

        If recurring_rule is provided, we convert this single event into
        a series of recurring events, otherwise we simply update this event.
        """

        if post_required(updates, original):
            merged = deepcopy(original)
            merged.update(updates)
            await get_resource_service("events_post").validate_item(merged)

        # Determine if we're to convert this single event to a recurring of events, either through
        # conversion from recurring form or from within the event editor
        if (original.get(LOCK_ACTION) == "convert_recurring" or original.get(LOCK_ACTION) == "edit") and updates.get(
            "dates", {}
        ).get("recurring_rule", None) is not None:
            generated_events = await self._convert_to_recurring_event(updates, original)

            # if the original event was "posted" then post all the generated events
            if original.get("pubstatus") in [POST_STATE.CANCELLED, POST_STATE.USABLE]:
                post = {
                    "event": generated_events[0][ID_FIELD],
                    "etag": generated_events[0]["_etag"],
                    "update_method": "all",
                    "pubstatus": original.get("pubstatus"),
                }
                await get_resource_service("events_post").post_async([post])

            push_notification(
                "events:updated:recurring",
                item=str(original[ID_FIELD]),
                user=str(updates.get("version_creator", "")),
                recurrence_id=str(generated_events[0]["recurrence_id"]),
            )
        else:
            if get_planning_event_link_method() == "many_secondary":
                set_planning_schedule(updates)
            else:
                updates.pop("dates", None)

            if original.get("lock_action") == "mark_completed" and updates.get("actioned_date"):
                await self.mark_event_complete(original, updates, original, None)

            # This updates Event metadata only
            push_notification(
                "events:updated",
                item=str(original[ID_FIELD]),
                user=str(updates.get("version_creator", "")),
            )

    async def _update_recurring_events(self, updates, original, update_method):
        """Method to update recurring events.

        If the recurring_rule has been removed for this event, process
        it separately, otherwise update the event and/or its recurring rules
        """

        if get_planning_event_link_method() != "many_secondary":
            # We only support changing Event schedule(s) through the main endpoint
            # if ``PLANNING_EVENT_LINK_METHOD`` is set to ``many_secondary``
            # If this is not the case, then we only update the metadata
            updates.pop("dates", None)

        # If this update is from assignToCalendar action
        # Then we only want to update the calendars of each Event
        only_calendars = original.get("lock_action") == "assign_calendar"
        original_calendar_qcodes = [calendar["qcode"] for calendar in original.get("calendars") or []]
        # Get the list of calendars added
        updated_calendars = [
            calendar for calendar in updates.get("calendars") or [] if calendar["qcode"] not in original_calendar_qcodes
        ]

        mark_completed = original.get("lock_action") == "mark_completed" and updates.get("actioned_date")
        mark_complete_validated = False

        events_post_service = get_resource_service("events_post")
        updates_to_apply: list[tuple[str, dict]] = []
        async for event, new_updates in get_recurring_event_updates_iterator(original, updates, update_method):
            event_id = event[ID_FIELD]
            new_dates = new_updates.get("dates", None)
            new_updates.update(updates)

            if new_dates:
                new_updates["dates"] = new_dates
            else:
                new_updates.pop("dates", None)

            if only_calendars:
                # Get the original for this item, and add new calendars to it
                # Skipping calendars already assigned to this item
                original_event = self.find_one(req=None, _id=event_id)
                original_qcodes = [calendar["qcode"] for calendar in original_event.get("calendars") or []]

                new_updates["calendars"] = deepcopy(original_event.get("calendars") or [])
                new_updates["calendars"].extend(
                    [calendar for calendar in updated_calendars if calendar["qcode"] not in original_qcodes]
                )
            elif mark_completed:
                await self.mark_event_complete(original, updates, event, mark_complete_validated)
                # It is validated if the previous function did not raise an error
                mark_complete_validated = True

            # Remove ``embedded_planning`` before updating this event, as this should only be handled
            # by the event provided to this update request
            new_updates.pop("embedded_planning", None)

            # If this item is to be posted, make sure it passes validation
            # before we proceed with updating all the affected Events
            if post_required(updates, event):
                merged = deepcopy(event)
                merged.update(new_updates)
                await events_post_service.validate_item(merged)

            updates_to_apply.append((event_id, new_updates))

        # Finally, update the affected Events
        for event_id, new_updates in updates_to_apply:
            await self.patch_async(event_id, new_updates)
            app = get_current_app().as_any()
            await app.on_updated_events.call_async(new_updates, {"_id": event_id})

        # And finally push a notification to connected clients
        push_notification(
            "events:updated:recurring",
            item=str(original[ID_FIELD]),
            recurrence_id=str(original["recurrence_id"]),
            user=str(updates.get("version_creator", "")),
        )

    async def mark_event_complete(self, original, updates, event, mark_complete_validated):
        # If the entire series is in future, raise an error
        if event.get("recurrence_id"):
            if not mark_complete_validated:
                if event["dates"]["start"].date() > updates["actioned_date"].date():
                    raise SuperdeskApiError.badRequestError("Recurring series has not started.")

            # If we are marking an event as completed
            # Update only those which are behind the 'actioned_date'
            if event["dates"]["start"] < updates["actioned_date"]:
                return

        for plan in get_related_planning_for_events([event[ID_FIELD]], "primary"):
            if plan.get("state") != WORKFLOW_STATE.CANCELLED and len(plan.get("coverages", [])) > 0:
                await get_resource_service("planning_cancel").patch_async(
                    plan[ID_FIELD],
                    {
                        "reason": "Event Completed",
                        "cancel_all_coverage": True,
                    },
                )

    async def _convert_to_recurring_event(self, updates, original):
        """Convert a single event to a series of recurring events"""
        self._validate_convert_to_recurring(updates, original)
        updates["recurrence_id"] = original["_id"]

        merged = deepcopy(original)
        merged.update(updates)

        # Generated new events will be "draft"
        merged[ITEM_STATE] = WORKFLOW_STATE.DRAFT

        generated_events = generate_recurring_events(merged, updates["recurrence_id"])
        updated_event = generated_events.pop(0)

        # Check to see if the first generated event is different from original
        # If yes, mark original as rescheduled with generated recurrence_id
        if updated_event["dates"]["start"].date() != original["dates"]["start"].date():
            # Reschedule original event
            updates["update_method"] = UPDATE_SINGLE
            updates["dates"] = updated_event["dates"]
            set_planning_schedule(updates)
            await reschedule_single_event(updates, original)
            if updates.get("state") == WORKFLOW_STATE.RESCHEDULED:
                history_service = EventsHistoryAsyncService()
                await history_service.on_reschedule(updates, original)
        else:
            # Original event falls as a part of the series
            # Remove the first element in the list (the current event being updated)
            # And update the start/end dates to be in line with the new recurring rules
            updates["dates"]["start"] = updated_event["dates"]["start"]
            updates["dates"]["end"] = updated_event["dates"]["end"]
            set_planning_schedule(updates)
            remove_lock_information(item=updates)

        # Create the new events and generate their history
        await self.create_async(generated_events)
        app = get_current_app().as_any()
        await app.on_inserted_events.call_async(generated_events)
        return generated_events

    @staticmethod
    async def _link_to_planning(event: Event):
        """
        Links an Event to an existing Planning Item

        The Planning item remains locked, it is up to the client to release this lock
        after this operation is complete
        """
        planning_service = get_resource_service("planning")
        plan_id = event["_planning_item"]
        event_id = event[ID_FIELD]
        planning_item = await planning_service.find_one_async(req=None, _id=plan_id)

        if not planning_item:
            raise SuperdeskApiError.badRequestError("Planning item not found")

        updates = {"related_events": planning_item.get("related_events") or []}
        event_link_method = get_planning_event_link_method()
        link_type: PLANNING_RELATED_EVENT_LINK_TYPE = (
            "primary"
            if not len(get_related_event_ids_for_planning(planning_item, "primary"))
            and event_link_method in ("one_primary", "one_primary_many_secondary")
            else "secondary"
        )
        related_planning = PlanningRelatedEventLink(_id=event_id, link_type=link_type)
        updates["related_events"].append(related_planning)

        # Add ``recurrence_id`` if the supplied Event is part of a series
        if event.get("recurrence_id"):
            related_planning["recurrence_id"] = event["recurrence_id"]
            if not planning_item.get("recurrence_id") and link_type == "primary":
                updates["recurrence_id"] = event["recurrence_id"]

        await planning_service.validate_on_update(updates, planning_item, get_user())
        await planning_service.system_update_async(plan_id, updates, planning_item)
        app = get_current_app().as_any()
        await app.on_updated_planning.call_async(updates, planning_item)

    async def delete_event_files(self, updates, original):
        files = [f for f in original.get("files", []) if f not in (updates or {}).get("files", [])]
        files_service = get_resource_service("events_files")
        for file in files:
            events_using_file = await self.find_async(where={"files": file})
            if await events_using_file.count() == 0:
                await files_service.delete_action_async(lookup={"_id": file})

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
    schema = events_schema
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

    merge_nested_documents = True


def setRecurringMode(event):
    endRepeatMode = event.get("dates", {}).get("recurring_rule", {}).get("endRepeatMode")
    if endRepeatMode == "count":
        event["dates"]["recurring_rule"]["until"] = None
    elif endRepeatMode == "until":
        event["dates"]["recurring_rule"]["count"] = None


def overwrite_event_expiry_date(event):
    if "expiry" in event:
        expiry_minutes = get_app_config("PLANNING_EXPIRY_MINUTES", None)
        end = event.get("dates", {}).get("end")
        if isinstance(end, str):
            end = parser.isoparse(end)

        if end:
            event["expiry"] = end + timedelta(minutes=expiry_minutes or 0)


def generate_recurring_events(event, recurrence_id=None):
    generated_events = []
    setRecurringMode(event)
    embedded_planning_added = False

    # compute the difference between start and end in the original event
    time_delta = event["dates"]["end"] - event["dates"]["start"]
    # for all the dates based on the recurring rules:
    for date in itertools.islice(
        generate_recurring_dates(
            start=event["dates"]["start"],
            tz=event["dates"].get("tz") and pytz.timezone(event["dates"]["tz"] or None),
            all_day=bool(event["dates"].get("all_day")),
            **event["dates"]["recurring_rule"],
        ),
        0,
        get_max_recurrent_events(),
    ):  # set a limit to prevent too many events to be created
        # create event with the new dates
        new_event = deepcopy(event)

        # Remove fields not required by the new events
        for key in list(new_event.keys()):
            if key.startswith("_") or key.startswith("lock_"):
                new_event.pop(key)

            elif key == "embedded_planning":
                if not embedded_planning_added:
                    # If this is the first Event in the series, then keep
                    # the ``embedded_planning`` field for processing later
                    embedded_planning_added = True
                else:
                    # Otherwise remove the ``embedded_planning`` from all other Events
                    # in the series
                    new_event.pop("embedded_planning")

        new_event.pop("pubstatus", None)
        new_event.pop("reschedule_from", None)

        new_event["dates"]["start"] = date
        new_event["dates"]["end"] = date + time_delta
        # set a unique guid
        new_event["guid"] = generate_guid(type=GUID_NEWSML)
        new_event["_id"] = new_event["guid"]
        # set the recurrence id
        if not recurrence_id:
            recurrence_id = new_event["guid"]
        new_event["recurrence_id"] = recurrence_id

        # set expiry date
        overwrite_event_expiry_date(new_event)
        # the _planning_schedule
        set_planning_schedule(new_event)
        generated_events.append(new_event)

    return generated_events


def set_planning_schedule(event):
    if event and event.get("dates") and event["dates"].get("start"):
        event["_planning_schedule"] = [{"scheduled": event["dates"]["start"]}]


def get_local_date(date: datetime, tz: str) -> datetime:
    try:
        return date.astimezone(pytz.timezone(tz))
    except pytz.exceptions.UnknownTimeZoneError:
        return date
