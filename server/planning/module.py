from superdesk.core.module import Module
from planning.agendas_async import agendas_resource_config
from planning.events import events_resource_config, events_history_resource_config
from planning.planning import planning_resource_config, planning_history_resource_config
from planning.assignments import assignments_resource_config, delivery_resource_config
from planning.published import published_resource_config
from planning.content_profiles import planning_types_resource_config


module = Module(
    "planning",
    resources=[
        events_resource_config,
        planning_resource_config,
        assignments_resource_config,
        published_resource_config,
        delivery_resource_config,
        planning_types_resource_config,
        events_history_resource_config,
        planning_history_resource_config,
        agendas_resource_config,
    ],
)
