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

from superdesk.resource_fields import ID_FIELD
from superdesk.flask import request
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth

from planning.common import (
    UPDATE_FUTURE,
    WORKFLOW_STATE,
    remove_lock_information,
    set_actioned_date_to_event,
)
from planning.utils import get_related_planning_for_events
from .events import EventsResource, events_schema
from .events_base_service import EventsBaseService

event_cancel_schema = deepcopy(events_schema)
event_cancel_schema["reason"] = {
    "type": "string",
    "nullable": True,
}


class EventsCancelResource(EventsResource):
    url = "events/cancel"
    resource_title = endpoint_name = "events_cancel"

    datasource = {"source": "events"}

    resource_methods = []
    item_methods = ["PATCH"]
    privileges = {"PATCH": "planning_event_management"}

    schema = event_cancel_schema


class EventsCancelService(EventsBaseService):
    ACTION = "cancel"

    @staticmethod
    def _get_cancel_state():
        eocstat_map = get_resource_service("vocabularies").find_one(req=None, _id="eventoccurstatus")

        occur_cancel_state = [x for x in eocstat_map.get("items", []) if x["qcode"] == "eocstat:eos6"][0]
        occur_cancel_state.pop("is_active", None)
        return occur_cancel_state

    def update_single_event(self, updates, original):
        occur_cancel_state = self._get_cancel_state()
        self._set_event_cancelled(updates, original, occur_cancel_state)
        self._cancel_event_plannings(updates, original)

    def update(self, id, updates, original):
        reason = updates.pop("reason", None)
        cancelled_items = updates.pop("_cancelled_events", [])
        item = super().update(id, updates, original)

        if self.is_original_event(original):
            user = get_user(required=True).get(ID_FIELD, "")
            session = get_auth().get(ID_FIELD, "")

            push_notification(
                "events:cancel",
                item=str(original[ID_FIELD]),
                user=str(user),
                session=str(session),
                occur_status=updates.get("occur_status"),
                etag=item.get("_etag"),
                cancelled_items=cancelled_items,
                reason=reason or "",
                actioned_date=updates.get("actioned_date"),
            )

        return item

    @staticmethod
    def push_notification(name, updates, original):
        """
        Ignore this request, as we want to handle the notification separately in update
        """
        pass

    @staticmethod
    def _cancel_event_plannings(updates, original):
        planning_cancel_service = get_resource_service("planning_cancel")
        planning_history_service = get_resource_service("planning_history")
        reason = updates.get("reason", None)

        for plan in get_related_planning_for_events([original[ID_FIELD]], "primary"):
            if plan.get("state") != WORKFLOW_STATE.CANCELLED:
                request.view_args["event_cancellation"] = True
                cancelled_plan = planning_cancel_service.patch(plan[ID_FIELD], {"reason": reason})

                # Write history records
                planning_history_service.on_cancel(cancelled_plan, plan)

    @staticmethod
    def _set_event_cancelled(updates, original, occur_cancel_state):
        if not EventsCancelService.validate_states(original):
            raise SuperdeskApiError.badRequestError("Event not in valid state for cancellation")

        remove_lock_information(updates)
        updates.update(
            {
                "state": WORKFLOW_STATE.CANCELLED,
                "occur_status": occur_cancel_state,
                "state_reason": updates.get("reason"),
            }
        )
        set_actioned_date_to_event(updates, original)

    def update_recurring_events(self, updates, original, update_method):
        occur_cancel_state = self._get_cancel_state()
        historic, past, future = self.get_recurring_timeline(original, postponed=True)

        # Determine if the selected event is the first one, if so then
        # act as if we're changing future events
        if len(historic) == 0 and len(past) == 0:
            update_method = UPDATE_FUTURE

        if update_method == UPDATE_FUTURE:
            cancelled_events = future
        else:
            cancelled_events = past + future

        self._set_event_cancelled(updates, original, occur_cancel_state)

        notifications = []

        for event in cancelled_events:
            new_updates = deepcopy(updates)
            self._cancel_event_plannings(new_updates, event)
            self.patch_related_event_as_cancelled(new_updates, event, notifications)

        self._cancel_event_plannings(updates, original)
        updates["_cancelled_events"] = notifications

    def patch_related_event_as_cancelled(self, updates, original, notifications):
        if not self.validate_states(original):
            # Don't raise exception for related events in series - simply ignore
            return

        id = original[ID_FIELD]
        updates["skip_on_update"] = True
        updated_event = self.patch(id, updates)
        get_resource_service("events_history").on_cancel(updated_event, original)

        notifications.append({"_id": id, "_etag": updated_event.get("_etag")})

    @staticmethod
    def validate_states(event):
        if event.get("state") not in [
            WORKFLOW_STATE.DRAFT,
            WORKFLOW_STATE.SCHEDULED,
            WORKFLOW_STATE.INGESTED,
            WORKFLOW_STATE.KILLED,
            WORKFLOW_STATE.POSTPONED,
        ]:
            return False

        return True
