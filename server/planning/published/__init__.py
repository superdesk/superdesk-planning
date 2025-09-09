from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
)

from planning.types import PublishedPlanningModel

from .service import PublishedAsyncService

published_resource_config = ResourceConfig(
    name="published_planning",
    data_class=PublishedPlanningModel,
    service=PublishedAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="item_id_1_version_1",
                keys=[("item_id", 1), ("version", 1)],
                unique=False,
            ),
        ],
    ),
)
