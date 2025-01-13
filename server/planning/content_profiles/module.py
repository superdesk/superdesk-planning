from superdesk.core.resources import ResourceConfig, RestEndpointConfig

from planning.types import PlanningTypesResourceModel
from .planning_types_async_service import PlanningTypesAsyncService


planning_types_resource_config = ResourceConfig(
    name="planning_types",
    data_class=PlanningTypesResourceModel,
    service=PlanningTypesAsyncService,
    rest_endpoints=RestEndpointConfig(resource_methods=["GET", "POST"], item_methods=["GET", "PATCH"]),
)
