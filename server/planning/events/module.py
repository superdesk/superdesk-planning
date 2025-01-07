from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import EventResourceModel, EventsHistoryResourceModel
from .events_service import EventsAsyncService
from .events_history_async_service import EventsHistoryAsyncService

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
            MongoIndexOptions(name="state", keys=[("state", 1)]),
            MongoIndexOptions(name="dates_start_1", keys=[("dates.start", 1)]),
            MongoIndexOptions(name="dates_end_1", keys=[("dates.end", 1)]),
            MongoIndexOptions(name="template", keys=[("template", 1)]),
        ],
    ),
    elastic=ElasticResourceConfig(),
)

events_history_resource_config: ResourceConfig = ResourceConfig(
    name="events_history",
    data_class=EventsHistoryResourceModel,
    service=EventsHistoryAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(
                name="event_id",
                keys=[("event_id", 1)],
                unique=False,
            ),
        ],
    ),
    rest_endpoints=RestEndpointConfig(resource_methods=["GET"], item_methods=["GET"]),
)
