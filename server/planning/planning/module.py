from superdesk.core.resources import ResourceConfig, RestEndpointConfig

from planning.types import PlanningFeaturedResourceModel
from .planning_featured_async_service import PlanningFeaturedAsyncService


planning_featured_resource_config: ResourceConfig = ResourceConfig(
    name="planning_featured",
    data_class=PlanningFeaturedResourceModel,
    service=PlanningFeaturedAsyncService,
    rest_endpoints=RestEndpointConfig(resource_methods=["GET", "POST"], item_methods=["GET", "PATCH", "PUT", "DELETE"]),
)
