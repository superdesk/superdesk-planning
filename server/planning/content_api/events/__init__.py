from superdesk.core.module import Module
from superdesk.core.resources import (
    ResourceConfig,
    MongoResourceConfig,
    MongoIndexOptions,
    ElasticResourceConfig,
    RestEndpointConfig
)
from content_api import MONGO_PREFIX, ELASTIC_PREFIX

from .event import EventResourceModel, ContentAPIEventService


content_api_event_resource_config = ResourceConfig(
    name="events",
    data_class=EventResourceModel,
    service=ContentAPIEventService,
    default_sort=[("versioncreated", -1)],
    versioning=True,
    mongo=MongoResourceConfig(
        prefix=MONGO_PREFIX,
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
    elastic=ElasticResourceConfig(prefix=ELASTIC_PREFIX),
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET"],
        item_methods=["GET"],
        enable_cors=True,
    ),

)

module = Module(
    "planning.content_api.events",
    resources=[content_api_event_resource_config],
)
