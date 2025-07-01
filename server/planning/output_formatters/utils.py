from superdesk import get_resource_service
from superdesk.publish_async.publish_cache import PublishCache
from superdesk.publish_async.utils import test_products_against_item

from planning.types import PlanningSchedule
from planning.utils import try_cast_object_id


async def expand_contact_info(contacts):
    """
    Given an item it will scan any event contacts, look them up and return the expanded values

    :param item:
    :return: Array of expanded contacts
    """
    remove_contact_fields = {"_etag", "_type"}
    expanded = []
    if not contacts:
        return expanded

    contacts_cursor = await get_resource_service("contacts").find_async(
        where={
            "_id": {"$in": [try_cast_object_id(c) for c in contacts]},
            "public": True,
            "is_active": True,
        }
    )

    for c_details in contacts_cursor:
        for f in remove_contact_fields:
            c_details.pop(f, None)

        # Remove any none public contact details
        c_details["contact_phone"] = [p for p in c_details.get("contact_phone", []) if p.get("public")]
        c_details["mobile"] = [p for p in c_details.get("mobile", []) if p.get("public")]
        expanded.append(c_details)

    return expanded


async def get_matching_products(item: dict) -> list[dict]:
    """Return a list of API product id's that the article matches."""

    await PublishCache.init()
    matches = test_products_against_item(item)
    return [{"code": p["product_id"], "name": p["name"]} for p in matches if p["matched"]]


async def format_base_content_api_item(item: dict) -> dict:
    return dict(
        _id=item.get("guid") or item["_id"],
        products=item["products"],
        subscribers=item["subscribers"],
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
