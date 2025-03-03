from superdesk.core.resources import (
    ResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import LocationResourceModel
from .locations_service_async import LocationsAsyncService

locations_resource_config: ResourceConfig = ResourceConfig(
    name="locations",
    data_class=LocationResourceModel,
    service=LocationsAsyncService,
    elastic=ElasticResourceConfig(),
    rest_endpoints=RestEndpointConfig(item_methods=["GET", "PATCH", "PUT", "DELETE"], resource_methods=["GET", "POST"]),
)
