from typing import List, Dict, Any
from superdesk import get_resource_service
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


def get_matching_products(item: Dict[str, Any]) -> List[Dict[str, str]]:
    """Return a list of API product id's that the article matches."""

    result = get_resource_service("product_tests").test_products(item, lookup=None)
    return [{"code": p["product_id"], "name": p.get("name")} for p in result if p.get("matched", False)]
