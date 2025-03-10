from superdesk.core.resources import ResourceConfig

# from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules

from .agendas_async_service import AgendasAsyncService
from planning.types import AgendasResourceModel

agendas_resource_config = ResourceConfig(
    name="agenda",
    data_class=AgendasResourceModel,
    service=AgendasAsyncService,
    # NOTE: uncomment when ready to have async rest endpoints
    # rest_endpoints=RestEndpointConfig(
    #     resource_methods=["GET", "POST"],
    #     item_methods=["GET", "PATCH", "DELETE"],
    #     enable_cors=True,
    #     auth=http_method_privilege_based_rules(
    #         {
    #             "POST": "planning_agenda_management",
    #             "PATCH": "planning_agenda_management",
    #             "DELETE": "planning_agenda_management",
    #         }
    #     ),
    # ),
)
