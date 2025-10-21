import logging

from bson import ObjectId

from superdesk import get_resource_service
from superdesk.core.resources import AsyncResourceService
from superdesk.errors import SuperdeskApiError

from planning.types import EventAutosaveResourceModel, PlanningAutosaveResourceModel


logger = logging.getLogger(__name__)


class AutosaveAsyncService(AsyncResourceService):
    """Async Service class for the Autosave model."""

    async def on_create(self, docs: list[EventAutosaveResourceModel | PlanningAutosaveResourceModel]) -> None:
        await super().on_create(docs)

        for doc in docs:
            self._validate(doc)
            doc.expired = False

    async def on_delete(self, doc: EventAutosaveResourceModel | PlanningAutosaveResourceModel):
        await super().on_delete(doc)

        # TODO-ASYNC: We should also delete Planning files on autosave delete as well
        # This can include:
        # * files
        # * coverages.planning.files
        # * coverages.planning.xmp_file
        if doc.item_type == "event" and doc.files:
            await get_resource_service("events").delete_event_files({}, doc.to_dict())

    @staticmethod
    def _validate(doc: EventAutosaveResourceModel | PlanningAutosaveResourceModel):
        """Validate the autosave to ensure it contains user/session"""

        if not doc.lock_user:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User not supplied")

        if not doc.lock_session:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User Session not supplied")


async def on_item_unlocked(resource: str, item: dict, user_id: ObjectId) -> None:
    # raise Exception("on_item_unlocked not implemented")
    if resource == "events":
        autosave_service = EventAutosaveResourceModel.get_service()
    elif resource == "planning":
        autosave_service = PlanningAutosaveResourceModel.get_service()
    else:
        return

    try:
        # Delete any autosave items associated with this item
        await autosave_service.delete_many(lookup={"_id": item["_id"]})
    except Exception as err:
        logger.exception(f"Failed to delete autosave item(s) ({err})")
