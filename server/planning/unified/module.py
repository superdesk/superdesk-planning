from superdesk.core.resources import ResourceConfig, MongoResourceConfig, MongoIndexOptions, ElasticResourceConfig

from planning.types.unified import UnifiedPlanningResource
from .service import UnifiedPlanningResourceService


unified_planning_resource_config = ResourceConfig(
    name="unified_planning",
    data_class=UnifiedPlanningResource,
    service=UnifiedPlanningResourceService,
    default_sort=[("dates.start", 1)],
    etag_ignore_fields=["_planning_schedule", "_updates_schedule"],
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="recurrence_id_1",
                keys=[("recurrence_id", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="state",
                keys=[("state", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="dates_start_1",
                keys=[("dates.start", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="dates_end_1",
                keys=[("dates.end", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="template",
                keys=[("template", 1)],
                background=True,
            ),
            MongoIndexOptions(
                name="planning_recurrence_id",
                keys=[("planning_recurrence_id", 1)],
                background=True,
            ),
        ]
    ),
    elastic=ElasticResourceConfig(),
)
