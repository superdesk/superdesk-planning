from asyncio import gather
from bson import ObjectId

from apps.item_lock.components.item_lock import LOCK_SESSION, LOCK_USER
from superdesk.core.module import Module, SuperdeskAsyncApp
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

from .planning_locks import planning_locks as planning_locks_endpoint


async def cleanup_on_session_end(user_id: ObjectId, session_id: ObjectId, is_last_session: bool) -> None:
    lookup = {LOCK_USER: user_id} if is_last_session else {LOCK_SESSION: session_id}
    await gather(
        EventsAutosaveAsyncService().delete_many(lookup),
        PlanningAutosaveAsyncService().delete_many(lookup),
    )


def init_planning(app: SuperdeskAsyncApp):
    wsgi_app = app.wsgi.as_any()
    wsgi_app.on_session_end += cleanup_on_session_end


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
    ],
)
