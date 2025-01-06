from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
)

from planning.types import PlanningResourceModel

from .planning_service import PlanningAsyncService

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
