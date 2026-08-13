import logging
from copy import deepcopy

from quart_babel import gettext

from superdesk.core import get_current_app, get_config
from superdesk.errors import SuperdeskApiError
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk import get_resource_service
from superdesk.etree import etree
from superdesk.storage.superdesk_file import SuperdeskAsyncFile
from superdesk.utc import utcnow
from apps.auth import get_user_id

from planning.types import WorkflowState, CoverageProfile, AssignmentWorkflowState
from planning.types.unified import (
    UnifiedPlanningResource,
    CoverageItem,
    CoverageScheduledUpdate,
    NewsCoverageStatus,
    CoverageAssignedTo,
)
from planning.common import (
    TEMP_ID_PREFIX,
    get_coverage_type_name_async,
    get_planning_use_xmp_for_pic_slugline,
    get_planning_xmp_slugline_mapping,
    get_planning_use_xmp_for_pic_assignments,
    get_planning_xmp_assignment_mapping,
    get_planning_allow_scheduled_updates,
    get_coverage_type_name,
    get_coverage_status_from_cv,
)
from planning.content_profiles.utils import (
    get_coverage_schema,
    get_enabled_fields,
    get_custom_vocabulary_fields_from_profile,
)
from planning.coverage_assignments import get_metadata_updates_between_entities
from planning.planning_notifications import PlanningNotifications
from planning.assignments.assignments_history_async import AssignmentsHistoryAsyncService

# from planning.planning.planning_autosave_service import PlanningAutosaveAsyncService
from planning import signals

from .common import ItemUpdateRequest, get_related_event_links

logger = logging.getLogger(__name__)


def validate_scheduled_updates(item: UnifiedPlanningResource) -> None:
    if not item.coverages:
        return

    for coverage in item.coverages:
        if not coverage.scheduled_updates:
            continue

        coverage_schedule = coverage.planning.scheduled
        scheduled_updates = list(coverage.scheduled_updates)
        scheduled_updates.reverse()

        print(f"coverage_schedule: {coverage_schedule}, tzinfo: {coverage_schedule.tzinfo}")

        for i, scheduled_update in enumerate(scheduled_updates):
            scheduled_update_schedule = scheduled_update.planning.scheduled
            print(f"scheduled_update_schedule: {scheduled_update_schedule}, tzinfo: {scheduled_update_schedule.tzinfo}")
            if not scheduled_update_schedule:
                continue
            elif coverage_schedule and scheduled_update_schedule < coverage_schedule:
                raise SuperdeskApiError.badRequestError(
                    gettext("Scheduled updates must be after the original coverage.")
                )

            try:
                next_schedule = scheduled_updates[i + 1]
            except IndexError:
                next_schedule = None

            if next_schedule and next_schedule.planning.scheduled > scheduled_update.planning.scheduled:
                raise SuperdeskApiError.badRequestError(
                    gettext("Scheduled updates of a coverage must be after the previous update")
                )


async def on_coverage_update(req: ItemUpdateRequest) -> None:
    if req.original is None:
        # This is a branch new Planning item, so we just add all the new coverges into
        # the system
        if req.updated.coverages:
            for coverage in req.updated.coverages:
                await add_coverage(req.updated, coverage)
        return

    original_coverages_map: dict[str, CoverageItem] = {
        coverage.coverage_id: coverage for coverage in req.original.coverages or []
    }
    coverage_updates_map: dict[str, CoverageItem] = {
        coverage.coverage_id or f"{TEMP_ID_PREFIX}-{generate_guid(type=GUID_NEWSML)}": coverage
        for coverage in req.updated.coverages or []
    }
    for coverage_id in original_coverages_map.keys() | coverage_updates_map.keys():
        original_coverage = original_coverages_map.get(coverage_id)
        updated_coverage = coverage_updates_map.get(coverage_id)

        if original_coverage and not updated_coverage:
            # This Coverage is to be removed
            await _remove_coverage(req, original_coverage)
        elif original_coverage and updated_coverage:
            # Update the Coverage
            await _update_coverage(req, original_coverage, updated_coverage)
        elif not coverage_id.startswith(TEMP_ID_PREFIX):
            logger.warning(
                "Coverage with a `TEMP_ID_PREFIX` available in original and updates",
                extra=dict(coverage_id=coverage_id),
            )
        elif not original_coverage and updated_coverage:
            await add_coverage(req.original, updated_coverage)


async def on_coverage_updated(original: UnifiedPlanningResource, updates: dict) -> None:
    if "coverages" not in updates:
        return

    assignment_service = get_resource_service("assignments")
    updated = original.clone_with(updates)
    updated_coverages = {coverage.coverage_id: coverage for coverage in updated.coverages or []}

    for original_coverage in original.coverages or []:
        updated_coverage = updated_coverages.get(original_coverage.coverage_id)
        if not updated_coverage:
            # This coverage has been removed, and handled in `_remove_coverage` already
            continue
        assignment_id = original_coverage.assigned_to.assignment_id if original_coverage.assigned_to else None
        if not assignment_id or updated_coverage.assigned_to and updated_coverage.assigned_to.assignment_id:
            # Either no Assignment is currently linked, or the updated Coverage is still linked
            continue

        if original_coverage.workflow_status not in [WorkflowState.CANCELLED, WorkflowState.DRAFT]:
            # This Assignment is in workflow, so we need the Assignment service's side-effects
            cursor = await assignment_service.find_async(where={"coverage_item": original_coverage.coverage_id})
            async for assignment in cursor:
                await assignment_service.delete_async(lookup={"_id": assignment_id})
                await assignment_service.on_deleted_async(assignment, update_planning=False)
                await _send_remove_assignment_notifications(updated, original_coverage, assignment)
        else:
            # Otherwise just directly delete the Assignment
            await assignment_service.delete_async(lookup={"coverage_item": original_coverage.coverage_id})

        assignment = dict(planning_item=original.id, coverage_item=updated_coverage.coverage_id)

        # TODO-UNIFIED: Why `scheduled_update` and not `scheduled_updates`
        # scheduled_update = updated_coverage.scheduled_updates or original_coverage.scheduled_updates
        # if scheduled_update:
        #     assignment["scheduled_update_id"] = scheduled_update

        await AssignmentsHistoryAsyncService().on_item_deleted(assignment)


async def _remove_coverage(req: ItemUpdateRequest, coverage: CoverageItem) -> None:
    if coverage.scheduled_updates:
        for scheduled_update in coverage.scheduled_updates:
            await _remove_coverage_entity(req, scheduled_update)

    await _remove_coverage_entity(req, coverage)


async def add_coverage(item: UnifiedPlanningResource, coverage: CoverageItem) -> None:
    if "duplicate" in coverage.coverage_id or coverage.original_coverage_id != coverage.coverage_id:
        # TODO-UNIFIED:
        # await self.duplicate_xml_file(new_coverage)
        pass

    # Coverage to be corrected
    if coverage.coverage_id.startswith(TEMP_ID_PREFIX):
        coverage.coverage_id = generate_guid(type=GUID_NEWSML)
    if coverage.original_coverage_id is None:
        coverage.original_coverage_id = coverage.coverage_id

    # Make sure the coverage has a ``scheduled`` date
    # If none was supplied, fallback to ``dates.start`` of the parent Planning item
    if not coverage.planning.scheduled:
        coverage.planning.scheduled = item.dates.start

    current_user_id = get_user_id()
    if current_user_id:
        coverage.original_creator = current_user_id
        coverage.version_creator = current_user_id

    await _inherit_planning_metadata(item, coverage)
    _set_coverage_active(item, coverage)
    await _set_slugline_from_xmp(coverage, coverage)
    await _create_assignment_from_coverage(item, coverage)
    await _add_scheduled_updates(item, coverage)


async def _update_coverage(
    req: ItemUpdateRequest,
    original_coverage: CoverageItem,
    updated_coverage: CoverageItem,
) -> None:
    if (
        original_coverage.flags.no_content_linking != updated_coverage.flags.no_content_linking
        and updated_coverage.workflow_status != WorkflowState.DRAFT
    ):
        raise SuperdeskApiError.badRequestError(
            gettext("Cannot edit content linking flag of a coverage already in workflow")
        )

    # Make sure the coverage update has a ``scheduled`` date
    # If none was supplied, fallback to ``original.planning.scheduled``
    if not updated_coverage.planning.scheduled:
        updated_coverage.planning.scheduled = original_coverage.planning.scheduled

    await _inherit_planning_metadata(req.original, updated_coverage)
    _set_coverage_active(req.original, updated_coverage)
    await _set_slugline_from_xmp(original_coverage, updated_coverage)

    if _coverage_changed(original_coverage, updated_coverage):
        user_id = get_user_id()
        if user_id:
            updated_coverage.version_creator = user_id

        updated_coverage.versioncreated = utcnow()
        await PlanningNotifications().on_coverage_updated(req.original, original_coverage, updated_coverage)

    await _add_scheduled_updates(req.original, updated_coverage)
    await _update_scheduled_updates(req, original_coverage, updated_coverage)
    await _remove_scheduled_updates(req, original_coverage, updated_coverage)
    await _create_or_update_assignment(req, original_coverage, updated_coverage)


def _coverage_changed(original: CoverageItem, updated: CoverageItem) -> bool:
    for field in {"news_coverage_status", "planning", "workflow_status"}:
        if getattr(updated, field, None) != getattr(original, field, None):
            return True

    return False


async def _inherit_planning_metadata(item: UnifiedPlanningResource, coverage: CoverageItem) -> None:
    """
    Inherit planning metadata fields to coverage if not explicitly set in coverage profile.
    The fields inherited are those overlapping metadata fields from the planning schema and coverage schema
    """

    schema: CoverageProfile | None = None if not coverage.profile else await get_coverage_schema(coverage.profile)
    if coverage.profile and not schema:
        logger.warning(
            "Issue copying Planning metadata to Coverage, CoverageProfile not found",
            extra=dict(
                coverage_id=coverage.coverage_id,
                profile=coverage.profile,
            ),
        )

    supported_fields = {"anpa_category", "subject", "genre", "priority", "location", "headline", "slugline"}

    if schema:
        custom_vocabulary_fields = get_custom_vocabulary_fields_from_profile(schema)
        enabled_fields = {
            field
            for field in get_enabled_fields(schema)
            if field in supported_fields and field not in custom_vocabulary_fields
        }
    else:
        enabled_fields = supported_fields
        custom_vocabulary_fields = set()

    for field in enabled_fields:
        value = getattr(item, field, None)
        if field != "subject" and value:
            if not getattr(coverage.planning, field, None):
                setattr(coverage.planning, field, value)

    if item.subject and not coverage.planning.subject:
        # Copy ``Subject`` and ``Custom Vocabulary`` fields that are enabled in both Planning and Coverage profiles
        coverage.planning.subject = [
            subject
            for subject in item.subject
            if ((not subject.scheme and "subject" in enabled_fields) or (subject.scheme in custom_vocabulary_fields))
        ]


async def _set_slugline_from_xmp(
    original_coverage: CoverageItem | CoverageScheduledUpdate, coverage_updates: CoverageItem | CoverageScheduledUpdate
) -> None:
    xmp_file = await _get_xmp_file_for_updates(original_coverage, coverage_updates)
    if not xmp_file:
        return

    parsed = etree.parse(await xmp_file.to_buffer_sync())
    xmp_slugline_mapping = get_planning_xmp_slugline_mapping()
    tags = parsed.xpath(xmp_slugline_mapping.get("xpath"), namespaces=xmp_slugline_mapping.get("namespaces"))
    if tags:
        coverage_updates.planning.slugline = tags[0].text


async def _get_xmp_file_for_updates(
    original: CoverageItem | CoverageScheduledUpdate,
    updates: CoverageItem | CoverageScheduledUpdate,
    for_slugline: bool = False,
) -> SuperdeskAsyncFile | None:
    if not updates.planning.xmp_file:
        return None

    coverage_type_name = await get_coverage_type_name_async(updates.planning.g2_content_type)
    if not coverage_type_name or coverage_type_name.lower() != "picture":
        return None
    elif not _is_xmp_updated(original, updates):
        return None

    if for_slugline:
        if not get_planning_use_xmp_for_pic_slugline() or not get_planning_xmp_slugline_mapping():
            return None
    else:
        if not updates.assigned_to or not updates.assigned_to.assignment_id:
            return None
        elif not get_planning_use_xmp_for_pic_assignments() or not get_planning_xmp_assignment_mapping():
            return None

    xmp_file = await get_resource_service("planning_files").find_one_async(req=None, _id=updates.planning.xmp_file)
    if not xmp_file:
        logger.error(
            "Attached xmp_file not found",
            extra=dict(
                coverage_id=updates.coverage_id,
                xmp_file=updates.planning.xmp_file,
            ),
        )
        return None

    app = get_current_app()
    xmp_file = await app.media.get_async(xmp_file["media"], resource="planning_files")
    if not xmp_file:
        logger.error(
            "xml_file not found in media storage",
            extra=dict(
                coverage_id=updates.coverage_id,
                xmp_file=updates.planning.xmp_file,
            ),
        )
        return None

    return xmp_file


def _is_xmp_updated(
    original: CoverageItem | CoverageScheduledUpdate, updates: CoverageItem | CoverageScheduledUpdate
) -> bool:
    return bool(updates.planning.xmp_file) and original.planning.xmp_file != updates.planning.xmp_file


async def _remove_coverage_entity(req: ItemUpdateRequest, coverage: CoverageItem | CoverageScheduledUpdate) -> None:
    assigned_to = coverage.assigned_to
    if req.original.state == WorkflowState.CANCELLED:
        raise SuperdeskApiError.badRequestError(gettext("Cannot remove coverage of a cancelled planning item"))
    elif assigned_to and assigned_to.state not in [WorkflowState.DRAFT, WorkflowState.CANCELLED, None]:
        raise SuperdeskApiError.badRequestError(gettext("Assignment already exists. Coverage cannot be deleted."))

    coverage_updated = coverage.clone()
    coverage_updated.assigned_to = None
    await _create_or_update_assignment(req, coverage, coverage_updated)


async def _create_or_update_assignment(
    req: ItemUpdateRequest,
    original_coverage: CoverageItem | CoverageScheduledUpdate,
    updated_coverage: CoverageItem | CoverageScheduledUpdate,
) -> None:
    if not updated_coverage.assigned_to:
        return
    elif original_coverage.assigned_to and original_coverage.assigned_to.assignment_id:
        # Update existing Assignment
        await _update_assignment_from_coverage(req, original_coverage, updated_coverage)
    elif updated_coverage.assigned_to:
        # Create new Assignment
        await _create_assignment_from_coverage(req.updated, updated_coverage)


async def _create_assignment_from_coverage(
    item: UnifiedPlanningResource, coverage: CoverageItem | CoverageScheduledUpdate
) -> None:
    # assigned_to = coverage.assigned_to
    if not coverage.assigned_to or (not coverage.assigned_to.desk and not coverage.assigned_to.user):
        # If there is no Desk or User we will not create a new Assignment yet
        return

    assignment_service = get_resource_service("assignments")
    coverage_dict = coverage.to_dict()
    assignment_updates = get_metadata_updates_between_entities(
        planning=item.to_dict(),
        coverage=coverage_dict,
        destination="assignment",
        assignment={},
    )

    if not assignment_updates:
        return

    coverage.update_from_dict(coverage.to_dict(by_alias=False), deep=True)
    assignment_ids = await assignment_service.post_from_planning([assignment_updates])
    new_assignment_id = assignment_ids[0] if len(assignment_ids) else None
    if not new_assignment_id:
        raise SuperdeskApiError.internalError("Newly created Assignment not found")

    # Copy across the ``priority`` as well as it's placed in a different location
    if assignment_updates.get("assigned_to"):
        for field, value in assignment_updates["assigned_to"].items():
            setattr(coverage.assigned_to, field, value)
    if assignment_updates.get("priority") and hasattr(coverage.assigned_to, "priority"):
        coverage.assigned_to.priority = assignment_updates["priority"]

    coverage.assigned_to.assignment_id = new_assignment_id


async def _update_assignment_from_coverage(
    req: ItemUpdateRequest,
    original_coverage: CoverageItem | CoverageScheduledUpdate,
    updated_coverage: CoverageItem | CoverageScheduledUpdate,
) -> None:
    if not original_coverage.assigned_to or not original_coverage.assigned_to.assignment_id:
        # The original coverage has no assignment, nothing to do
        return
    elif original_coverage.assigned_to and not updated_coverage.assigned_to:
        allowed_states = [WorkflowState.CANCELLED, WorkflowState.DRAFT]
        if req.original.state == WorkflowState.CANCELLED or updated_coverage.workflow_status not in allowed_states:
            raise SuperdeskApiError.badRequestError(gettext("Coverage not in correct state to remove assignment."))

    assignment_service = get_resource_service("assignments")
    existing_assignment_id = original_coverage.assigned_to.assignment_id
    original_assignment = await assignment_service.find_one_async(req=None, _id=existing_assignment_id)
    if not original_assignment:
        # Assignment was already deleted - remove the stale assignment_id reference
        # so the user can continue editing the coverage
        if updated_coverage.assigned_to:
            updated_coverage.assigned_to.assignment_id = None
        return

    if not updated_coverage.assigned_to:
        updated_coverage.assigned_to = original_coverage.assigned_to

    await _set_slugline_from_xmp(original_coverage, updated_coverage)

    if (
        updated_coverage.workflow_status != original_coverage.workflow_status
        and updated_coverage.workflow_status == WorkflowState.CANCELLED
    ):
        coverage_cancel_state = NewsCoverageStatus(**get_coverage_status_from_cv("ncostat:notint"))
        await _cancel_coverage(
            original_coverage,
            updated_coverage,
            coverage_cancel_state,
            assignment=original_assignment,
        )
        return

    if (
        original_coverage.workflow_status == WorkflowState.DRAFT
        and updated_coverage.workflow_status == WorkflowState.ACTIVE
    ):
        # If we made a coverage 'active' - change assignment status to active
        updated_coverage.assigned_to.state = AssignmentWorkflowState.ASSIGNED

    assignment_updates = get_metadata_updates_between_entities(
        planning=req.updated.to_dict(),
        coverage=updated_coverage.to_dict(),
        destination="assignment",
        assignment=original_assignment,
    )
    if assignment_updates:
        # Update only if anything got modified
        await assignment_service.system_update_async(
            existing_assignment_id,
            assignment_updates,
            original_assignment,
            skip_planning_sync=True,
            notification_source="planning",
        )

    # If there has been a change in the planning internal note then notify the assigned users/desk
    if req.updated.internal_note and req.updated.internal_note != req.original.internal_note:
        await PlanningNotifications().notify_assignment(
            coverage_status=updated_coverage.workflow_status,
            target_desk=updated_coverage.assigned_to.desk if not updated_coverage.assigned_to.user else None,
            target_user=updated_coverage.assigned_to.user,
            contact_id=updated_coverage.assigned_to.contact,
            message="assignment_planning_internal_note_msg",
            coverage_type=get_coverage_type_name(updated_coverage.planning.g2_content_type),
            slugline=req.updated.slugline,
            internal_note=req.updated.internal_note,
            no_email=True,
        )

    if _is_xmp_updated(original_coverage, updated_coverage):
        updated_assignment = deepcopy(original_assignment)
        updated_assignment.update(assignment_updates)
        await PlanningNotifications().notify_assignment(
            coverage_status=updated_coverage.workflow_status,
            target_desk=updated_coverage.assigned_to.desk if not updated_coverage.assigned_to.user else None,
            target_user=updated_coverage.assigned_to.user,
            contact_id=updated_coverage.assigned_to.contact,
            message="assignment_planning_xmp_file_msg",
            meta_message="assignment_details_email",
            coverage_type=get_coverage_type_name(updated_coverage.planning.g2_content_type),
            slugline=req.updated.slugline,
            assignment=updated_assignment,
        )

    # Copy across the ``priority`` as well as it's placed in a different location
    if assignment_updates.get("assigned_to"):
        for field, value in assignment_updates["assigned_to"].items():
            setattr(updated_coverage.assigned_to, field, value)
    if assignment_updates.get("priority") and hasattr(updated_coverage.assigned_to, "priority"):
        updated_coverage.assigned_to.priority = assignment_updates["priority"]


async def _add_scheduled_updates(item: UnifiedPlanningResource, coverage: CoverageItem) -> None:
    if not coverage.scheduled_updates:
        return

    if not get_planning_allow_scheduled_updates():
        raise SuperdeskApiError.badRequestError(gettext("Not configured to create scheduled updates to a coverage"))

    for scheduled_update in coverage.scheduled_updates:
        if scheduled_update.scheduled_update_id or not scheduled_update.scheduled_update_id.startswith(TEMP_ID_PREFIX):
            # If this schedule already has an ID, it has already been created, skipping this one
            continue

        scheduled_update.coverage_id = coverage.coverage_id
        scheduled_update.scheduled_update_id = generate_guid(type=GUID_NEWSML)
        _set_scheduled_update_active(item, coverage, scheduled_update)
        await _create_assignment_from_coverage(item, scheduled_update)


async def _update_scheduled_updates(
    req: ItemUpdateRequest, original_coverage: CoverageItem, updated_coverage: CoverageItem
) -> None:
    if not updated_coverage.scheduled_updates:
        return

    original_scheduled_updates = {
        entry.scheduled_update_id: entry for entry in original_coverage.scheduled_updates or []
    }
    for scheduled_update in updated_coverage.scheduled_updates:
        original_scheduled_update = original_scheduled_updates.get(scheduled_update.scheduled_update_id)
        if not original_scheduled_update:
            continue
        if (
            original_scheduled_update.workflow_status == WorkflowState.DRAFT
            and scheduled_update.workflow_status == WorkflowState.ACTIVE
        ):
            _set_scheduled_update_active(req.original, updated_coverage, scheduled_update)
        await _create_or_update_assignment(req, original_scheduled_update, scheduled_update)


async def _remove_scheduled_updates(
    req: ItemUpdateRequest, original_coverage: CoverageItem, updated_coverage: CoverageItem
):
    if not original_coverage.scheduled_updates:
        return

    updated_scheduled_updates = {entry.scheduled_update_id: entry for entry in updated_coverage.scheduled_updates or []}
    for original_scheduled_update in original_coverage.scheduled_updates:
        updated_scheduled_update = updated_scheduled_updates.get(original_scheduled_update.scheduled_update_id)
        if updated_scheduled_update:
            await _remove_coverage_entity(req, original_scheduled_update)


async def _cancel_coverage(
    original_coverage: CoverageItem | CoverageScheduledUpdate,
    updated_coverage: CoverageItem | CoverageScheduledUpdate,
    cancel_state: NewsCoverageStatus,
    assignment: dict | None = None,
    event_cancellation: bool | None = None,
    event_reschedule: bool | None = None,
) -> None:
    # If coverage is already cancelled, don't change it's state reason
    if updated_coverage.previous_status is not None:
        return

    updated_coverage.news_coverage_status = cancel_state
    updated_coverage.previous_status = original_coverage.workflow_status
    updated_coverage.workflow_status = WorkflowState.CANCELLED

    if not updated_coverage.assigned_to:
        return

    updated_coverage.assigned_to.state = AssignmentWorkflowState.CANCELLED

    if not updated_coverage.assigned_to.assignment_id:
        return

    # Cancel assignment if the coverage has an assignment
    assignment_service = get_resource_service("assignments")

    if not assignment:
        assignment = await assignment_service.find_one_async(req=None, _id=updated_coverage.assigned_to.assignment_id)
        if not assignment:
            logger.warning(
                "Failed to cancel coverage's assignment, not found",
                extra=dict(coverage_id=updated_coverage._id, assignment_id=updated_coverage.assigned_to.assignment_id),
            )
            return

    if assignment:
        await assignment_service.cancel_assignment(
            assignment, updated_coverage.to_dict(), event_cancellation, event_reschedule
        )


def _set_scheduled_update_active(
    item: UnifiedPlanningResource, coverage: CoverageItem, scheduled_update: CoverageScheduledUpdate
) -> None:
    _set_coverage_active(item, scheduled_update)

    if coverage.workflow_status == WorkflowState.DRAFT and scheduled_update.workflow_status == WorkflowState.ACTIVE:
        raise SuperdeskApiError.badRequestError(
            gettext("Cannot add a scheduled update to workflow when original coverage is not in workflow")
        )


def _set_coverage_active(item: UnifiedPlanningResource, coverage: CoverageItem | CoverageScheduledUpdate) -> None:
    if not get_config(bool, "PLANNING_AUTO_ASSIGN_TO_WORKFLOW", False):
        return
    elif not coverage.assigned_to or (not coverage.assigned_to.desk and not coverage.assigned_to.user):
        return
    elif item.flags and item.flags.overide_auto_assign_to_workflow:
        return
    elif item.state == WorkflowState.DRAFT:
        return

    coverage.workflow_status = WorkflowState.ACTIVE
    coverage.add_coverage_to_workflow = True

    if coverage.scheduled_updates:
        # set all scheduled_updates to be activated as well
        for scheduled_update in coverage.scheduled_updates:
            if scheduled_update.assigned_to and scheduled_update.workflow_status == WorkflowState.DRAFT:
                scheduled_update.workflow_status = WorkflowState.ACTIVE


def _get_assigned_desk_str(assigned_to: CoverageAssignedTo | dict | None) -> str | None:
    if not assigned_to:
        return None
    elif isinstance(assigned_to, CoverageAssignedTo):
        return str(assigned_to.desk) if assigned_to.desk else None
    else:
        return str(assigned_to["desk"]) if assigned_to.get("desk") else None


def _get_assigned_user_str(assigned_to: CoverageAssignedTo | dict | None) -> str | None:
    if not assigned_to:
        return None
    elif isinstance(assigned_to, CoverageAssignedTo):
        return str(assigned_to.user) if assigned_to.user else None
    else:
        return str(assigned_to["user"]) if assigned_to.get("user") else None


async def _send_remove_assignment_notifications(
    item: UnifiedPlanningResource, coverage: CoverageItem, assignment: dict
) -> None:
    coverage_type = get_coverage_type_name(coverage.planning.g2_content_type) if coverage.planning else None

    for scheduled_update in coverage.scheduled_updates or []:
        target_user = _get_assigned_user_str(scheduled_update.assigned_to)
        target_desk = _get_assigned_desk_str(scheduled_update.assigned_to) if not target_user else None

        await PlanningNotifications().notify_assignment(
            coverage_status=scheduled_update.workflow_status,
            target_desk=target_desk,
            target_user=target_user,
            message="assignment_removed_msg",
            coverage_type=coverage_type,
            slugline=item.slugline or "",
        )

    target_user = _get_assigned_user_str(assignment.get("assigned_to"))
    target_desk = _get_assigned_desk_str(assignment.get("assigned_to")) if not target_user else None
    await PlanningNotifications().notify_assignment(
        coverage_status=coverage.workflow_status,
        target_desk=target_desk,
        target_user=target_user,
        message="assignment_removed_msg",
        coverage_type=coverage_type,
        slugline=item.slugline or "",
    )


async def remove_assignment_from_coverage(assignment: dict) -> dict:
    if not assignment.get("planning_item") or not assignment.get("coverage_item"):
        raise SuperdeskApiError.internalError(gettext("Planning and Coverge IDs missing from Assignment"))
    coverage_id = assignment["coverage_item"]
    planning_service = UnifiedPlanningResource.get_service()
    planning_item = await planning_service.find_by_id(assignment["planning_item"])

    if not planning_item or assignment.get("_to_delete"):
        return planning_item.to_dict() if planning_item else {}

    try:
        coverage_item = next(
            coverage for coverage in planning_item.coverages or [] if coverage.coverage_id == coverage_id
        )
    except StopIteration:
        raise SuperdeskApiError.badRequestError(gettext("Coverage does not exist"))

    if not coverage_item.assigned_to:
        # Assignment was already removed (unposting a planning item scenario)
        return planning_item.to_dict()

    await _send_remove_assignment_notifications(planning_item, coverage_item, assignment)

    for scheduled_update in coverage_item.scheduled_updates or []:
        scheduled_update.workflow_status = WorkflowState.DRAFT
    coverage_item.workflow_status = WorkflowState.DRAFT

    updates = {"coverages": planning_item.to_dict()["coverages"]}
    await planning_service.system_update(planning_item.id, updates)
    await signals.on_assignment_removed_from_coverage.send(planning_item, coverage_id)

    updates["related_events"] = get_related_event_links(planning_item)
    return updates

    """
    for s in coverage_item.get("scheduled_updates") or []:
        if "assigned_to" in s:
            s["assigned_to"] = {}
        s["workflow_status"] = WORKFLOW_STATE.DRAFT

    if "assigned_to" in coverage_item:
        coverage_item["assigned_to"] = {}
    coverage_item["workflow_status"] = WORKFLOW_STATE.DRAFT

    updated_planning = await self.system_update_async(
        planning_item[ID_FIELD], {"coverages": coverages}, planning_item
    )

    await PlanningAutosaveAsyncService().on_assignment_removed(planning_item[ID_FIELD], coverage_id)

    updated_planning["related_events"] = get_related_event_links_for_planning(planning_item)

    return updated_planning
    """
