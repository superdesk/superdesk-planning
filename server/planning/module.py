from quart_babel import gettext

from superdesk.core.module import Module, SuperdeskAsyncApp

from superdesk.types import FilterConditionFieldParam, FilterConditionOperator
from superdesk.publish_async.signals import on_get_available_filter_params

from planning.types import AgendasResourceModel
from planning.agendas_async import agendas_resource_config
from planning.content_api import (
    content_api_event_resource_config,
    content_api_planning_resource_config,
)

from planning.events import events_resource_config, events_history_resource_config
from planning.planning import (
    planning_resource_config,
    planning_history_resource_config,
    planning_featured_resource_config,
)
from planning.events.views import events_endpoints_group
from planning.planning.views import planning_endpoint_group
from planning.assignments import (
    assignments_resource_config,
    delivery_resource_config,
    assignments_history_resource_config,
)
from planning.locations import locations_resource_config
from planning.published import published_resource_config
from planning.content_profiles import planning_types_resource_config
from planning.content_api.content_api_docs import content_api_docs_endpoints
from planning.search import (
    connect_signals_listeners,
    events_planning_filters_resource_config,
    events_planning_filters_privileges,
)

from .planning_download import planning_download_endpoint
from .unified.module import unified_planning_resource_config
from .unified.signals import connect_signals
from .unified.docs import unified_resource_docs_endpoints
from .autosave.module import init_autosave_module, autosave_resource_config
from .locks.module import planning_lock_endpoints, planning_featured_lock_resource, connect_signals_to_locks


async def add_agenda_to_filter_params(fields: list[FilterConditionFieldParam]) -> None:
    """Add agendas filter to the available list of filter params."""

    enabled_agendas = await AgendasResourceModel.get_service().get_all_list_raw({"is_enabled": True})
    fields.append(
        FilterConditionFieldParam(
            field="agendas",
            label=gettext("Agendas"),
            operators=[FilterConditionOperator.IN, FilterConditionOperator.NOT_IN],
            values=enabled_agendas,
            value_field="_id",
        )
    )


def init_planning(app: SuperdeskAsyncApp):
    on_get_available_filter_params.connect(add_agenda_to_filter_params)
    connect_signals()

    # register listeners for events planning filters signals
    connect_signals_listeners()
    init_autosave_module(app)

    # register listeners for lock functionality
    connect_signals_to_locks(wsgi_app)


module = Module(
    "planning",
    init=init_planning,
    endpoints=[
        planning_endpoint_group,
        events_endpoints_group,
        planning_download_endpoint,
        content_api_docs_endpoints,
        unified_resource_docs_endpoints,
        planning_lock_endpoints,
    ],
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
        planning_featured_resource_config,
        planning_featured_lock_resource,
        locations_resource_config,
        events_planning_filters_resource_config,
        assignments_history_resource_config,
        # content_api resources and services so they are available
        content_api_event_resource_config,
        content_api_planning_resource_config,
        # unified resource
        unified_planning_resource_config,
        autosave_resource_config,
    ],
    privileges=events_planning_filters_privileges,
)
