from planning.types import PublishedPlanningModel
from planning.core.service import BasePlanningAsyncService


class PublishedAsyncService(BasePlanningAsyncService[PublishedPlanningModel]):
    resource_name = "published_planning"
