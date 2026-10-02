from typing import Annotated, Any
from enum import Enum, unique
from datetime import datetime

from pydantic import Field, model_validator, BaseModel
from quart_babel import gettext
from pytz.exceptions import UnknownTimeZoneError

from superdesk.core import get_config
from superdesk.core.resources import ResourceModel, fields
from superdesk.core.utils import generate_guid, GUID_NEWSML, str_to_date
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utc_to_local, local_to_utc

from ..enums import UpdateMethods
from .system import AuditInformation, IngestDetails, LockFields, SourceDetails, ItemSystemFields
from .schedule import ItemSchedule, ItemDates
from .metadata import ItemDescription, ItemMetadata, ItemExtraDetails, ItemContactDetails, RelatedItems
from .coverage import ItemCoverage, EmbeddedPlanningItem, CoverageItem, UNSET_COVERAGE_SCHEDULED


class FieldsNotStored(BaseModel):
    update_method: UpdateMethods | None = None
    planning_ids: list[fields.Keyword] | None = None
    failed_planning_ids: list[fields.Keyword] | None = None
    planning_item: fields.Keyword | None = Field(
        alias="_planning_item",
        description="Used when an Event is created from a Planning item, so we can link on the backend",
        default=None,
    )
    embedded_planning: Annotated[list[EmbeddedPlanningItem] | None, fields.mapping_disabled("object")] = Field(
        description="Used from the EmbeddedCoverage form in the Event editor",
        default=None,
    )
    associated_plannings: list[dict] | None = Field(
        description="Used to create an Event and Planning together in the one request", default=None
    )


@unique
class PlanningItemType(str, Enum):
    EVENT = "event"
    PLANNING = "planning"


class UnifiedPlanningResource(
    AuditInformation,
    IngestDetails,
    LockFields,
    SourceDetails,
    ItemSchedule,
    ItemDescription,
    ItemMetadata,
    ItemExtraDetails,
    ItemContactDetails,
    ItemSystemFields,
    ItemCoverage,
    RelatedItems,
    FieldsNotStored,
    ResourceModel,
):
    model_resource_name = "UnifiedPlanningResource"

    id: fields.Keyword = Field(validation_alias="_id", serialization_alias="_id", default="")
    item_type: PlanningItemType = Field(
        validation_alias="type",
        serialization_alias="type",
        description="Type of planning item represented by this resource",
    )
    extra: dict | None = Field(
        description="Additional custom data associated with the planning resource",
        default=None,
    )

    @model_validator(mode="before")
    @classmethod
    def populate_data(cls, data: "UnifiedPlanningResource | dict") -> "UnifiedPlanningResource | dict":
        if isinstance(data, UnifiedPlanningResource):
            return data

        if not data.get("guid") and not data.get("_id"):
            data["_id"] = data["guid"] = generate_guid(type=GUID_NEWSML)
        elif data.get("guid") and not data.get("_id"):
            data["_id"] = data["guid"]
        elif not data.get("guid") and data.get("_id"):
            data["guid"] = data["_id"]

        default_coverage_schedule = _get_default_coverage_schedule(data)
        data.pop("family_id", None)

        if data.get("type") == PlanningItemType.EVENT.value:
            # We don't currently support linking an Event to another Event
            data.pop("related_events", None)

        for coverage in data.get("coverages") or []:
            _set_coverage_default_values(coverage, default_coverage_schedule)

        return data

    @model_validator(mode="after")
    def validate_model_instance(self) -> "UnifiedPlanningResource":
        if self.item_type == PlanningItemType.EVENT:
            if not self.dates.start or not self.dates.end:
                raise SuperdeskApiError(message=gettext("Event START DATE and END DATE are mandatory."))
            if self.time_to_be_confirmed:
                if (
                    _get_local_date(self.dates.end, self.dates.tz).date()
                    < _get_local_date(self.dates.start, self.dates.tz).date()
                ):
                    raise SuperdeskApiError(message=gettext("END DATE should be after START DATE"))
            elif (
                self.dates.no_end_time
                and self.dates.end.date() < _get_local_date(self.dates.start, self.dates.tz).date()
            ):
                raise SuperdeskApiError(message=gettext("END TIME should be after START TIME"))
            elif not self.dates.no_end_time and self.dates.end < self.dates.start:
                raise SuperdeskApiError(message=gettext("END TIME should be after START TIME"))
            if (
                self.dates.recurring_rule
                and not self.dates.recurring_rule.until
                and not self.dates.recurring_rule.count
            ):
                raise SuperdeskApiError(message=gettext("Recurring event should have an end (until or count)"))

            max_duration = get_config(int, "MAX_MULTI_DAY_EVENT_DURATION", 365)
            if max_duration > 0:
                if (self.dates.end - self.dates.start).days > max_duration:
                    raise SuperdeskApiError(message=gettext(f"Event duration is greater than {max_duration} days."))

        elif self.item_type == PlanningItemType.PLANNING:
            if not self.dates.start:
                raise SuperdeskApiError(message=gettext("Planning item should have a date"))

        return self

    def clone_with(self, updates: dict[str, Any], **kwargs) -> "UnifiedPlanningResource":
        """
        Deeply clones the instance and applies updates with proper validation.

        Addresses limitations of Pydantic's `model_copy`, which doesn't handle
        nested data classes or validate updates the given updates.

        :param updates: Attributes to update in the cloned instance.
        :return: A new instance with the applied updates.
        """

        for coverage in updates.get("coverages") or []:
            if not coverage.get("assigned_to"):
                coverage["assigned_to"] = None
        return super().clone_with(updates, **kwargs)


def _get_local_date(date: datetime, tz: str | None) -> datetime:
    if tz is None:
        return date

    try:
        return utc_to_local(tz, date)
    except UnknownTimeZoneError:
        return date


def _get_default_coverage_schedule(data: dict) -> datetime:
    dates = data.get("dates") or {}
    tz_name = get_config(str, "DEFAULT_TIMEZONE")
    if isinstance(dates, ItemDates):
        if dates.all_day:
            return local_to_utc(tz_name, datetime(dates.start.year, dates.start.month, dates.start.day))
        return dates.start
    else:
        planning_date = str_to_date(dates.get("start"))
        if not planning_date:
            if data.get("type") == PlanningItemType.PLANNING.value:
                raise SuperdeskApiError(message=gettext("Planning item should have a date"))
            else:
                raise SuperdeskApiError(message=gettext("Event should have a start date"))

        if dates.get("all_day", False) is True:
            return local_to_utc(tz_name, datetime(planning_date.year, planning_date.month, planning_date.day))
        return planning_date


def _set_coverage_default_values(coverage: CoverageItem | dict, coverage_default_date: datetime) -> None:
    """Sets default values for the coverage object based on its type and the provided default date.

    The function updates the `coverage` object, ensuring it has a valid coverage ID and a properly
    set `scheduled` date. It also processes scheduled updates by assigning missing IDs and dates.
    The behavior varies depending on whether the `coverage` object is of type `CoverageItem` or
    a dictionary.

    :param coverage: The coverage object to update. It must be either an instance of `CoverageItem` or a dictionary.
    :param coverage_default_date: The default datetime that is assigned to `scheduled` if it is not already defined.
    """

    if isinstance(coverage, CoverageItem):
        if not coverage.coverage_id:
            coverage.coverage_id = f"tempId-{generate_guid(type=GUID_NEWSML)}"

        # Make sure the coverage has a ``scheduled`` date
        # If none was supplied (defaults to `UNSET_COVERAGE_SCHEDULED`), fallback to ``planning.dates.start``
        # A coverage's ``scheduled`` is always a real datetime with a timezone (stored in UTC),
        # unlike ``planning_date`` which may be a "floating" date for all day Planning items
        if (
            not coverage.planning
            or not coverage.planning.scheduled
            or coverage.planning.scheduled == UNSET_COVERAGE_SCHEDULED
        ):
            coverage.planning.scheduled = coverage_default_date

        for scheduled_update in coverage.scheduled_updates or []:
            if not scheduled_update.coverage_id:
                scheduled_update.coverage_id = coverage.coverage_id
            if not scheduled_update.planning or not scheduled_update.planning.scheduled:
                scheduled_update.planning.scheduled = coverage.planning.scheduled
    else:
        if not coverage.get("coverage_id"):
            coverage["coverage_id"] = f"tempId-{generate_guid(type=GUID_NEWSML)}"

        # Make sure the coverage has a ``scheduled`` date
        # If none was supplied (defaults to `UNSET_COVERAGE_SCHEDULED`), fallback to ``planning.dates.start``
        # A coverage's ``scheduled`` is always a real datetime with a timezone (stored in UTC),
        # unlike ``planning_date`` which may be a "floating" date for all day Planning items
        if (
            not coverage.get("planning")
            or not coverage["planning"].get("scheduled")
            or coverage["planning"]["scheduled"] == UNSET_COVERAGE_SCHEDULED
        ):
            coverage.setdefault("planning", {})["scheduled"] = coverage_default_date

        for scheduled_update in coverage.get("scheduled_updates") or []:
            if not scheduled_update.get("coverage_id"):
                scheduled_update["coverage_id"] = coverage["coverage_id"]
            if not scheduled_update.get("planning") or not scheduled_update["planning"].get("scheduled"):
                scheduled_update.setdefault("planning", {})["scheduled"] = coverage["planning"]["scheduled"]
