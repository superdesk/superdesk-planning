from typing import TypeVar, List, Dict, Any
from apps.auth import get_user_id
from superdesk.core.resources.service import AsyncResourceService, ResourceModelType

from planning.types import BasePlanningModel


PlanningResourceModelType = TypeVar("PlanningResourceModelType", bound=BasePlanningModel)


class BasePlanningAsyncService(AsyncResourceService[PlanningResourceModelType]):
    """Base async service to handle repetitive logic that is used throughout the planning project."""

    async def on_create(self, docs: List[PlanningResourceModelType]) -> None:
        """
        Sets `original_creator` and  `version_creator` by default to avoid repeating this everywhere
        """
        await super().on_create(docs)

        user_id = get_user_id()
        if user_id:
            for doc in docs:
                doc.original_creator = user_id
                doc.version_creator = user_id

    async def on_update(self, updates: Dict[str, Any], original: ResourceModelType) -> None:
        """
        Sets `version_creator` by default from current session's user
        """
        await super().on_update(updates, original)

        user_id = get_user_id()
        if user_id:
            updates["version_creator"] = user_id
