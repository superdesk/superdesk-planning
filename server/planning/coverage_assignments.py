from typing import Literal
from copy import deepcopy
import logging

from superdesk import get_resource_service
from superdesk.resource_fields import ID_FIELD
from superdesk.utc import utcnow

from apps.auth import get_user

from planning.common import (
    WORKFLOW_STATE,
    ASSIGNMENT_WORKFLOW_STATE,
    DEFAULT_ASSIGNMENT_PRIORITY,
    TO_BE_CONFIRMED_FIELD,
    get_config_assignment_manual_reassignment_only,
)
from planning.types import AutosaveResourceModel

__all__ = [
    "update_planning_from_assignment_changes",
    "get_metadata_updates_between_entities",
    "copy_assigned_to_fields",
]

logger = logging.getLogger(__name__)
ASSIGNED_TO_SYNC_FIELDS = ("desk", "user", "contact", "state", "coverage_provider")
ASSIGNEE_FIELDS = ("desk", "user")


async def update_planning_from_assignment_changes(
    assignment: dict,
    is_autosave: bool = False,
) -> None:
    """
    Updates a planning item's coverage details from assignment changes.

    This function processes the given assignment to locate the relevant planning item
    and updates its coverages based on the new assignment data. It supports handling
    both autosave and regular updates for planning items. If specific scheduled update
    details are present in the assignment, it ensures those are also updated accordingly.

    :param assignment: The Assignment used to update the associated Planning item for
    :param is_autosave: Indicates whether the update pertains to an autosave resource. Defaults to False.
    """

    planning_id = assignment.get("planning_item")
    coverage_id = assignment.get("coverage_item")
    if not planning_id or not coverage_id:
        return

    planning_item: dict | None
    if is_autosave:
        planning_item = await AutosaveResourceModel.get_service().find_by_id_raw(planning_id)
    else:
        planning_item = await get_resource_service("planning").find_one_async(req=None, _id=planning_id)

    if not planning_item:
        if not is_autosave:
            logger.warning(
                "Failed to find planning item for assignment",
                extra={"assignment_id": assignment.get("_id"), "planning_id": planning_id, "coverage_id": coverage_id},
            )
        return

    coverages: list[dict] = planning_item.get("coverages") or []
    coverage: dict | None = next(
        (coverage for coverage in coverages if coverage.get("coverage_id") == coverage_id), None
    )
    if not coverage:
        logger.warning(
            "Failed to find coverage for assignment",
            extra={"assignment_id": assignment.get("_id"), "planning_id": planning_id, "coverage_id": coverage_id},
        )
        return

    is_scheduled_update = bool(assignment.get("scheduled_update_id"))
    if is_scheduled_update:
        scheduled_updates: list[dict] = coverage.get("scheduled_updates", [])
        scheduled_update_coverage: dict | None = next(
            (
                scheduled_update
                for scheduled_update in scheduled_updates
                if scheduled_update.get("scheduled_update_id") == assignment.get("scheduled_update_id")
            ),
            None,
        )
        if not scheduled_update_coverage:
            logger.warning(
                "Failed to find scheduled update for assignment",
                extra={
                    "assignment_id": assignment.get("_id"),
                    "planning_id": planning_id,
                    "coverage_id": coverage_id,
                    "scheduled_update_id": assignment.get("scheduled_update_id"),
                },
            )
            return
        coverage = scheduled_update_coverage

    coverage_updates = get_metadata_updates_between_entities(
        assignment, planning_item, coverage, destination="coverage"
    )
    if not coverage_updates:
        # No updates needed to apply to the Planning item
        logger.warning(
            "Planning coverages update was not applied",
            extra={"planning_id": planning_id, "coverage_id": coverage_id, "assignment_id": assignment.get("_id")},
        )
        return

    coverage["assigned_to"].update(coverage_updates.pop("assigned_to", {}))
    coverage["planning"].update(coverage_updates.pop("planning", {}))
    coverage.update(coverage_updates)

    if is_autosave:
        await AutosaveResourceModel.get_service().system_update(
            planning_item[ID_FIELD], updates={"coverages": coverages}
        )
    else:
        planning_service = get_resource_service("planning")
        await planning_service.backend.system_update_async(
            planning_service.datasource,
            planning_item[ID_FIELD],
            {"coverages": coverages},
            planning_item,
        )


def get_metadata_updates_between_entities(
    assignment: dict,
    planning: dict,
    coverage: dict,
    destination: Literal["coverage", "assignment"],
) -> dict:
    """
    Determine metadata updates required between entities.

    This function identifies and prepares changes in the metadata between an assignment,
    planning item, and coverage, based on the specified destination. It ensures proper
    metadata synchronization and determines if updates are necessary, returning the
    adjusted metadata if changes are detected.

    :param assignment: The assignment object containing metadata for a related assignment.
    :param planning: The planning object providing additional metadata details.
    :param coverage: The coverage object containing information about the coverage item.
    :param destination: The target entity for the metadata updates; either 'coverage' or 'assignment'.
    :return dict: A dictionary containing metadata updates if any changes are required; otherwise an empty dictionary.
    """

    updates: dict = {}

    updates.setdefault("assigned_to", {})
    updates.setdefault("planning", {})
    destination_updated = False

    if copy_assigned_to_fields(updates, assignment, coverage, destination):
        destination_updated = True

    if destination == "assignment":
        result = _copy_destination_assignment(updates, assignment, coverage, planning)
        if result is None:
            return {}
        elif result:
            destination_updated = True

    if not updates.get("assigned_to"):
        updates.pop("assigned_to", None)
    if not updates.get("planning"):
        updates.pop("planning", None)

    return updates if destination_updated else {}


def _copy_destination_assignment(updates: dict, assignment: dict, coverage: dict, planning: dict) -> bool | None:
    destination_updated: bool = False

    if not coverage.get("assigned_to"):
        return None
    elif not coverage["assigned_to"].get("assignment_id"):
        # We're attempting to create a new Assignment

        if not coverage["assigned_to"].get("user") and not coverage["assigned_to"].get("desk"):
            # No assignee details, do not create an Assignment yet
            return None

        _copy_metadata_to_new_assignment(updates, planning, coverage)
        destination_updated = True
    else:
        # We're attempting to update an existing Assignment'
        if assignment["assigned_to"]["state"] in [
            ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
            ASSIGNMENT_WORKFLOW_STATE.CANCELLED,
        ]:
            # This Assignment is either marked as completed or is cancelled, do not update it
            return None

        if _copy_metadata_to_existing_assignment(updates, assignment, planning, coverage):
            destination_updated = True

    if _copy_translated_values_to_assignment(updates, planning):
        destination_updated = True

    if _set_assignment_state(updates, coverage, assignment):
        destination_updated = True

    return destination_updated


def copy_assigned_to_fields(
    updates: dict,
    assignment: dict,
    coverage: dict,
    destination: Literal["coverage", "assignment"],
    generate_assignor_fields: bool = True,
) -> bool:
    """
    Synchronizes the "assigned_to" fields between the source and destination, based on
    the provided destination type, and updates metadata for assignee changes.

    :param updates: A dictionary to store the updates made to the destination data.
    :param assignment: The source assignment data.
    :param coverage: The destination coverage data.
    :param destination: The type of data to synchronize ("coverage" or "assignment").
    :param generate_assignor_fields: Whether to generate assignor fields for the destination, or copy from source.
    :return: A boolean indicating whether any changes were made to the destination data.
    """

    source = assignment if destination == "coverage" else coverage
    original = coverage if destination == "coverage" else assignment

    now = utcnow()
    user = get_user()
    user_id = user.get(ID_FIELD) if user else None
    destination_updated = False
    source.setdefault("assigned_to", {})
    original.setdefault("assigned_to", {})
    updates.setdefault("assigned_to", {}).update(deepcopy(original["assigned_to"]))

    for field in ASSIGNED_TO_SYNC_FIELDS:
        if field in source["assigned_to"]:
            new_value = source["assigned_to"][field]
        elif field in original["assigned_to"]:
            new_value = original["assigned_to"][field]
        else:
            new_value = None

        updates["assigned_to"][field] = new_value
        if updates["assigned_to"][field] == original["assigned_to"].get(field):
            continue

        destination_updated = True
        if field in ASSIGNEE_FIELDS:
            assigned_date_field = f"assigned_date_{field}"
            assignor_field = f"assignor_{field}"

            # Set who and when the User and/or Desk assignees were updated
            if generate_assignor_fields:
                # Generate new assignor field values based on current request and date/time
                updates["assigned_to"][assigned_date_field] = now
                if user_id:
                    updates["assigned_to"][assignor_field] = user_id
            else:
                # Just copy across the field values from the source
                updates["assigned_to"][assigned_date_field] = source["assigned_to"].get(assigned_date_field)
                updates["assigned_to"][assignor_field] = source["assigned_to"].get(assignor_field)

    if destination == "coverage":
        if "assignment_id" not in updates["assigned_to"]:
            # Make sure the Coverage has the Assignment ID
            updates["assigned_to"]["assignment_id"] = str(assignment.get("_id"))
            destination_updated = True

        assignment_priority = assignment.get("priority")
        updates["assigned_to"]["priority"] = assignment_priority or DEFAULT_ASSIGNMENT_PRIORITY
        if coverage["assigned_to"].get("priority") != assignment_priority:
            destination_updated = True
    else:
        coverage_priority = coverage["assigned_to"].get("priority")
        updates["priority"] = coverage_priority or DEFAULT_ASSIGNMENT_PRIORITY
        if updates["priority"] != coverage_priority:
            destination_updated = True

    return destination_updated


def _get_coverage_by_id(planning: dict, coverage_id: str) -> dict | None:
    """
    Retrieve a specific coverage by its ID from the given planning dictionary.

    This function searches through the list of coverages within the provided planning
    dictionary and retrieves the first coverage that matches the specified coverage ID.

    :param planning: A dictionary containing planning information with a list of coverages.
    :param coverage_id: The unique identifier for the coverage to be retrieved.
    :return: The first coverage dictionary that matches the given coverage ID, or None if no such coverage is found.
    """

    coverages = planning.get("coverages") or []
    return next((c for c in coverages if c.get("coverage_id") == coverage_id), None)


def _get_coverage_planning_metadata(planning: dict, coverage: dict) -> dict:
    """
    Retrieve or construct metadata for coverage planning based on the provided planning and
    coverage details. If the coverage references a scheduled update, attempts to extract
    metadata from its parent coverage and incorporates it into the resulting metadata.

    :param planning: A dictionary containing planning information.
    :param coverage: A dictionary containing coverage details.
    :return: A dictionary containing metadata for coverage planning.
    """

    planning_metadata: dict = {}
    if coverage.get("scheduled_update_id"):
        if parent_coverage := _get_coverage_by_id(planning, coverage["coverage_id"]):
            planning_metadata.update(deepcopy(parent_coverage.get("planning", {})))
        else:
            logger.warning(
                "Failed to find parent coverage for scheduled update",
                extra={
                    "planning_id": planning[ID_FIELD],
                    "coverage_id": coverage.get("coverage_id"),
                    "scheduled_update_id": coverage["scheduled_update_id"],
                },
            )

    planning_metadata.update(deepcopy(coverage.get("planning") or {}))
    return planning_metadata


def _set_assignment_state(updates: dict, coverage: dict, assignment: dict) -> bool:
    """
    Determine and update assignment state from coverage workflow and assignee changes.

    :param updates: A dictionary to store the updated assignment state.
    :param coverage: A dictionary containing coverage details.
    :param assignment: A dictionary containing the current assignment details.
    :return: A boolean indicating whether the assignment state was updated.
    """

    assign_state = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
    coverage_assigned_to = coverage.get("assigned_to") or {}
    assignment_assigned_to = (assignment or {}).get("assigned_to") or {}

    if coverage.get("workflow_status") == WORKFLOW_STATE.DRAFT:
        assign_state = ASSIGNMENT_WORKFLOW_STATE.DRAFT
    else:
        assignee_changed = any(
            coverage_assigned_to.get(field) != assignment_assigned_to.get(field)
            for field in ("desk", "user", "contact", "coverage_provider")
        )

        if assignee_changed and get_config_assignment_manual_reassignment_only():
            # Reassignment should move the item back to To Do.
            assign_state = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
        elif coverage_assigned_to.get("state") and coverage_assigned_to["state"] != ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            assign_state = coverage_assigned_to["state"]

    if updates["assigned_to"]["state"] != assign_state:
        updates["assigned_to"]["state"] = assign_state
        return True
    return False


def _copy_metadata_to_new_assignment(updates: dict, planning: dict, coverage: dict) -> None:
    """
    Updates the metadata of a new assignment by copying relevant details from planning
    and coverage dictionaries into the updates dictionary.

    This function primarily modifies the updates dictionary in-place, ensuring that
    any metadata related to planning and coverage configurations is properly transferred. The
    updates are made based on the current coverage's attributes, including scheduled updates,
    workflow status, and assigned states. This ensures the resulting metadata in updates is
    consistent and complete for assignment creation.

    :param updates: The dictionary to update with metadata. This is modified in-place.
    :param planning: The dictionary containing overall planning information.
    :param coverage: The dictionary containing information about the specific coverage.
    """

    updates.update(
        {
            "planning_item": planning[ID_FIELD],
            "coverage_item": coverage.get("coverage_id"),
            "description_text": planning.get("description_text"),
            "planning": _get_coverage_planning_metadata(planning, coverage),
        }
    )

    if coverage.get("scheduled_update_id"):
        updates["scheduled_update_id"] = coverage["scheduled_update_id"]

    if TO_BE_CONFIRMED_FIELD in coverage:
        updates["planning"][TO_BE_CONFIRMED_FIELD] = coverage[TO_BE_CONFIRMED_FIELD]


def _copy_metadata_to_existing_assignment(updates: dict, assignment: dict, planning: dict, coverage: dict) -> bool:
    """
    Updates metadata fields in an existing assignment object based on the given coverage data.

    This function checks whether the planning or workflow state fields in the supplied
    coverage dictionary differ from those in the corresponding assignment dictionary.
    If differences are identified, specific fields in the `updates` dictionary are modified
    to reflect the changes. The function also considers enabling assignments based on the
    workflow state.

    :param updates: The dictionary to update with metadata changes.
    :param assignment: The existing assignment object.
    :param planning: The dictionary containing overall planning information.
    :param coverage: The dictionary containing information about the specific coverage.
    :return: A boolean indicating whether the assignment was updated.
    """

    assignment_updated = False

    update_planning_field = False
    updated_planning_metadata = _get_coverage_planning_metadata(planning, coverage)
    for field, updated_value in updated_planning_metadata.items():
        if not field.startswith("_") and updated_value != (assignment.get("planning") or {}).get(field):
            update_planning_field = True
            break

    if update_planning_field:
        updates["planning"] = updated_planning_metadata
        assignment_updated = True

    if (
        TO_BE_CONFIRMED_FIELD in coverage
        and (assignment.get("planning") or {}).get(TO_BE_CONFIRMED_FIELD) != coverage[TO_BE_CONFIRMED_FIELD]
    ):
        updates["planning"][TO_BE_CONFIRMED_FIELD] = coverage[TO_BE_CONFIRMED_FIELD]
        assignment_updated = True

    # If the Planning description has been changed
    if planning.get("description_text") != assignment.get("description_text"):
        updates["description_text"] = planning.get("description_text")
        assignment_updated = True

    # If the Planning name has been changed
    if planning.get("name") != assignment.get("name"):
        updates["name"] = planning.get("name")
        assignment_updated = True

    if (
        coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE
        and assignment["assigned_to"]["state"] == ASSIGNMENT_WORKFLOW_STATE.DRAFT
    ):
        # The Coverage as been added to workflow, enable the Assignment now
        updates["assigned_to"]["state"] = coverage["assigned_to"]["state"]
        assignment_updated = True

    return assignment_updated


def _copy_translated_values_to_assignment(updates: dict, planning: dict) -> bool:
    """
    Copies translated values from the planning object to the updates dictionary based
    on the specified language in the updates planning section. Returns a boolean
    indicating if the assignment was updated.

    :param updates: The dictionary to update with translated values.
    :param planning: The dictionary containing overall planning information.
    :return: A boolean indicating whether the assignment was updated.
    """

    if not planning.get("translations") or not updates["planning"].get("language"):
        return False

    translations: list[dict] = planning["translations"]
    translated_values: dict = {
        entry["field"]: entry["value"]
        for entry in translations or []
        if entry["language"] == updates["planning"]["language"]
    }

    if not translated_values:
        return False

    assignment_updated = False
    translated_name: str | None = translated_values.get("name", translated_values.get("headline"))
    planning_updates = {
        key: val
        for key, val in translated_values.items()
        if key in ("ednote", "description_text", "headline", "slugline", "authors", "internal_note")
        and updates["planning"].get(key) is None
    }
    if planning_updates:
        updates["planning"].update(planning_updates)
        assignment_updated = True

    # Add translated names
    if translated_name and "headline" not in updates["planning"]:
        updates["planning"]["headline"] = translated_name
        assignment_updated = True

    if translated_name and updates.get("name") != translated_values.get("name"):
        updates["name"] = translated_name
        assignment_updated = True

    return assignment_updated
