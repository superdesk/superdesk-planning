from typing import Any
from planning.core.service import BasePlanningAsyncService
from planning.types import AgendasResourceModel
from planning.unified.common import get_items_by_agenda_id, agenda_has_items
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification


async def generate_planning_info(docs: list[dict[str, Any]]):
    for doc in docs:
        cursor = await get_items_by_agenda_id(doc.get("_id"))
        doc["plannings"] = await cursor.to_list_raw()


class AgendasAsyncService(BasePlanningAsyncService[AgendasResourceModel]):
    async def on_created(self, docs: list[AgendasResourceModel]) -> None:
        for doc in docs:
            push_notification(
                "agenda:created", item=str(doc.id), user=str(doc.original_creator) if doc.original_creator else None
            )

    async def on_updated(self, updates: dict[str, Any], original: AgendasResourceModel) -> None:
        await generate_planning_info([updates])
        push_notification(
            "agenda:updated",
            item=str(original.id),
            user=str(updates.get("version_creator", "")),
        )

    async def on_delete(self, doc: AgendasResourceModel):
        if await agenda_has_items(doc.id):
            raise SuperdeskApiError.badRequestError(
                message="Agenda is referenced by Planning items. Cannot delete Agenda"
            )

    async def on_deleted(self, doc: AgendasResourceModel):
        push_notification("agenda:deleted", item=str(doc.id))
