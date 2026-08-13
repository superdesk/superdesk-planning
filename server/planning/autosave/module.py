import logging

from bson import ObjectId

from superdesk.core import get_current_app
from superdesk.core.app import SuperdeskAsyncApp
from superdesk.core.resources import ResourceConfig, MongoIndexOptions, MongoResourceConfig, RestEndpointConfig
from apps.item_lock.components.item_lock import LOCK_SESSION, LOCK_USER

from planning import signals
from planning.types import WorkflowState
from planning.types.unified import UnifiedPlanningResource
from planning.coverage_assignments import update_planning_from_assignment_changes

from .service import AutosaveResourceModel, AutosaveAsyncService


__all__ = ["init_autosave_module", "autosave_resource_config"]
logger = logging.getLogger(__name__)


def init_autosave_module(app: SuperdeskAsyncApp) -> None:
    wsgi_app = app.wsgi.as_any()
    wsgi_app.on_session_end += _cleanup_on_session_end
    wsgi_app.on_updated_assignments += _on_assignment_updated

    signals.on_assignment_removed_from_coverage.connect(_on_assignment_removed)
    signals.event_spiked.connect(_remove_autosave_on_spike)
    signals.planning_spiked.connect(_remove_autosave_on_spike)
    signals.item_unlocked.connect(_on_item_unlocked)


async def _cleanup_on_session_end(user_id: ObjectId, session_id: ObjectId, is_last_session: bool):
    lookup = {LOCK_USER: user_id} if is_last_session else {LOCK_SESSION: session_id}
    await AutosaveResourceModel.get_service().delete_many(lookup)


async def _on_assignment_removed(planning_item: UnifiedPlanningResource, coverage_id: str) -> None:
    autosave_service = AutosaveResourceModel.get_service()
    autosave_item = await autosave_service.find_by_id_raw(planning_item.id)
    if not autosave_item:
        # Item is not currently being edited (no current autosave item)
        return

    coverages = autosave_item.get("coverages") or []
    coverage = next((c for c in coverages if c.get("coverage_id") == coverage_id), None)

    if not coverage:
        logger.warning("Coverage {} not found in autosave for item {}".format(coverage_id, planning_item.id))
        return

    # Remove assignment info from the coverage
    coverage.pop("assigned_to", None)
    coverage["workflow_status"] = WorkflowState.DRAFT

    # Remove assignment info from any child scheduled_updates
    for coverage_update in coverage.get("scheduled_updates") or []:
        coverage_update.pop("assigned_to", None)
        coverage_update["workflow_status"] = WorkflowState.DRAFT

    await autosave_service.system_update(planning_item.id, {"coverages": coverages})


async def _on_assignment_updated(updates: dict, original: dict) -> None:
    """Update the Planning Autosave upon changes to any associated Assignment.

    This makes sure that the Coverage's Assignee details (user, desk etc) are kept in sync with the Assignment.

    :param updates: The Assignment updates that were made
    :param original: The original Assignment document
    """
    if "assigned_to" not in updates and "priority" not in updates:
        # Relevant Assignment data was not updated, no need to update the Planning autosave
        return

    current_request = get_current_app().get_current_request()
    if current_request and "/planning" in current_request.path:
        # This request came from the Planning endpoint itself,
        # no need to respond to an Assignment update here
        return

    assignment = original.copy()
    assignment.update(updates)
    await update_planning_from_assignment_changes(assignment, is_autosave=True)


async def _remove_autosave_on_spike(updates: dict, original: dict) -> None:
    if original.get("lock_action") != "edit":
        return

    await AutosaveResourceModel.get_service().delete_many(lookup={"_id": original["_id"]})


async def _on_item_unlocked(resource: str, item: dict, user_id: ObjectId) -> None:
    try:
        # Delete any autosave items associated with this item
        await AutosaveResourceModel.get_service().delete_many(lookup={"_id": item["_id"]})
    except Exception as err:
        logger.exception(f"Failed to delete autosave item(s) ({err})")


autosave_resource_config = ResourceConfig(
    name="planning_autosave",
    data_class=AutosaveResourceModel,
    service=AutosaveAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="item_type_1",
                keys=[("type", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="planning_autosave_user",
                keys=[("lock_user", 1)],
                background=True,
                unique=False,
            ),
            MongoIndexOptions(
                name="planning_autosave_session",
                keys=[("lock_session", 1)],
                background=True,
                unique=False,
            ),
            MongoIndexOptions(
                name="planning_autosave_session",
                keys=[("lock_session", 1)],
                background=True,
                unique=False,
            ),
        ]
    ),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PUT", "PATCH", "DELETE"],
        enable_cors=True,
    ),
)
