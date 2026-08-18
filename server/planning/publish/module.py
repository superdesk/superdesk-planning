import superdesk
from superdesk.factory.app import SuperdeskApp

from .events_post import EventsPostService, EventsPostResource
from .planning_post import PlanningPostService, PlanningPostResource
from .published_planning import PublishedPlanningResource, PublishedPlanningService


def init_publish_module(app: SuperdeskApp) -> None:
    events_post_service = EventsPostService("events_post", backend=superdesk.get_backend())
    EventsPostResource("events_post", app=app, service=events_post_service)

    planning_post_service = PlanningPostService("planning_post", backend=superdesk.get_backend())
    PlanningPostResource("planning_post", app=app, service=planning_post_service)

    endpoint_name = "published_planning"
    planning_published_service = PublishedPlanningService(endpoint_name, backend=superdesk.get_backend())
    PublishedPlanningResource(endpoint_name, app=app, service=planning_published_service)
