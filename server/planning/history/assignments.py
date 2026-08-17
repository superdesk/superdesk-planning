# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Files"""

from typing import Any
from copy import deepcopy
import logging

from superdesk.resource_fields import ID_FIELD

from planning.types import AssignmentsHistoryResourceModel, UnifiedPlanningResource
from planning.common import WORKFLOW_STATE
from planning.types.enums import AssignmentHistoryActions

from .base_service import HistoryAsyncService
from .planning import UnifiedPlanningHistoryService

logger = logging.getLogger(__name__)


class AssignmentsHistoryService(HistoryAsyncService[AssignmentsHistoryResourceModel]):
    resource_name = "assignments_history"

    async def _save_history(self, item, update: dict[str, Any], operation: str | None = None):
        user_id = self.get_user_id()
        # confirmation could be from external fulfillment, so set the user to the assignor
        if (
            operation
            in [
                AssignmentHistoryActions.CONFIRM.value,
                AssignmentHistoryActions.START_WORKING.value,
            ]
            and user_id is None
        ):
            assigned_to = update.get("assigned_to")
            if assigned_to is not None:
                user_id = update.get(
                    "proxy_user",
                    assigned_to.get("assignor_user", assigned_to.get("assignor_desk")),
                )
        # If external accept set the user to the assigned user
        if operation == AssignmentHistoryActions.ACCEPTED.value and user_id is None:
            assigned_to = item.get("assigned_to", {})
            user_id = assigned_to.get("user")
            update["assigned_to"] = {"user": user_id}

        history = {
            "item_id": item[ID_FIELD],
            "item_type": "assignment",
            "user_id": user_id,
            "operation": operation,
            "update": update,
        }

        await self.create([history])

    async def on_item_updated(self, updates: dict[str, Any], original: dict[str, Any], operation: str | None = None):
        item = deepcopy(original)
        if updates:
            item.update(updates)

        diff = await self._changes(original, updates)
        if operation:
            await self._save_history(item, diff, operation)
            return

        if diff:
            # Split an update to two actions if needed
            cov_diff: dict[str, Any] = {"coverage_id": original.get("coverage_item"), "assigned_to": {}}

            if "priority" in diff.keys():
                cov_diff["assigned_to"]["priority"] = diff.pop("priority")
                await self._save_history(
                    item,
                    {"priority": cov_diff["assigned_to"]["priority"]},
                    AssignmentHistoryActions.EDIT_PRIORITY.value,
                )
                await self._update_associated_planning_history(
                    original, cov_diff, AssignmentHistoryActions.EDIT_PRIORITY.value
                )

            if "assigned_to" in diff.keys():
                cov_diff["assigned_to"] = diff["assigned_to"]
                await self._save_history(item, diff, AssignmentHistoryActions.REASSIGNED.value)
                await self._update_associated_planning_history(
                    original, cov_diff, AssignmentHistoryActions.REASSIGNED.value,
                )

    async def on_item_deleted(self, doc: dict[str, Any]):
        planning = {"_id": doc.get("planning_item"), "type": doc.get("type")}
        coverage_diff = {
            "coverage_id": doc.get("coverage_item"),
            "workflow_status": WORKFLOW_STATE.DRAFT,
        }

        if doc.get("scheduled_update_id"):
            coverage_diff["scheduled_update_id"] = doc["scheduled_update_id"]

        await self._update_associated_planning_history(
            doc, coverage_diff, AssignmentHistoryActions.ASSIGNMENT_REMOVED.value
        )

    async def _update_assignment_coverage_history(
        self, updates: dict[str, Any], original: dict[str, Any], operation: str | None = None
    ):
        await self.on_item_updated(updates, original, operation)
        cov = {"coverage_id": original.get("coverage_item")}
        cov["assigned_to"] = updates.get("assigned_to")
        if "proxy_user" in updates:
            cov["proxy_user"] = updates.get("proxy_user")

        if operation == AssignmentHistoryActions.ADD_TO_WORKFLOW.value:
            cov["workflow_status"] = WORKFLOW_STATE.ACTIVE

        await self._update_associated_planning_history(original, cov, operation)

    async def on_item_add_to_workflow(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(
            updates, original, AssignmentHistoryActions.ADD_TO_WORKFLOW.value
        )

    async def on_item_start_working(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(updates, original, AssignmentHistoryActions.START_WORKING.value)

    async def on_item_complete(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(updates, original, AssignmentHistoryActions.COMPLETE.value)

    async def on_item_confirm_availability(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(updates, original, AssignmentHistoryActions.CONFIRM.value)

    async def on_item_revert_availability(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(updates, original, AssignmentHistoryActions.REVERT.value)

    async def on_item_content_link(self, updates: dict[str, Any], original: dict[str, Any]):
        await self._update_assignment_coverage_history(updates, original, AssignmentHistoryActions.CONTENT_LINK.value)

    async def on_item_content_unlink(self, updates: dict[str, Any], original: dict[str, Any], operation=None):
        await self._update_assignment_coverage_history(
            updates, original, operation or AssignmentHistoryActions.UNLINK.value
        )

    async def _update_associated_planning_history(self, assignmnet: dict, updates: dict, operation: str | None) -> None:
        planning_id: str | None = assignmnet.get("planning_item")
        if not planning_id:
            logger.error("Failed to update Assignments Planning history, no planning id on assignment", extra=dict(
                assignment_id=assignmnet[ID_FIELD]
            ))
            return

        planning = await UnifiedPlanningResource.get_service().find_by_id(planning_id)
        if not planning:
            logger.error("Failed to update Assignments Planning history, planning not found", extra=dict(
                assignment_id=assignmnet[ID_FIELD],
                planning_id=planning_id,
            ))
            return

        await UnifiedPlanningHistoryService()._save_history(
            {"_id": planning.id, "type": planning.item_type}, updates, operation
        )
