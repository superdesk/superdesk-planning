from enum import Enum, unique
from typing import Annotated

from eve.utils import ParsedRequest
from pydantic import BaseModel, Field, field_validator

from superdesk.core import json
from superdesk import get_resource_service
from superdesk.core import get_app_config
from superdesk.core.web import EndpointGroup
from superdesk.core.types import Response, Request

from planning.utils import get_first_related_event_id_for_planning
from planning.search.queries.elastic import ElasticQuery, field_exists


planning_locks_endpoints = EndpointGroup("/planning_locks", __name__, url_prefix=get_app_config("URL_PREFIX"))


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
    repos: Annotated[list[PlanningLockRepos], Field(default=DEFAULT_REPOS)]

    @field_validator("repos", mode="before")
    def parse_repos(cls, value: list[PlanningLockRepos] | str) -> list[str]:
        """If value is not a list, then convert it to a list here"""

        return value.split(",") if isinstance(value, str) else value


@planning_locks_endpoints.endpoint("/planning_locks", methods=["GET"])
def get_planning_locks(_: None, params: PlanningLocksParams, request: Request):
    resp = _get_planning_module_locks(params.repos)
    return Response(resp)


def _get_planning_module_locks(repos: list[PlanningLockRepos]):
    item_locks = []
    locks = {}

    if PlanningLockRepos.EVENTS_AND_PLANNING in repos:
        locks.update({"event": {}, "planning": {}, "recurring": {}})
        item_locks.extend(list(_get_event_locks()))
        item_locks.extend(list(_get_planning_locks()))

    if PlanningLockRepos.FEATURED_PLANNING in repos:
        locks["featured"] = None
        item_locks.extend(list(_get_planning_featured_lock()))

    if PlanningLockRepos.ASSIGNMENTS in repos:
        locks["assignment"] = {}
        item_locks.extend(list(_get_assignment_locks()))

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


def _get_event_locks():
    return get_resource_service("events").get(req=_get_query(), lookup=None)


def _get_planning_locks():
    return get_resource_service("planning").get(req=_get_query(), lookup=None)


def _get_planning_featured_lock():
    return get_resource_service("planning_featured_lock").get(req=_get_query(), lookup=None)


def _get_assignment_locks():
    return get_resource_service("assignments").get(req=_get_query(), lookup=None)
