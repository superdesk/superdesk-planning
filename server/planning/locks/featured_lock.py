from typing import Sequence
from quart_babel import gettext

from superdesk.core.resources import ResourceConfig, AsyncResourceService
from superdesk.core.utils import generate_guid, GUID_NEWSML
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow
from superdesk.notification import push_notification
from superdesk.lock import lock, unlock

from planning.types import PlanningFeaturedLockResource

from .common import get_current_session_id, get_current_user_id
from .views import planning_lock_endpoints

__all__ = ["planning_lock_endpoints", "planning_featured_lock_resource"]
LOCK_ID = "item_lock_planning_featured"


class PlanningFeaturedLockResourceService(AsyncResourceService[PlanningFeaturedLockResource]):
    async def _convert_dicts_to_model(
        self, docs: Sequence[PlanningFeaturedLockResource | dict]
    ) -> list[PlanningFeaturedLockResource]:
        num_of_docs = len(docs)
        if not num_of_docs:
            return []
        elif num_of_docs > 1:
            raise SuperdeskApiError.badRequestError(gettext("Can only request 1 lock at a time for Featured Stories"))

        doc = docs[0]
        if isinstance(doc, PlanningFeaturedLockResource):
            return [doc]

        # Given the current user and session, create the new lock details here
        user_id = get_current_user_id(required=True)
        session_id = get_current_session_id()
        return [
            PlanningFeaturedLockResource(
                id=generate_guid(type=GUID_NEWSML),
                lock_user=user_id,
                lock_session=session_id,
                lock_time=utcnow(),
                lock_action="featured",
            )
        ]

    async def validate_create(self, doc: PlanningFeaturedLockResource):
        user_id = get_current_user_id(required=True)
        session_id = get_current_session_id()

        async for existing_lock in await self.find({}):
            if existing_lock.lock_user != user_id:
                raise SuperdeskApiError.forbiddenError(
                    gettext("Featured stories already being managed by another user.")
                )
            elif existing_lock.lock_session != session_id:
                raise SuperdeskApiError.forbiddenError(
                    gettext("Featured stories already being managed by you in another session.")
                )

        # get the lock if not raise forbidden exception
        if not lock(LOCK_ID, expire=5):
            raise SuperdeskApiError.forbiddenError(message=gettext("Unable to obtain lock on Featured stories."))

        await super().validate_create(doc)

    async def on_created(self, docs: list[PlanningFeaturedLockResource]) -> None:
        user_id = get_current_user_id(required=True)
        session_id = get_current_session_id()
        unlock(LOCK_ID, remove=True)
        push_notification(
            "planning_featured_lock:lock",
            user=str(user_id),
            lock_session=str(session_id),
        )

    async def on_deleted(self, doc: PlanningFeaturedLockResource):
        user_id = get_current_user_id(required=True)
        session_id = get_current_session_id()
        push_notification(
            "planning_featured_lock:unlock",
            user=str(user_id),
            lock_session=str(session_id),
        )


planning_featured_lock_resource = ResourceConfig(
    name="planning_featured_lock",
    data_class=PlanningFeaturedLockResource,
    service=PlanningFeaturedLockResourceService,
)
