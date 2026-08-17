from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
)

from planning.types import EventResourceModel
from .events_service import EventsAsyncService

events_resource_config: ResourceConfig = ResourceConfig(
    name="events",
    data_class=EventResourceModel,
    service=EventsAsyncService,
    default_sort=[("dates.start", 1)],
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="recurrence_id_1",
                keys=[("recurrence_id", 1)],
                unique=False,
            ),
            MongoIndexOptions(name="state", keys=[("state", 1)], unique=False),
            MongoIndexOptions(name="dates_start_1", keys=[("dates.start", 1)], unique=False),
            MongoIndexOptions(name="dates_end_1", keys=[("dates.end", 1)], unique=False),
            MongoIndexOptions(name="template", keys=[("template", 1)], unique=False),
        ],
    ),
    # TODO-ASYNC: Use eve resource for elastic mapping - as this one is not working there
    elastic=ElasticResourceConfig(auto_create_index=False),
)
