import asyncio
from enum import Enum, unique
from typing import Annotated, Any

from eve.utils import ParsedRequest
from pydantic import BaseModel, Field, field_validator

from superdesk.core import json
from superdesk import get_resource_service
from superdesk.core.web import endpoint
from superdesk.core.types import Response, SearchRequest, ESQuery, ESBoolQuery

from planning.events import EventsAsyncService
from planning.planning import PlanningAsyncService
from planning.assignments import AssignmentsAsyncService
from planning.core.service import BasePlanningAsyncService
from planning.utils import get_first_related_event_id_for_planning
from planning.search.queries.elastic import ElasticQuery, field_exists


@unique
class PlanningLockRepos(str, Enum):
    EVENTS_AND_PLANNING = "events_and_planning"
    FEATURED_PLANNING = "featured_planning"
    ASSIGNMENTS = "assignments"


DEFAULT_REPOS = [
    PlanningLockRepos.EVENTS_AND_PLANNING,
    PlanningLockRepos.FEATURED_PLANNING,
    PlanningLockRepos.ASSIGNMENTS,
]

PROJECTED_FIELDS = [
    "_id",
    "type",
    "recurrence_id",
    "related_events",
    "lock_time",
    "lock_action",
    "lock_user",
    "lock_session",
]


class PlanningLocksParams(BaseModel):
    repos: Annotated[list[PlanningLockRepos], Field(default_factory=lambda: DEFAULT_REPOS)]

    @field_validator("repos", mode="before")
    def parse_repos(cls, value: list[PlanningLockRepos] | str) -> list[PlanningLockRepos]:
        """If value is not a list, then convert it to a list here"""
        if isinstance(value, str):
            return [PlanningLockRepos(item.strip()) for item in value.split(",")]
        return value


@endpoint("planning_locks", methods=["GET"])
async def get_planning_locks(_: None, params: PlanningLocksParams, _r: None):
    print("*" * 100)
    print(params.repos)
    resp = await _get_planning_module_locks(params.repos)
    return Response(resp)


async def _get_planning_module_locks(repos: list[PlanningLockRepos]):
    item_locks = []
    locks: dict[str, Any] = {}

    # to be executed concurrently
    tasks = []

    if PlanningLockRepos.EVENTS_AND_PLANNING in repos:
        locks.update({"event": {}, "planning": {}, "recurring": {}})
        tasks.append(_get_event_locks())
        tasks.append(_get_planning_locks())

    if PlanningLockRepos.ASSIGNMENTS in repos:
        locks["assignment"] = {}
        tasks.append(_get_assignment_locks())

    # execute all async tasks concurrently
    if tasks:
        for result in await asyncio.gather(*tasks):
            item_locks.extend(result)

    if PlanningLockRepos.FEATURED_PLANNING in repos:
        locks["featured"] = None

        # TODO-ASYNC: add to tasks once it is migrated to async
        item_locks.extend(list(_get_planning_featured_lock()))

    for item in item_locks:
        if item.get("_type") == "planning_featured_lock":
            locks["featured"] = {
                "item_id": item.get("_id"),
                "item_type": item.get("_type"),
                "user": item.get("lock_user"),
                "session": item.get("lock_session"),
                "action": "featured",
                "time": item.get("lock_time"),
            }
            continue

        lock = {
            "item_id": item.get("_id"),
            "item_type": item.get("type"),
            "user": item.get("lock_user"),
            "session": item.get("lock_session"),
            "action": item.get("lock_action"),
            "time": item.get("lock_time"),
        }
        primary_event_id = get_first_related_event_id_for_planning(item, "primary")
        if item.get("recurrence_id"):
            locks["recurring"][item["recurrence_id"]] = lock
        elif primary_event_id is not None:
            locks["event"][primary_event_id] = lock
        else:
            locks[item["type"]][lock["item_id"]] = lock

    return locks


def _prepare_query() -> SearchRequest:
    """Prepare a SearchRequest object for querying locked items

    Returns:
        SearchRequest: A SearchRequest object configured with:
            - Query filter for items with lock_session field
            - Projection fields from PROJECTED_FIELDS
            - Page 1 with 1000 results per page
    """
    return SearchRequest(
        page=1,
        max_results=1000,
        elastic=ESQuery(
            query=ESBoolQuery(
                must=[field_exists("lock_session")],
            )
        ),
        projections=PROJECTED_FIELDS,
    )


async def _get_locks_for_service(service_class: type[BasePlanningAsyncService]) -> list[dict[str, Any]]:
    """Get locks for a specific service

    Args:
        service_class: The async service class to query (e.g. EventsAsyncService)

    Returns:
        list: List of locked items from the service
    """
    cursor = await service_class().find(req=_prepare_query())
    return await cursor.to_list_raw()


async def _get_event_locks():
    return await _get_locks_for_service(EventsAsyncService)


async def _get_planning_locks():
    return await _get_locks_for_service(PlanningAsyncService)


async def _get_assignment_locks():
    return await _get_locks_for_service(AssignmentsAsyncService)


# TODO-ASYNC: remove once it is not needed by `_get_planning_featured_lock`
def _get_query():
    query = ElasticQuery()
    query.must.append(field_exists("lock_session"))
    req = ParsedRequest()
    req.args = {
        "source": json.dumps(
            {
                "query": query.build(),
                "size": 1000,
                "from": 0,
            },
        ),
        "projections": json.dumps(PROJECTED_FIELDS),
    }
    req.page = 1
    req.max_results = 1000

    return req


# TODO-ASYNC: update once `planning_featured_lock` is migrated to async
def _get_planning_featured_lock():
    return get_resource_service("planning_featured_lock").get(req=_get_query(), lookup=None)
