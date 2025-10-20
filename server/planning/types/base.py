from typing import Annotated

from superdesk.core.resources import ResourceModel, ResourceModelWithObjectId
from superdesk.core.resources.fields import ObjectId
from superdesk.core.resources.validators import validate_data_relation_async


class VersionCreatorMixin:
    original_creator: Annotated[ObjectId | None, validate_data_relation_async("users")] = None
    version_creator: Annotated[ObjectId | None, validate_data_relation_async("users")] = None


class BasePlanningModel(ResourceModel, VersionCreatorMixin):
    pass


class BasePlanningModelWithObjectId(ResourceModelWithObjectId, VersionCreatorMixin):
    pass
