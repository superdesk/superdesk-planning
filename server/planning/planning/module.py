from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import (
    PlanningResourceModel,
    PlanningFeaturedResourceModel,
    PlanningAutosaveResourceModel,
)
from .planning_service import PlanningAsyncService
from .planning_featured_async_service import PlanningFeaturedAsyncService
from .planning_autosave_service import PlanningAutosaveAsyncService

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
    # TODO-ASYNC: Use eve resource for elastic mapping - as this one is not working there
    elastic=ElasticResourceConfig(auto_create_index=False),
)

planning_featured_resource_config: ResourceConfig = ResourceConfig(
    name="planning_featured",
    data_class=PlanningFeaturedResourceModel,
    service=PlanningFeaturedAsyncService,
    rest_endpoints=RestEndpointConfig(resource_methods=["GET", "POST"], item_methods=["GET", "PATCH", "PUT", "DELETE"]),
)

planning_autosave_resource_config: ResourceConfig = ResourceConfig(
    name="planning_autosave",
    data_class=PlanningAutosaveResourceModel,
    service=PlanningAutosaveAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
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
        ],
    ),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PUT", "PATCH", "DELETE"],
        enable_cors=True,
    ),
)
