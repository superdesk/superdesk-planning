# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Any
from copy import deepcopy
from superdesk.resource_fields import ID_FIELD
from superdesk.notification import push_notification
from apps.archive.common import get_user, get_auth
from planning.assignments import AssignmentsAsyncService
from planning.common import WORKFLOW_STATE, ITEM_STATE, get_coverage_type_name
from planning.planning import PlanningAsyncService
from planning.planning_notifications import PlanningNotifications


async def postpone_coverage(updates: dict[str, Any], coverage: dict[str, Any]):
    assignment_service = AssignmentsAsyncService()

    if coverage.get("workflow_status") != WORKFLOW_STATE.CANCELLED:
        coverage["planning"]["workflow_status_reason"] = updates.get("reason")

    assigned_to = coverage.get("assigned_to")
    if assigned_to:
        assignment = await assignment_service.find_by_id_raw(assigned_to.get("assignment_id"))
        if assignment:
            slugline = assignment.get("planning", {}).get("slugline", "")
            coverage_type = assignment.get("planning", {}).get("g2_content_type", "")
            PlanningNotifications().notify_assignment(
                coverage_status=assignment.get("assigned_to", {}).get("state"),
                target_user=assignment.get("assigned_to", {}).get("user"),
                target_desk=(
                    assignment.get("assigned_to", {}).get("desk")
                    if not assignment.get("assigned_to", {}).get("user")
                    else None
                ),
                message="assignment_postponed_msg",
                slugline=slugline,
                coverage_type=get_coverage_type_name(coverage_type),
            )


async def process_postpone_planning_item(updates: dict[str, Any], original: dict[str, Any]) -> dict[str, Any]:
    planning_service = PlanningAsyncService()

    # Postpone the planning_item using reason in updates
    updates["state_reason"] = updates.get("reason")
    updates[ITEM_STATE] = WORKFLOW_STATE.POSTPONED

    updates["coverages"] = deepcopy(original.get("coverages"))
    coverages = updates.get("coverages") or []

    for coverage in coverages:
        await postpone_coverage(updates, coverage)

    reason = updates.get("reason", None)
    if "reason" in updates:
        del updates["reason"]

    planning_item_id = original[ID_FIELD]
    await planning_service.system_update(planning_item_id, updates)
    postponed_planning_item = await planning_service.find_by_id_raw(planning_item_id)
    assert postponed_planning_item is not None, "Expected postponed_planning_item to be a dict, got None"

    user = get_user(required=True).get(ID_FIELD, "")
    session = get_auth().get(ID_FIELD, "")

    push_notification(
        "planning:postponed",
        item=str(planning_item_id),
        user=str(user),
        session=str(session),
        reason=reason,
    )

    return postponed_planning_item
