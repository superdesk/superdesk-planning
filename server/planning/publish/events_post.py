# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy

from superdesk.resource_fields import ID_FIELD
from superdesk.flask import abort
from superdesk.eve_async.service import AsyncBaseService
from superdesk import get_resource_service
from superdesk.resource import not_analyzed
from superdesk.notification import push_notification
from superdesk.users import user_metrics
from superdesk.utc import utcnow
from apps.auth import get_user

from planning.events import EventsResource
from planning.common import (
    WORKFLOW_STATE,
    POST_STATE,
    UPDATE_SINGLE,
    UPDATE_METHODS,
    UPDATE_FUTURE,
    get_item_post_state,
    get_version_item_for_post,
)

from planning.events.events_utils import get_recurring_timeline, get_update_method
from planning.types import UnifiedPlanningHistoryResource, UnifiedPlanningResource
from planning.utils import get_related_planning_for_events_async
from planning.content_profiles.utils import is_post_planning_with_event_enabled, is_cancel_planning_with_event_enabled
from planning.planning.planning_utils import delete_assignments_for_coverages

from .common import validate_post_state, validate_item_for_publish, enqueue_unified_planning


class EventsPostResource(EventsResource):
    schema = {
        "event": {"type": "string", "required": True},
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
        events_service = UnifiedPlanningResource.get_service()

        ids = []
        assignments_to_delete: list[dict] = []
        for doc in docs:
            original = await events_service.find_by_id(doc["event"])
            if not original:
                abort(412)

            event = original.to_dict()
            doc["failed_planning_ids"] = []
            update_method = get_update_method(doc, event)

            if (
                not doc.get("firstpublished")
                and doc.get("pubstatus") == POST_STATE.USABLE
                and event.get("original_creator")
            ):
                user_metrics.incr("published_events", event["original_creator"])

            if update_method == UPDATE_SINGLE:
                event_id, planning_ids = await self._post_single_event(doc, event, assignments_to_delete)
            else:
                event_id, planning_ids = await self._post_recurring_events(
                    doc, event, update_method, assignments_to_delete
                )

            ids.append(event_id)
            if planning_ids:
                doc["failed_planning_ids"].extend(planning_ids)

        if assignments_to_delete:
            await delete_assignments_for_coverages(assignments_to_delete)
        return ids

    async def _post_single_event(self, doc, event, assignments_to_delete: list[dict]):
        validate_post_state(doc["pubstatus"])
        await validate_item_for_publish(event)
        # await self.validate_item(event)
        updated_event, failed_planning_ids = await self.post_event(
            event, doc["pubstatus"], doc.get("repost_on_update"), assignments_to_delete
        )

        event_type = "events:posted" if doc["pubstatus"] == POST_STATE.USABLE else "events:unposted"
        push_notification(
            event_type,
            item=event[ID_FIELD],
            etag=updated_event["_etag"],
            pubstatus=updated_event["pubstatus"],
            state=updated_event["state"],
        )

        return doc["event"], failed_planning_ids

    async def _post_recurring_events(self, doc, original, update_method, assignments_to_delete: list[dict]):
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
            validate_post_state(post_to_state)
            await validate_item_for_publish(event)
            # await self.validate_item(event)

        # Next we perform the actual post
        updated_event = None
        ids = []
        items = []
        failed_planning_ids = []
        for event in published_events:
            updated_event, failed_planning_ids = await self.post_event(
                event, post_to_state, doc.get("repost_on_update"), assignments_to_delete
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

    async def post_event(self, event, new_post_state, repost, assignments_to_delete: list[dict]):
        events_service = UnifiedPlanningResource.get_service()
        events_history_service = UnifiedPlanningHistoryResource.get_service()

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

        if new_post_state == POST_STATE.CANCELLED and len(event.get("coverages") or []):
            updates["coverages"] = event["coverages"]
            for coverage in updates["coverages"]:
                if (coverage.get("assigned_to") or {}).get("assignment_id"):
                    assignments_to_delete.append(deepcopy(coverage))
                    coverage["assigned_to"] = {}
                if coverage.get("workflow_status") != WORKFLOW_STATE.CANCELLED:
                    coverage["workflow_status"] = WORKFLOW_STATE.CANCELLED
                    (coverage.get("planning") or {}).pop("workflow_status_reason", None)

        event_id = event[ID_FIELD]
        updated_event = await events_service.update(event_id, updates, skip_signals=True)
        event.update(updated_event.to_dict())

        # enqueue the event
        # these fields are set for enqueue process to work. otherwise not needed
        version, event = get_version_item_for_post(event)
        # save the version into the history
        updates["version"] = version

        await events_history_service._save_history(event, updates, "post")
        plannings = await get_related_planning_for_events_async([event[ID_FIELD]], "primary")

        event["plans"] = [p.get("_id") for p in plannings]
        await enqueue_unified_planning(event, version)

        if len(plannings) > 0:
            failed_planning_ids = await self.post_related_plannings(plannings, new_post_state)

        return event, failed_planning_ids

    async def post_related_plannings(self, plannings, new_post_state):
        from planning.planning.planning_spike import process_spike_planning_item

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
