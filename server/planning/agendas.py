from superdesk.resource_fields import ID_FIELD, ITEMS
from .common import set_original_creator
from apps.auth import get_user_id
from superdesk import Resource, get_resource_service
from superdesk.eve_async import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification


class AgendasResource(Resource):
    url = "agenda"
    schema = {
        "name": {
            "type": "string",
            "iunique": True,
            "required": True,
            "empty": False,
            "nullable": False,
        },
        # Audit Information
        "original_creator": Resource.rel("users"),
        "version_creator": Resource.rel("users"),
        "is_enabled": {"type": "boolean", "default": True},
    }

    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "PATCH", "DELETE"]

    privileges = {
        "POST": "planning_agenda_management",
        "PATCH": "planning_agenda_management",
        "DELETE": "planning_agenda_management",
    }
    # internal_resource = True


class AgendasService(AsyncBaseService):
    async def _generate_planning_info(self, docs):
        planning_service = get_resource_service("planning")
        for doc in docs:
            cursor = await planning_service.get_planning_by_agenda_id(doc.get(ID_FIELD))
            doc["plannings"] = await cursor.to_list()

    async def on_fetched_async(self, docs):
        await self._generate_planning_info(docs.get(ITEMS))

    async def on_fetched_item_async(self, doc):
        await self._generate_planning_info([doc])

    async def on_create_async(self, docs):
        for doc in docs:
            set_original_creator(doc)

    async def on_created_async(self, docs):
        for doc in docs:
            push_notification(
                "agenda:created",
                item=str(doc[ID_FIELD]),
                user=str(doc.get("original_creator", "")),
            )

    async def on_update_async(self, updates, original):
        user_id = get_user_id()
        if user_id:
            updates["version_creator"] = get_user_id()

    async def on_updated_async(self, updates, original):
        await self._generate_planning_info([updates])
        push_notification(
            "agenda:updated",
            item=str(original[ID_FIELD]),
            user=str(updates.get("version_creator", "")),
        )

    async def on_delete_async(self, doc):
        cursor = await get_resource_service("planning").get_planning_by_agenda_id(doc.get(ID_FIELD))
        count = await cursor.count()

        if count > 0:
            raise SuperdeskApiError.badRequestError(
                message="Agenda is referenced by Planning items. " "Cannot delete Agenda"
            )

    def on_deleted(self, doc):
        push_notification("agenda:deleted", item=str(doc[ID_FIELD]))
