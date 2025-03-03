from asyncio import gather
from bson import ObjectId
from quart_babel import gettext

from superdesk.core.module import Module, SuperdeskAsyncApp

from superdesk.types import FilterConditionFieldParam, FilterConditionOperator
from superdesk.publish_async.signals import on_get_available_filter_params
from apps.item_lock.components.item_lock import LOCK_SESSION, LOCK_USER

from planning.types import AgendasResourceModel
from planning.agendas_async import agendas_resource_config
from planning.events import events_resource_config, events_history_resource_config, events_autosave_resource_config
from planning.events.events_autosave_async_service import EventsAutosaveAsyncService
from planning.planning import (
    planning_resource_config,
    planning_history_resource_config,
    planning_featured_resource_config,
    planning_autosave_resource_config,
)
from planning.planning.planning_autosave_async_service import PlanningAutosaveAsyncService
from planning.assignments import assignments_resource_config, delivery_resource_config
from planning.published import published_resource_config
from planning.content_profiles import planning_types_resource_config
from planning.locations import locations_resource_config
from .planning_locks import planning_locks as planning_locks_endpoint


async def cleanup_on_session_end(user_id: ObjectId, session_id: ObjectId, is_last_session: bool) -> None:
    lookup = {LOCK_USER: user_id} if is_last_session else {LOCK_SESSION: session_id}
    await gather(
        EventsAutosaveAsyncService().delete_many(lookup),
        PlanningAutosaveAsyncService().delete_many(lookup),
    )


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
    wsgi_app = app.wsgi.as_any()
    wsgi_app.on_session_end += cleanup_on_session_end
    on_get_available_filter_params.connect(add_agenda_to_filter_params)


module = Module(
    "planning",
    init=init_planning,
    endpoints=[
        planning_locks_endpoint,
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
        events_autosave_resource_config,
        planning_featured_resource_config,
        planning_autosave_resource_config,
        locations_resource_config,
    ],
)
