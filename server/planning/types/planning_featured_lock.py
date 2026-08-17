from superdesk.core.resources import ResourceModel
from .unified.system import LockFields


class PlanningFeaturedLockResource(LockFields, ResourceModel):
    model_resource_name = "planning_featured_lock"
