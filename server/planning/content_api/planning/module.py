from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)


from planning.planning.planning_service import PlanningAsyncService
from .planning import ContentAPIPlanningResourceModel
from content_api import MONGO_PREFIX, ELASTIC_PREFIX


content_api_planning_resource_config: ResourceConfig = ResourceConfig(
    name="planning",
    data_class=ContentAPIPlanningResourceModel,
    service=PlanningAsyncService,
    mongo=MongoResourceConfig(
        prefix=MONGO_PREFIX,
        indexes=[
            MongoIndexOptions(
                name="planning_recurrence_id",
                keys=[("planning_recurrence_id", 1)],
                unique=False,
            ),
        ],
    ),
    elastic=ElasticResourceConfig(prefix=ELASTIC_PREFIX),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET"],
        item_methods=["GET"],
        enable_cors=True,
    ),
)
