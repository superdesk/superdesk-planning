# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource_fields import ID_FIELD
from superdesk.flask import abort
from superdesk.eve_async.service import AsyncBaseService
from superdesk import get_resource_service, logger
from superdesk.resource import Resource, not_analyzed
from superdesk.notification import push_notification
from superdesk.users import user_metrics
from superdesk.utc import utcnow
from apps.auth import get_user

from .events import EventsResource
from planning.common import (
    WORKFLOW_STATE,
    POST_STATE,
    UPDATE_SINGLE,
    UPDATE_METHODS,
    UPDATE_FUTURE,
    get_contacts_from_item,
    get_item_post_state,
    enqueue_planning_item,
    get_version_item_for_post,
)

from planning.validate import validate_docs
from planning.events.events_utils import get_recurring_timeline, get_update_method
from planning.types import EventsHistoryResourceModel
from planning.utils import try_cast_object_id, get_related_planning_for_events_async
from planning.content_profiles.utils import is_post_planning_with_event_enabled, is_cancel_planning_with_event_enabled


class EventsPostResource(EventsResource):
    schema = {
        # Disable data relation validation for now
        "event": {"type": "string", "required": True},
        # "event": Resource.rel("events", type="string", required=True),
        "etag": {"type": "string", "required": True},
        "pubstatus": {"type": "string", "required": True, "allowed": tuple(POST_STATE)},
        # The update method used for recurring events
        "update_method": {
            "type": "string",
            "allowed": UPDATE_METHODS,
            "mapping": not_analyzed,
            "nullable": True,
        },
        # used to only repost an item when data changes from backend (update_repetitions)
        "repost_on_update": {"type": "boolean", "required": False, "default": False},
        "failed_planning_ids": {
            "type": "list",
            "required": False,
            "schema": {"type": "dict", "schema": {}},
        },
    }

    url = "events/post"
    resource_title = endpoint_name = "events_post"
    resource_methods = ["POST"]
    privileges = {"POST": "planning_event_post"}
    item_methods = []


class EventsPostService(AsyncBaseService):
    async def create_async(self, docs, **kwargs):
        events_service = get_resource_service("events")

        ids = []
        for doc in docs:
            event = await events_service.find_one_async(req=None, _id=doc["event"])
            doc["failed_planning_ids"] = []

            if not event:
                abort(412)

            update_method = get_update_method(doc, event)

            if (
                not doc.get("firstpublished")
                and doc.get("pubstatus") == POST_STATE.USABLE
                and event.get("original_creator")
            ):
                user_metrics.incr("published_events", event["original_creator"])

            if update_method == UPDATE_SINGLE:
                event_id, planning_ids = await self._post_single_event(doc, event)
            else:
                event_id, planning_ids = await self._post_recurring_events(doc, event, update_method)

            ids.append(event_id)
            if planning_ids:
                doc["failed_planning_ids"].extend(planning_ids)

        return ids

    @staticmethod
    def validate_post_state(new_post_state):
        try:
            assert new_post_state in tuple(POST_STATE)
        except AssertionError:
            abort(409)

    @staticmethod
    async def validate_item(doc):
        errors_list = await validate_docs([{"validate_on_post": True, "type": "event", "validate": doc}])
        errors = errors_list[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

    async def _post_single_event(self, doc, event):
        self.validate_post_state(doc["pubstatus"])
        await self.validate_item(event)
        updated_event, failed_planning_ids = await self.post_event(event, doc["pubstatus"], doc.get("repost_on_update"))

        event_type = "events:posted" if doc["pubstatus"] == POST_STATE.USABLE else "events:unposted"
        push_notification(
            event_type,
            item=event[ID_FIELD],
            etag=updated_event["_etag"],
            pubstatus=updated_event["pubstatus"],
            state=updated_event["state"],
        )

        return doc["event"], failed_planning_ids

    async def _post_recurring_events(self, doc, original, update_method):
        post_to_state = doc["pubstatus"]
        historic, past, future = await get_recurring_timeline(
            original, cancelled=True if post_to_state == POST_STATE.CANCELLED else False
        )

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            published_events = [original] + future
        else:
            published_events = historic + past + [original] + future

        # First we want to validate that all events can be posted
        for event in published_events:
            self.validate_post_state(post_to_state)
            await self.validate_item(event)

        # Next we perform the actual post
        updated_event = None
        ids = []
        items = []
        failed_planning_ids = []
        for event in published_events:
            updated_event, failed_planning_ids = await self.post_event(
                event, post_to_state, doc.get("repost_on_update")
            )
            ids.append(event[ID_FIELD])
            items.append({"id": event[ID_FIELD], "etag": updated_event["_etag"]})

        # Do not send push-notification if reposting as each event's post state is different
        # The original action's notifications should refetch items
        if not doc.get("repost_on_update"):
            event_type = (
                "events:posted:recurring" if doc["pubstatus"] == POST_STATE.USABLE else "events:unposted:recurring"
            )

            if updated_event:
                push_notification(
                    event_type,
                    item=original[ID_FIELD],
                    items=items,
                    recurrence_id=str(original.get("recurrence_id")),
                    pubstatus=updated_event["pubstatus"],
                    state=updated_event["state"],
                )

        return ids, failed_planning_ids

    async def post_event(self, event, new_post_state, repost):
        events_service = get_resource_service("events")
        events_history_service = EventsHistoryResourceModel.get_service()

        # update the event with new state
        if repost:
            # same pubstatus or scheduled (for draft events)
            new_post_state = event.get("pubstatus", POST_STATE.USABLE)

        failed_planning_ids = []

        new_item_state = get_item_post_state(event, new_post_state, repost)
        updates = {"state": new_item_state, "pubstatus": new_post_state}
        user = get_user()
        if user and user.get(ID_FIELD):
            updates["version_creator"] = user.get(ID_FIELD)

        if not event.get("firstpublished"):
            updates["firstpublished"] = utcnow()

        event["pubstatus"] = new_post_state
        # Remove previous workflow state reason
        if new_item_state in [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.KILLED]:
            updates["state_reason"] = None
            if not event.get("completed"):
                updates["actioned_date"] = None

        event_id = event[ID_FIELD]
        await events_service.update_async(event_id, updates, event, skip_signals=True)
        event.update(updates)

        # enqueue the event
        # these fields are set for enqueue process to work. otherwise not needed
        version, event = get_version_item_for_post(event)
        # save the version into the history
        updates["version"] = version

        await events_history_service._save_history(event, updates, "post")
        plannings = await get_related_planning_for_events_async([event[ID_FIELD]], "primary")

        event["plans"] = [p.get("_id") for p in plannings]
        await self.publish_event(event, version)

        if len(plannings) > 0:
            failed_planning_ids = await self.post_related_plannings(plannings, new_post_state)

        return event, failed_planning_ids

    async def publish_event(self, event, version):
        # check and remove private contacts while posting event, only public contact will be visible
        event["event_contact_info"] = [
            try_cast_object_id(contact["_id"]) async for contact in await get_contacts_from_item(event)
        ]

        """Enqueue the items for publish"""
        version_id = await get_resource_service("published_planning").post_async(
            [
                {
                    "item_id": event["_id"],
                    "version": version,
                    "type": "event",
                    "published_item": event,
                }
            ]
        )
        if version_id:
            # Enqueue the item for publishing.
            await enqueue_planning_item(version_id[0])
        else:
            logger.error("Failed to save planning version for event item id {}".format(event["_id"]))

    async def post_related_plannings(self, plannings, new_post_state):
        from planning.unified.actions import process_spike_planning_item

        planning_post_service = get_resource_service("planning_post")
        docs = []
        failed_planning_ids = []
        if new_post_state != POST_STATE.CANCELLED:
            if await is_post_planning_with_event_enabled():
                docs = [
                    {
                        "planning": planning[ID_FIELD],
                        "etag": planning.get("_etag"),
                        "pubstatus": POST_STATE.USABLE,
                    }
                    for planning in plannings
                    if not planning.get("versionposted")
                ]
            if len(docs) > 0:
                for doc in docs:
                    try:
                        await planning_post_service.post_async([doc], related_planning=True)
                    except Exception as e:
                        failed_planning_ids.append({"_id": doc["planning"], "error": getattr(e, "description", str(e))})
            return failed_planning_ids
        elif not await is_cancel_planning_with_event_enabled():
            return

        for planning in plannings:
            if not planning.get("pubstatus") and planning.get("state") in [
                WORKFLOW_STATE.INGESTED,
                WORKFLOW_STATE.DRAFT,
                WORKFLOW_STATE.POSTPONED,
                WORKFLOW_STATE.CANCELLED,
            ]:
                # TODO-ASNYC: Convert this to `async process_spike_planning_item` pure function when class is changed to async
                await process_spike_planning_item({"state": "spiked"}, planning)
            elif planning.get("pubstatus") != POST_STATE.CANCELLED:
                docs.append(
                    {
                        "planning": planning.get(ID_FIELD),
                        "etag": planning.get("etag"),
                        "pubstatus": POST_STATE.CANCELLED,
                    }
                )

        # unpost all required planning items
        if len(docs) > 0:
            await planning_post_service.post_async(docs)

    @staticmethod
    def _get_post_state(event, new_post_state):
        if new_post_state == POST_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if event.get("pubstatus") != POST_STATE.USABLE:
            # Publishing for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return event.get("state")
