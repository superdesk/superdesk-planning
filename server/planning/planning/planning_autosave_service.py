import logging

from superdesk.core import get_current_app

from planning.autosave_service import AutosaveAsyncService
from planning.common import WORKFLOW_STATE
from planning.coverage_assignments import update_planning_from_assignment_changes

logger = logging.getLogger(__name__)


class PlanningAutosaveAsyncService(AutosaveAsyncService):
    """Async Autosave service for planning resources."""

    async def on_assignment_removed(self, planning_id, coverage_id):
        item = await self.find_by_id_raw(item_id=planning_id)

        if not item:
            # Item is not currently being edited (No current autosave item)
            logger.debug(
                "planning:autosave_assignment_removed_skipped planning_id=%s coverage_id=%s reason=no_autosave_item",
                planning_id,
                coverage_id,
            )
            return

        coverages = item.get("coverages") or []
        coverage = next((c for c in coverages if c.get("coverage_id") == coverage_id), None)

        if not coverage:
            logger.warning("Coverage {} not found in autosave for item {}".format(coverage_id, planning_id))
            return

        # Remove assignment info from the coverage
        coverage.pop("assigned_to", None)
        coverage["workflow_status"] = WORKFLOW_STATE.DRAFT

        # Remove assignment info from any child scheduled_updates
        for coverage_update in coverage.get("scheduled_updates") or []:
            coverage_update.pop("assigned_to", None)
            coverage_update["workflow_status"] = WORKFLOW_STATE.DRAFT

        logger.info(
            "planning:autosave_assignment_removed planning_id=%s coverage_id=%s scheduled_updates=%s",
            planning_id,
            coverage_id,
            len(coverage.get("scheduled_updates") or []),
        )
        await self.system_update(planning_id, {"coverages": coverages})

    async def on_assignment_updated(self, updates: dict, original: dict) -> None:
        """Update the Planning Autosave upon changes to any associated Assignment.

        This makes sure that the Coverage's Assignee details (user, desk etc) are kept in sync with the Assignment.

        :param updates: The Assignment updates that were made
        :param original: The original Assignment document
        """

        if "assigned_to" not in updates and "priority" not in updates:
            # Relevant Assignment data was not updated, no need to update the Planning autosave
            logger.debug(
                "planning:autosave_assignment_sync_skipped assignment_id=%s reason=no_relevant_fields",
                original.get("_id"),
            )
            return

        current_request = get_current_app().get_current_request()
        if current_request and "/planning" in current_request.path:
            # This request came from the Planning endpoint itself,
            # no need to respond to an Assignment update here
            logger.debug(
                "planning:autosave_assignment_sync_skipped assignment_id=%s reason=planning_request_path path=%s",
                original.get("_id"),
                current_request.path,
            )
            return

        assignment = original.copy()
        assignment.update(updates)
        logger.info(
            "planning:autosave_assignment_sync assignment_id=%s planning_item=%s coverage_item=%s updated_fields=%s",
            assignment.get("_id"),
            assignment.get("planning_item"),
            assignment.get("coverage_item"),
            sorted(list(updates.keys())),
        )
        await update_planning_from_assignment_changes(assignment, is_autosave=True)
