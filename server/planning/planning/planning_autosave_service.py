import logging

from planning.autosave_service import AutosaveAsyncService
from planning.common import WORKFLOW_STATE

logger = logging.getLogger(__name__)


class PlanningAutosaveAsyncService(AutosaveAsyncService):
    """Async Autosave service for planning resources."""

    async def on_assignment_removed(self, planning_id, coverage_id):
        item = await self.find_by_id_raw(item_id=planning_id)

        if not item:
            # Item is not currently being edited (No current autosave item)
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

        await self.system_update(planning_id, {"coverages": coverages})
