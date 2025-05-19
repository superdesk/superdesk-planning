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
    # TODO-ASYNC: Use eve resource for elastic mapping - as this one is not working there
    elastic=ElasticResourceConfig(auto_create_index=False),
    # rest_endpoints=RestEndpointConfig(
    #     item_methods=["GET", "PATCH", "PUT", "DELETE"],
    #     resource_methods=["GET", "POST"],
    #     endpoints_class=LocationsRestEndpoints,
    #     auth=http_method_privilege_based_rules(
    #         {
    #             "POST": "planning",
    #             "PATCH": "planning_locations_management",
    #             "DELETE": "planning_locations_management",
    #         }
    #     ),
    # ),
)
