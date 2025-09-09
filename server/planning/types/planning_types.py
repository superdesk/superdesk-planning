from datetime import datetime
from pydantic import Field
from typing import Annotated, Any

from superdesk.core.resources import ResourceModel, fields
from superdesk.utc import utcnow
from superdesk.core.resources.fields import ObjectId
from superdesk.core.resources.validators import validate_iunique_value_async, validate_data_relation_async


class PlanningTypesResourceModel(ResourceModel):
    # The name identifies the form in the UI to which the type relates
    name: Annotated[fields.Keyword, validate_iunique_value_async("planning_types", "name")]

    editor: dict[str, Any] = Field(
        default_factory=dict,
        description="Editor controls which fields are visible in the UI",
    )
    schema_config: dict[str, Any] = Field(
        alias="schema",
        default_factory=dict,
        description="Schema controls the validation of fields at the front end",
    )
    groups: dict[str, Any] = Field(
        default_factory=dict,
        description="List of groups (and their translations) for grouping of fields in the editor",
    )
    post_schema: dict[str, Any] = Field(
        alias="postSchema",
        default_factory=dict,
        description="Controls the validation of fields when posting",
    )
    list_fields_config: dict[str, Any] = Field(
        alias="list",
        default_factory=dict,
        description="List fields when seeing events/planning during export/download",
    )
    export_list: list[str] = Field(
        default_factory=list,
        description="Fields visible in exports or downloads for events/planning",
    )

    # Audit information
    created_by: Annotated[ObjectId, validate_data_relation_async("users")] | None = None
    updated_by: Annotated[ObjectId, validate_data_relation_async("users")] | None = None
    firstcreated: datetime = Field(default_factory=utcnow)
    versioncreated: datetime = Field(default_factory=utcnow)
    init_version: int | None = None
