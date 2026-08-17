import logging

from quart_babel import gettext

from superdesk.core.resources import AsyncResourceService
from superdesk.errors import SuperdeskApiError

from planning.types import AutosaveResourceModel
from planning.unified.files import delete_item_files


logger = logging.getLogger(__name__)


class AutosaveAsyncService(AsyncResourceService[AutosaveResourceModel]):
    """Async Service class for the Autosave model."""

    async def on_create(self, docs: list[AutosaveResourceModel]) -> None:
        await super().on_create(docs)

        for doc in docs:
            doc.expired = False

    async def on_delete(self, doc: AutosaveResourceModel):
        await super().on_delete(doc)

        # TODO-PR: We should also delete Planning files on autosave delete as well
        # This can include:
        # * coverages.planning.files
        # * coverages.planning.xmp_file
        await delete_item_files(doc.item_type, doc.files)

    async def validate_create(self, doc: AutosaveResourceModel) -> None:
        """Validate the autosave to ensure it contains user/session"""

        await super().validate_create(doc)
        if not doc.lock_user:
            raise SuperdeskApiError.badRequestError(message=gettext("Autosave failed, User not supplied"))

        if not doc.lock_session:
            raise SuperdeskApiError.badRequestError(message=gettext("Autosave failed, User Session not supplied"))
