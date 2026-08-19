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
from quart_babel import gettext as _

from superdesk import get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from apps.archive.common import get_user, get_auth

from planning.coverage_assignments import update_planning_from_assignment_changes
from .assignments import AssignmentsResource, assignments_schema
from planning.common import (
    ASSIGNMENT_WORKFLOW_STATE,
    remove_lock_information,
    assignment_allows_multiple_content_linked,
)
from planning.history.assignments import AssignmentsHistoryService


assignments_revert_schema = deepcopy(assignments_schema)
assignments_revert_schema["planning_item"]["required"] = False


class AssignmentsRevertResource(AssignmentsResource):
    url = "assignments/revert"
    resource_title = endpoint_name = "assignments_revert"

    datasource = {"source": "assignments"}
    resource_methods = []
    item_methods = ["PATCH"]
    privileges = {"PATCH": "archive"}

    schema = assignments_revert_schema


class AssignmentsRevertService(AsyncBaseService):
    async def on_update_async(self, updates, original):
        assignment_state = original.get("assigned_to").get("state")
        assignments_service = get_resource_service("assignments")
        await assignments_service.validate_assignment_action(original)

        if not assignment_allows_multiple_content_linked(original) and await assignments_service.is_text_assignment(
            original
        ):
            raise SuperdeskApiError.forbiddenError(_("Cannot revert text assignments."))

        if assignment_state != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
            raise SuperdeskApiError.forbiddenError(_("Cannot revert an assignment which is not yet confirmed."))

        updates["assigned_to"] = deepcopy(original).get("assigned_to")
        updates["assigned_to"]["revert_state"] = None

        if await get_resource_service("delivery").count_async({"assignment_id": original["_id"]}) > 0:
            # If there is content linked to this Assignment, then we should change the state to ``In Progress``
            updated_state = ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
        else:
            # Otherwise we use the previously known state, or ``Assigned`` if it was never confirmed
            updated_state = updates["assigned_to"].get("revert_state") or ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
        updates["assigned_to"]["state"] = updated_state

        remove_lock_information(updates)

    async def on_updated_async(self, updates, original):
        user = get_user(required=True).get(ID_FIELD, "")
        session = get_auth().get(ID_FIELD, "")

        # Save history
        await AssignmentsHistoryService().on_item_revert_availability(updates, original)

        assignment = deepcopy(original)
        assignment.update(updates)
        await update_planning_from_assignment_changes(assignment)

        push_notification(
            "assignments:reverted",
            item=str(original[ID_FIELD]),
            planning=original.get("planning_item"),
            assigned_user=(original.get("assigned_to") or {}).get("user"),
            assigned_desk=(original.get("assigned_to") or {}).get("desk"),
            assignment_state=updates.get("assigned_to", {})["state"],
            user=str(user),
            session=str(session),
            coverage=original.get("coverage_item"),
        )

        # publish the planning item
        await get_resource_service("assignments").publish_planning(original.get("planning_item"))

        # External (slack/browser pop-up) notifications
        assignments_service = get_resource_service("assignments")
        await assignments_service.send_assignment_notification(updates, original, True)
