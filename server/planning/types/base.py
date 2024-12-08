from typing import Annotated
from superdesk.core.resources import ResourceModel
from superdesk.core.resources.fields import ObjectId
from superdesk.core.resources.validators import validate_data_relation_async


class BasePlanningModel(ResourceModel):
    original_creator: Annotated[ObjectId, validate_data_relation_async("users")] | None = None
    version_creator: Annotated[ObjectId, validate_data_relation_async("users")] | None = None
