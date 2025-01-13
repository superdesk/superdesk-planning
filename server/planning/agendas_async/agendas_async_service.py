from typing import Any
from planning.core.service import BasePlanningAsyncService
from planning.types import AgendasResourceModel
from apps.auth import get_user_id
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification


class AgendasAsyncService(BasePlanningAsyncService[AgendasResourceModel]):
    # TODO-ASYNC: on_fetched mechanism to be added to the base REST API class
    # async def _generate_planning_info(self, docs):
    #     # TODO-ASYNC: Change this when get_planning_by_agenda_id is added to utils
    #     planning_service = get_resource_service("planning")
    #     for doc in docs:
    #         doc["plannings"] = planning_service.get_planning_by_agenda_id(doc.get(ID_FIELD)).docs
    #
    # async def on_fetched(self, docs):
    #     await self._generate_planning_info(docs.get(ITEMS))
    #
    # async def on_fetched_item(self, doc):
    #     await self._generate_planning_info([doc])

    async def on_created(self, docs: list[AgendasResourceModel]) -> None:
        for doc in docs:
            push_notification(
                "agenda:created", item=str(doc.id), user=str(doc.original_creator) if doc.original_creator else None
            )

    async def on_update(self, updates: dict[str, Any], original: AgendasResourceModel) -> None:
        user_id = get_user_id()
        if user_id:
            updates["version_creator"] = get_user_id()

    async def on_updated(self, updates: dict[str, Any], original: AgendasResourceModel) -> None:
        # await self._generate_planning_info([updates])
        push_notification(
            "agenda:updated",
            item=str(original.id),
            user=str(updates.get("version_creator", "")),
        )

    async def on_delete(self, doc: AgendasResourceModel):
        # TODO-ASYNC: Change this when get_planning_by_agenda_id is added to utils
        if get_resource_service("planning").get_planning_by_agenda_id(doc.id).count() > 0:
            raise SuperdeskApiError.badRequestError(
                message="Agenda is referenced by Planning items. " "Cannot delete Agenda"
            )

    async def on_deleted(self, doc: AgendasResourceModel):
        push_notification("agenda:deleted", item=str(doc.id))
