from superdesk.core.resources import ModelWithVersions
from planning.types import EventResourceModel
from planning.core.service import BasePlanningAsyncService

class ContentAPIEventResourceModel(EventResourceModel, ModelWithVersions):
    pass



class ContentAPIEventService(BasePlanningAsyncService[EventResourceModel]):
    pass