from planning.types import EventAutosaveResourceModel, PlanningAutosaveResourceModel
from superdesk.core.resources import AsyncResourceService
from superdesk.errors import SuperdeskApiError


class AutosaveAsyncService(AsyncResourceService):
    """Async Service class for the Autosave model."""

    async def on_create(self, docs: list[EventAutosaveResourceModel | PlanningAutosaveResourceModel]) -> None:
        await super().on_create(docs)

        for doc in docs:
            self._validate(doc)
            doc.expired = False

    async def on_delete(self, doc: EventAutosaveResourceModel | PlanningAutosaveResourceModel):
        from planning.events.events_service import EventsAsyncService

        await super().on_delete(doc)

        if doc.type == "event":
            events_service = EventsAsyncService()
            await events_service.delete_event_files({}, doc.files)

    @staticmethod
    def _validate(doc: EventAutosaveResourceModel | PlanningAutosaveResourceModel):
        """Validate the autosave to ensure it contains user/session"""

        if not doc.lock_user:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User not supplied")

        if not doc.lock_session:
            raise SuperdeskApiError.badRequestError(message="Autosave failed, User Session not supplied")
