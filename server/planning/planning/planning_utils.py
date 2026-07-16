import logging

from bson import ObjectId
from typing import Any

from superdesk import get_resource_service
from apps.archive.common import get_user, get_auth
from superdesk.errors import SuperdeskApiError
from superdesk.flask import request
from superdesk.notification import push_notification
from superdesk.resource_fields import ID_FIELD

from planning.errors import AssignmentApiError
from planning.types.assignment import AssignmentResourceModel


logger = logging.getLogger(__name__)


def get_coverage_by_id(
    planning_item: dict[str, Any], coverage_id: str, field: str | None = "coverage_id"
) -> dict[str, Any] | None:
    return next(
        (coverage for coverage in planning_item.get("coverages") or [] if coverage.get(field) == coverage_id),
        None,
    )


async def delete_assignments_for_coverages(coverages: list[dict[str, Any]], notify: bool = True) -> None:
    failed_assignments = []
    deleted_assignments = []
    assignment_service = get_resource_service("assignments")

    for coverage in coverages:
        assign_id = coverage.get("assigned_to", {}).get("assignment_id", None)
        if not assign_id:
            continue
        assign_planning = coverage.get("planning", {})
        try:
            await assignment_service.delete_action_async(lookup={"_id": assign_id})
            deleted_assignments.append(
                {
                    "id": assign_id,
                    "slugline": assign_planning.get("slugline"),
                    "type": assign_planning.get("g2_content_type"),
                }
            )
        except AssignmentApiError as e:
            logger.error("There is a assignment '{}' is in progress".format(assign_id))
            failed_assignments.append(
                {
                    "state": "in Progress",
                    "slugline": assign_planning.get("slugline"),
                    "type": assign_planning.get("g2_content_type"),
                }
            )
        except SuperdeskApiError as e:
            failed_assignments.append(
                {
                    "error": str(e),
                    "slugline": assign_planning.get("slugline"),
                    "type": assign_planning.get("g2_content_type"),
                }
            )
            # Mark the assignment to be deleted.
            original_assigment = await assignment_service.find_one_async(req=None, _id=assign_id)
            if original_assigment:
                await assignment_service.system_update_async(
                    ObjectId(assign_id),
                    {"_to_delete": True},
                    original_assigment,
                    skip_planning_sync=True,
                    notification_source="planning",
                )

    if request:
        session_id = get_auth().get("_id")
        user_id = get_user().get(ID_FIELD)
        if len(deleted_assignments) > 0:
            push_notification(
                "assignments:delete",
                items=deleted_assignments,
                session=session_id,
                user=user_id,
            )

        if len(failed_assignments) > 0 and notify:
            push_notification(
                "assignments:delete:fail",
                items=failed_assignments,
                session=session_id,
                user=user_id,
            )
