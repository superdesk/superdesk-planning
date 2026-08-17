from typing import Annotated, TypedDict, Awaitable, Literal, TypeGuard
from enum import Enum, unique
import logging
import asyncio

from pydantic import BaseModel, Field, field_validator

from superdesk.core.resources import ResourceModel
from superdesk.core.types import SearchRequest, ESQuery, ESBoolQuery
from superdesk.core.resources.cursor import DictCursorAsync

from planning.types import AssignmentResourceModel, PlanningFeaturedLockResource
from planning.types.unified import UnifiedPlanningResource
from planning.search.queries.elastic import field_exists
from planning.utils import get_first_related_event_id_for_planning


logger = logging.getLogger(__name__)


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


class ItemLock(TypedDict):
    item_id: str
    item_type: str
    user: str
    session: str
    action: str
    time: str


ItemLockKeys = Literal["event", "planning", "recurring", "assignment"]


class ItemLocks(TypedDict, total=False):
    featured: ItemLock | None
    event: dict[str, ItemLock]
    planning: dict[str, ItemLock]
    recurring: dict[str, ItemLock]
    assignment: dict[str, ItemLock]


class PlanningLocksParams(BaseModel):
    repos: Annotated[list[PlanningLockRepos], Field(default_factory=lambda: DEFAULT_REPOS)]

    @field_validator("repos", mode="before")
    def parse_repos(cls, value: list[PlanningLockRepos] | str) -> list[PlanningLockRepos]:
        """If value is not a list, then convert it to a list here"""
        if isinstance(value, str):
            return [PlanningLockRepos(item.strip()) for item in value.split(",")]
        return value


async def get_planning_module_locks(repos: list[PlanningLockRepos]) -> ItemLocks:
    locks: ItemLocks = {}
    results: list[Awaitable[DictCursorAsync]] = []

    if PlanningLockRepos.EVENTS_AND_PLANNING in repos:
        locks.update({"event": {}, "planning": {}, "recurring": {}})
        results.append(_get_locks_for_resource(UnifiedPlanningResource))
        results.append(_get_locks_for_resource(PlanningFeaturedLockResource))

    if PlanningLockRepos.ASSIGNMENTS in repos:
        locks["assignment"] = {}
        results.append(_get_locks_for_resource(AssignmentResourceModel))

    if PlanningLockRepos.FEATURED_PLANNING in repos:
        locks["featured"] = None

    if not results:
        return locks

    def _is_valid_key(key: str) -> TypeGuard[ItemLockKeys]:
        return key in {"featured", "event", "planning", "recurring", "assignment"}

    for items in await asyncio.gather(*results):
        async for item in items:
            if item.get("_type") == "planning_featured_lock":
                locks["featured"] = ItemLock(
                    item_id=item.get("_id"),
                    item_type=item.get("_type"),
                    user=item.get("lock_user"),
                    session=item.get("lock_session"),
                    action="featured",
                    time=item.get("lock_time"),
                )
                continue

            lock = ItemLock(
                item_id=item.get("_id"),
                item_type=item.get("type"),
                user=item.get("lock_user"),
                session=item.get("lock_session"),
                action=item.get("lock_action"),
                time=item.get("lock_time"),
            )
            primary_event_id = get_first_related_event_id_for_planning(item, "primary")
            if item.get("recurrence_id"):
                locks["recurring"][item["recurrence_id"]] = lock
            elif primary_event_id is not None:
                locks["event"][primary_event_id] = lock
            else:
                item_type = item["type"]
                if _is_valid_key(item_type):
                    locks[item_type][lock["item_id"]] = lock
                else:
                    logger.warning("Unable to add item to list of locks, invalid type", extra=dict(item_type=item_type))

    return locks


async def _get_locks_for_resource(resource_model: type[ResourceModel]) -> DictCursorAsync:
    if resource_model is PlanningFeaturedLockResource:
        cursor = await PlanningFeaturedLockResource.get_service().find({}, max_results=1, use_mongo=True)
    else:
        req = SearchRequest(
            page=1,
            max_results=1000,
            elastic=ESQuery(query=ESBoolQuery(must=[field_exists("lock_session")])),
            projection=PROJECTED_FIELDS,
        )
        cursor = await resource_model.get_service().find(req=req)

    return DictCursorAsync(cursor)
