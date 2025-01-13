from superdesk.core.resources import (
    ResourceConfig,
    RestEndpointConfig,
)

from .agendas_async_service import AgendasAsyncService
from planning.types import AgendasResourceModel

agendas_resource_config = ResourceConfig(
    name="agenda",
    data_class=AgendasResourceModel,
    service=AgendasAsyncService,
    rest_endpoints=RestEndpointConfig(resource_methods=["GET", "POST"], item_methods=["GET", "PATCH", "DELETE"]),
)
