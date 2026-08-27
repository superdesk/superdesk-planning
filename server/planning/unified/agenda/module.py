from superdesk.core.resources import ResourceConfig, RestEndpointConfig
from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules

from .service import AgendasAsyncService
from .rest_api import AgendasRestEndpoints
from planning.types import AgendasResourceModel

agendas_resource_config: ResourceConfig = ResourceConfig(
    name="agenda",
    data_class=AgendasResourceModel,
    service=AgendasAsyncService,
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PATCH", "DELETE"],
        enable_cors=True,
        endpoints_class=AgendasRestEndpoints,
        auth=http_method_privilege_based_rules(
            {
                "POST": "planning_agenda_management",
                "PATCH": "planning_agenda_management",
                "DELETE": "planning_agenda_management",
            }
        ),
    ),
)
