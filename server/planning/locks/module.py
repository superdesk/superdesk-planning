from superdesk.factory.app import SuperdeskApp

from .views import planning_lock_endpoints
from .featured_lock import planning_featured_lock_resource
from .assignment import validate_assignment_lock, sync_content_lock_to_assignment, sync_content_unlock_to_assignment

__all__ = ["planning_lock_endpoints", "planning_featured_lock_resource"]


def connect_signals_to_locks(app: SuperdeskApp) -> None:
    app.on_item_lock += validate_assignment_lock
    app.on_item_locked += sync_content_lock_to_assignment
    app.on_item_unlocked += sync_content_unlock_to_assignment
