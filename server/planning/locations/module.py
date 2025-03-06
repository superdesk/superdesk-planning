from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules
from superdesk.core.resources import (
    ResourceConfig,
    ElasticResourceConfig,
    RestEndpointConfig,
)

from planning.types import LocationResourceModel
from .locations_service_async import LocationsAsyncService
from .rest_api import LocationsRestEndpoints

locations_resource_config: ResourceConfig = ResourceConfig(
    name="locations",
    data_class=LocationResourceModel,
    service=LocationsAsyncService,
    elastic=ElasticResourceConfig(),
    rest_endpoints=RestEndpointConfig(
        item_methods=["GET", "PATCH", "PUT", "DELETE"],
        resource_methods=["GET", "POST"],
        endpoints_class=LocationsRestEndpoints,
        auth=http_method_privilege_based_rules(
            {
                "POST": "planning",
                "PATCH": "planning_locations_management",
                "DELETE": "planning_locations_management",
            }
        ),
    ),
)
