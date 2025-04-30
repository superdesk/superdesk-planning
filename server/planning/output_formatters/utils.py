from superdesk import get_resource_service
from superdesk.publish_async.publish_cache import PublishCache
from superdesk.publish_async.utils import test_products_against_item
from planning.utils import try_cast_object_id


def expand_contact_info(contacts):
    """
    Given an item it will scan any event contacts, look them up and return the expanded values

    :param item:
    :return: Array of expanded contacts
    """
    remove_contact_fields = {"_etag", "_type"}
    expanded = []
    if not contacts:
        return expanded

    contact_details = get_resource_service("contacts").find(
        where={
            "_id": {"$in": [try_cast_object_id(c) for c in contacts]},
            "public": True,
            "is_active": True,
        }
    )

    if contact_details.count():
        for c_details in contact_details:
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
