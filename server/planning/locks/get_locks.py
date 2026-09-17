from typing import Annotated, TypedDict, Literal, TypeGuard
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
    resources: list[type[ResourceModel]] = []

    if PlanningLockRepos.EVENTS_AND_PLANNING in repos:
        locks.update({"event": {}, "planning": {}, "recurring": {}})
        resources.append(UnifiedPlanningResource)
        resources.append(PlanningFeaturedLockResource)

    if PlanningLockRepos.ASSIGNMENTS in repos:
        locks["assignment"] = {}
        resources.append(AssignmentResourceModel)

    if PlanningLockRepos.FEATURED_PLANNING in repos:
        locks["featured"] = None

    if not resources:
        return locks

    def _is_valid_key(key: str) -> TypeGuard[ItemLockKeys]:
        return key in {"featured", "event", "planning", "recurring", "assignment"}

    cursors = await asyncio.gather(*(_get_locks_for_resource(resource_model) for resource_model in resources))

    for resource_model, items in zip(resources, cursors):
        # The hits are projected to the lock fields, too little to build the resource model from
        while (item := await items.next_raw()) is not None:
            if resource_model is PlanningFeaturedLockResource:
                locks["featured"] = ItemLock(
                    item_id=item.get("_id"),
                    item_type="planning_featured_lock",
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
