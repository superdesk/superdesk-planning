from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    RestEndpointConfig,
)

from .assignments import AssignmentsHistoryService, AssignmentsHistoryResourceModel
from .planning import UnifiedPlanningHistoryService, UnifiedPlanningHistoryResource

__all__ = [
    "assignments_history_resource_config",
    "planning_history_resource_config",
]


assignments_history_resource_config = ResourceConfig(
    name="assignments_history",
    data_class=AssignmentsHistoryResourceModel,
    service=AssignmentsHistoryService,
    rest_endpoints=RestEndpointConfig(resource_methods=["GET"], item_methods=["GET"]),
)

planning_history_resource_config: ResourceConfig = ResourceConfig(
    name="planning_history",
    data_class=UnifiedPlanningHistoryResource,
    service=UnifiedPlanningHistoryService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="item_id",
                keys=[("item_id", 1)],
                unique=False,
            ),
        ],
    ),
    rest_endpoints=RestEndpointConfig(resource_methods=["GET"], item_methods=["GET"]),
)
