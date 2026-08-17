from superdesk.core.resources import (
    ResourceConfig,
    MongoIndexOptions,
    MongoResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import EventResourceModel, EventAutosaveResourceModel
from .events_service import EventsAsyncService
from .events_autosave_service import EventsAutosaveAsyncService

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

events_autosave_resource_config: ResourceConfig = ResourceConfig(
    name="event_autosave",
    data_class=EventAutosaveResourceModel,
    service=EventsAutosaveAsyncService,
    mongo=MongoResourceConfig(
        indexes=[
            MongoIndexOptions(name="event_autosave_user", keys=[("lock_user", 1)], background=True, unique=False),
            MongoIndexOptions(name="event_autosave_session", keys=[("lock_session", 1)], background=True, unique=False),
        ],
    ),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PUT", "PATCH", "DELETE"],
        enable_cors=True,
    ),
)
