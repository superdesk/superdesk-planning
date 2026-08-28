from typing import Annotated
from pydantic import Field

from superdesk.core.resources import ResourceModelWithObjectId
from superdesk.core.resources.validators import (
    validate_not_empty,
    validate_unique_value_async,
    validate_data_relation_async,
)


class PlanningTemplateResource(ResourceModelWithObjectId):
    template_name: Annotated[
        str,
        validate_not_empty(),
        validate_unique_value_async(field_name="template_name"),
        Field(description="The name of the template"),
    ]
    based_on_event: Annotated[
        str,
        validate_data_relation_async("unified_planning"),
        Field(description="The ID of the item this template was created from"),
    ]
    data: dict = Field(
        default_factory=dict,
        description="The UnifiedResourcePlanning fields for use when creating items from this template",
    )
