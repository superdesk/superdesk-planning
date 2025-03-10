from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
)

from planning.types import AssignmentResourceModel, DeliveryResourceModel
from .service import AssignmentsAsyncService
from .delivery_service import DeliveryAsyncService

assignments_resource_config = ResourceConfig(
    name="assignments",
    data_class=AssignmentResourceModel,
    service=AssignmentsAsyncService,
    etag_ignore_fields=["planning", "published_state", "published_at"],
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="coverage_item_1",
                keys=[("coverage_item", 1)],
                unique=False,
            ),
            MongoIndexOptions(
                name="planning_item_1",
                keys=[("planning_item", 1)],
                unique=False,
            ),
            MongoIndexOptions(
                name="published_state_1",
                keys=[("published_state", 1)],
                unique=False,
            ),
        ],
    ),
    elastic=ElasticResourceConfig(),
)

delivery_resource_config = ResourceConfig(
    name="delivery",
    data_class=DeliveryResourceModel,
    service=DeliveryAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="planning_id_1",
                keys=[("planning_id", 1)],
                background=True,
                unique=False,
            ),
            MongoIndexOptions(
                name="assignment_id_1",
                keys=[("assignment_id", 1)],
                background=True,
                unique=False,
            ),
            MongoIndexOptions(
                name="coverage_id_1",
                keys=[("coverage_id", 1)],
                background=True,
                unique=False,
            ),
            MongoIndexOptions(
                name="item_id_1",
                keys=[("item_id", 1)],
                background=True,
                unique=False,
            ),
        ],
    ),
)
