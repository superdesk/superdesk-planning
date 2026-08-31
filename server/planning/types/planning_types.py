from typing import Annotated, Any, assert_never
from enum import Enum, unique
import re

from quart_babel import gettext
from pydantic import Field
from pydantic_core import PydanticCustomError

from superdesk.core.resources import ResourceModelWithObjectId, fields
from superdesk.core.resources.fields import ObjectId

from .unified import AuditInformation


@unique
class PlanningProfileType(str, Enum):
    EVENT = "event"
    PLANNING = "planning"
    COVERAGE = "coverage"
    ADVANCED_SEARCH = "advanced_search"
    EVENT_POSTPONE = "event_postpone"
    EVENT_RESCHEDULE = "event_reschedule"
    EVENT_CANCEL = "event_cancel"
    PLANNING_CANCEL = "planning_planning_cancel"
    CANCEL_ALL_COVERAGES = "planning_cancel_all_coverage"
    CANCEL_COVERAGE = "coverage_cancel_coverage"


# ID used for when a PlanningProfile does not exist for a type and is generated from the default profile values
DEFAULT_PROFILE_ID = ObjectId("67be81e46f53273f423a2901")


async def validate_unique_profile_name(item: "PlanningProfileResource", name: str) -> None:
    if item.item_type not in (PlanningProfileType.EVENT, PlanningProfileType.PLANNING, PlanningProfileType.COVERAGE):
        # Name validation is only required for Events, Planning & Coverages
        return

    service = PlanningProfileResource.get_service()
    query: dict = {
        "_id": {"$ne": item.id},
        "name": re.compile("^{}$".format(re.escape(name.strip())), re.IGNORECASE),
        "type": item.item_type,
    }

    if await service.count(query, use_mongo=True):
        error_msg: str
        if item.item_type == PlanningProfileType.PLANNING:
            error_msg = gettext("Planning profile already exists with that name")
        elif item.item_type == PlanningProfileType.COVERAGE:
            error_msg = gettext("Coverage profile already exists with that name")
        else:
            error_msg = gettext("Event profile already exists with that name")

        raise PydanticCustomError("unique", error_msg)


async def validate_coverage_content_type(item: "PlanningProfileResource", content_type: str) -> None:
    if item.item_type == PlanningProfileType.COVERAGE and not content_type.strip():
        raise PydanticCustomError("empty", gettext("Coverage content_type is empty"))


class PlanningProfileResource(AuditInformation, ResourceModelWithObjectId):
    # The name identifies the form in the UI to which the type relates
    name: Annotated[fields.Keyword, validate_unique_profile_name, Field(description="Name of the PlanningProfile")]
    item_type: PlanningProfileType = Field(alias="type", description="The item type the PlanningProfile is used for")

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
    content_type: Annotated[str, validate_coverage_content_type] = Field(
        description="Content type name associated with the profile (for CoverageProfiles only)", default=""
    )

    init_version: int | None = None
