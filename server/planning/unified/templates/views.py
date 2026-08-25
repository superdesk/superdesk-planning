from pydantic import Field

from superdesk.core.types import Request, Response, RestGetResponse, RestResponseMeta
from superdesk.core.resources import BaseModel
from superdesk.core.web import EndpointGroup

from planning.types import UnifiedPlanningResource, PlanningTemplateResource


template_endpoints = EndpointGroup("planning_templates", __name__)


class RecentTemplateParams(BaseModel):
    limit: int = Field(default=5, description="The maximum number of recent templates to prefix on the list")


@template_endpoints.endpoint("recent_events_template", name="recent_events_template", methods=["GET"])
async def get_recent_templates_endpoint(args: None, params: RecentTemplateParams, request: Request) -> Response:
    pipeline: list[dict] = [
        {"$match": {"template": {"$ne": None}}},
        {
            "$group": {
                "_id": "$template",
                "last_used": {"$max": "$_created"},
            },
        },
        {"$sort": {"last_used": -1}},
        {"$limit": params.limit},
    ]

    resource_service = UnifiedPlanningResource.get_service()
    template_service = PlanningTemplateResource.get_service()
    templates_ids = [item["_id"] async for item in resource_service.mongo_async.aggregate(pipeline)]

    templates = [
        template async for template in await template_service.find({"_id": {"$in": templates_ids}}, use_mongo=True)
    ]

    # keep `templates_ids` ordering
    templates.sort(key=lambda template: templates_ids.index(template.id))

    # query not used templates
    templates += [
        template async for template in await template_service.find({"_id": {"$nin": templates_ids}}, use_mongo=True)
    ]

    num_of_templates = len(templates)
    response = RestGetResponse(
        _items=templates,
        _links=dict(
            self=dict(
                title="Recent Templates",
                href="recent_events_template",
            ),
        ),
        _meta=RestResponseMeta(page=1, max_results=num_of_templates, total=num_of_templates),
    )
    return Response(response, status_code=200)
