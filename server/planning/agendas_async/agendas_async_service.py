from typing import Any
from planning.core.service import BasePlanningAsyncService
from planning.planning.planning_service import PlanningAsyncService
from planning.types import AgendasResourceModel
from apps.auth import get_user_id
from superdesk.resource_fields import ID_FIELD
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification


async def generate_planning_info(docs):
    planning_service = PlanningAsyncService()
    for doc in docs:
        cursor = await planning_service.get_planning_by_agenda_id(doc.get(ID_FIELD))
        docs = await cursor.to_list_raw()
        doc["plannings"] = docs


class AgendasAsyncService(BasePlanningAsyncService[AgendasResourceModel]):
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
        await generate_planning_info([updates])
        push_notification(
            "agenda:updated",
            item=str(original.id),
            user=str(updates.get("version_creator", "")),
        )

    async def on_delete(self, doc: AgendasResourceModel):
        planning_service = PlanningAsyncService()
        cursor = await planning_service.get_planning_by_agenda_id(doc.id)
        count = await cursor.count()

        if count > 0:
            raise SuperdeskApiError.badRequestError(
                message="Agenda is referenced by Planning items. " "Cannot delete Agenda"
            )

    async def on_deleted(self, doc: AgendasResourceModel):
        push_notification("agenda:deleted", item=str(doc.id))
