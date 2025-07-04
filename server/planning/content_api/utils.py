from superdesk.core.resources import ResourceCursorAsync, ResourceModel

from planning.types import ninjs3
from .types import PlanningCAPIParams


async def format_base_content_api_item(item: dict, subscribers: list[dict] | None) -> dict:
    return dict(
        _id=item.get("guid") or item["_id"],
        products=item["products"],
        subscribers=item.get("subscribers") or [subscriber["_id"] for subscriber in subscribers or []],
        firstcreated=item["firstcreated"],
        versioncreated=item["versioncreated"],
        version=item.get("version"),
        ingest_id=item.get("ingest_id"),
        recurrence_id=item.get("recurrence_id"),
        source=item.get("source"),
        original_source=item.get("original_source"),
        name=item.get("name"),
        anpa_category=item.get("anpa_category"),
        priority=item.get("priority"),
        subject=item.get("subject"),
        slugline=item.get("slugline"),
        language=item.get("language"),
        pubstatus=item.get("pubstatus"),
        place=item.get("place"),
        ednote=item.get("ednote"),
        extra=item.get("extra"),
    )


SYSTEM_FIELDS: set[str] = {
    "_created",
    "created",
    "_updated",
    "updated",
    "_etag",
    "etag",
    "_type",
    "type",
    "subscribers",
    "_planning_schedule",
    "planning_schedule",
}


def convert_capi_item_to_response_instance(item_instance: ResourceModel | dict) -> dict:
    if isinstance(item_instance, ResourceModel):
        item = item_instance.to_dict(
            exclude_none=True, exclude_unset=False, exclude_defaults=False, exclude=SYSTEM_FIELDS
        )
    else:
        item = item_instance
        # Projection is used, which means Pydantic validation may fail
        # Therefor we must use our own serialisation
        for field in SYSTEM_FIELDS:
            item.pop(field, None)

        # Remove null fields
        for field in list(item.keys()):
            if item[field] is None:
                item.pop(field, None)

    convert_event_dates_to_ninjs_3(item)
    return item


def convert_event_dates_to_ninjs_3(item: dict) -> None:
    """Converts the ``dates`` field for an Event from ``EventDates` to ``ninjs3.DatesObject`` type"""

    if item.get("type") != "event":
        # This is not an event
        return
    elif not item.get("dates"):
        # ``dates`` attribute is empty, make sure it's not there and return
        item.pop("dates", None)
        return

    # We have some date information. Convert it to the ninjs 3 version
    dates = ninjs3.DatesObject(
        startDate=item["dates"].get("start"),
        endDate=item["dates"].get("end"),
        timezone=item["dates"].get("tz"),
    )

    if item["dates"].get("no_end_time") and dates.endDate:
        dates.expectedEndDate = dates.endDate.strftime("%Y-%m-%d")
        dates.endDate = None

    item["dates"] = dates.to_dict(exclude_none=True)

    if recurring_rule := item["dates"].get("recurring_rule"):
        item["dates"]["recurrence"] = {
            "recurrenceRules": [
                {
                    key: getattr(recurring_rule, key)
                    for key in ("frequency", "interval", "until", "count")
                    if getattr(recurring_rule, key)
                }
            ]
        }


async def convert_cursor_to_response_items(cursor: ResourceCursorAsync, params: PlanningCAPIParams) -> list[dict]:
    if params.include_fields or params.exclude_fields:
        return [convert_capi_item_to_response_instance(item) for item in await cursor.to_list_raw()]
    else:
        return [convert_capi_item_to_response_instance(item) async for item in cursor]
