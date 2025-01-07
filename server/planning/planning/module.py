from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import PlanningResourceModel, PlanningHistoryResourceModel

from .planning_service import PlanningAsyncService
from .planning_history_async_service import PlanningHistoryAsyncService

planning_resource_config: ResourceConfig = ResourceConfig(
    name="planning",
    data_class=PlanningResourceModel,
    service=PlanningAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="planning_recurrence_id",
                keys=[("planning_recurrence_id", 1)],
                unique=False,
            ),
        ],
    ),
    elastic=ElasticResourceConfig(),
)

planning_history_resource_config: ResourceConfig = ResourceConfig(
    name="planning_history",
    data_class=PlanningHistoryResourceModel,
    service=PlanningHistoryAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="planning_id",
                keys=[("planning_id", 1)],
                unique=False,
            ),
        ],
    ),
    rest_endpoints=RestEndpointConfig(resource_methods=["GET"], item_methods=["GET"]),
)
