from quart_babel import gettext

from superdesk.core.resources import AsyncResourceService, ResourceConfig, RestEndpointConfig
from superdesk.core.auth.privilege_rules import http_method_privilege_based_rules
from superdesk.errors import SuperdeskApiError
from superdesk.resource_fields import ID_FIELD
from superdesk.notification import push_notification
from apps.archive.common import get_user

from planning.types import PlanningTemplateResource, UnifiedPlanningResource
from planning.common import DUPLICATE_EVENT_IGNORED_FIELDS


class PlanningTemplatesResourceService(AsyncResourceService[PlanningTemplateResource]):
    async def on_create(self, docs: list[PlanningTemplateResource]) -> None:
        await super().on_create(docs)
        for doc in docs:
            if doc.data:
                raise SuperdeskApiError.badRequestError(
                    message=gettext("Request is not valid"), payload={"data": gettext("Data field is read-only")}
                )
            await self._fill_template_data(doc)

    async def on_created(self, docs: list[PlanningTemplateResource]) -> None:
        await super().on_created(docs)
        user = get_user()
        for doc in docs:
            push_notification("events-template:created", item=str(doc.id), user=str(user.get(ID_FIELD)))

    async def on_update(self, updates: dict, original: PlanningTemplateResource) -> None:
        await super().on_update(updates, original)

        if "data" in updates:
            raise SuperdeskApiError.badRequestError(
                message=gettext("Request is not valid"), payload={"data": gettext("Data field is read-only")}
            )

        # we can't change `based_on_event` id
        if "based_on_event" in updates and updates["based_on_event"] != original.based_on_event:
            raise SuperdeskApiError.badRequestError(
                message=gettext("Request is not valid"),
                payload={"based_on_event": gettext("This value can't be changed.")},
            )

    async def on_updated(self, updates: dict, original: PlanningTemplateResource) -> None:
        await super().on_updated(updates, original)
        user = get_user()
        push_notification("events-template:updated", item=str(original.id), user=str(user.get(ID_FIELD)))

    async def on_deleted(self, doc: PlanningTemplateResource) -> None:
        await super().on_deleted(doc)
        user = get_user()
        push_notification("events-template:deleted", item=str(doc.id), user=str(user.get(ID_FIELD)))

    async def _fill_template_data(self, template: PlanningTemplateResource) -> None:
        item = await UnifiedPlanningResource.get_service().find_by_id(template.based_on_event)
        if not item:
            raise SuperdeskApiError.badRequestError(gettext("Original item for template not found"))

        template.data.update(item.to_dict())
        template.data.pop("template", None)
        for field in DUPLICATE_EVENT_IGNORED_FIELDS:
            template.data.pop(field, None)


planning_templates_resource_config = ResourceConfig(
    name="events_template",
    data_class=PlanningTemplateResource,
    service=PlanningTemplatesResourceService,
    default_sort=[("template_name", 1)],
    rest_endpoints=RestEndpointConfig(
        resource_methods=["GET", "POST"],
        item_methods=["GET", "PATCH", "DELETE"],
        enable_cors=True,
        auth=http_method_privilege_based_rules(
            {
                "GET": "planning_event_management",
                "POST": "planning_event_templates",
                "DELETE": "planning_event_templates",
                "PATCH": "planning_event_templates",
            }
        ),
    ),
)
