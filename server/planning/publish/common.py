import logging
from copy import deepcopy

from superdesk import get_resource_service
from superdesk.flask import abort

from planning.common import get_contacts_from_item, enqueue_planning_item, POST_STATE
from planning.validate import validate_doc


__all__ = [
    "validate_post_state",
    "validate_item_for_publish",
    "enqueue_unified_planning",
]
logger = logging.getLogger(__name__)


def validate_post_state(new_post_state):
    try:
        assert new_post_state in tuple(POST_STATE)
    except AssertionError:
        abort(409)


async def validate_item_for_publish(item: dict) -> None:
    test_doc = deepcopy(item)
    item_type: str = item["type"]
    errors = await validate_doc(test_doc, item_type, validate_on_post=True)
    if errors:
        # We use abort here instead of raising SuperdeskApiError.badRequestError
        # as eve handles error responses differently between POST and PATCH methods
        abort(400, description=errors)

    if item.get("coverages"):
        for coverage in item["coverages"]:
            coverage_errors = await validate_doc(deepcopy(coverage), "coverage", validate_on_post=True)
            if coverage_errors:
                abort(400, description=errors)


async def enqueue_unified_planning(item: dict, version: int) -> None:
    await _remove_private_contacts_from_item(item)

    """Enqueue the items for publish"""
    version_id = await get_resource_service("published_planning").post_async(
        [
            {
                "item_id": item["_id"],
                "version": version,
                "type": item["type"],
                "published_item": item,
            }
        ]
    )
    if version_id:
        # Enqueue the item for publishing.
        await enqueue_planning_item(version_id[0])
    else:
        logger.error("Failed to save unified planning version for item {}".format(item["_id"]))


async def _remove_private_contacts_from_item(item: dict) -> None:
    # Check and remove private contacts while posting, only public contact will be visible
    public_contact_ids = [str(contact["_id"]) async for contact in await get_contacts_from_item(item)]

    if item.get("event_contact_info"):
        item["event_contact_info"] = [
            contact_id for contact_id in item["event_contact_info"] if str(contact_id) in public_contact_ids
        ]

    if item.get("coverages"):
        for coverage in item["coverages"]:
            contact_id = (coverage.get("planning") or {}).get("contact_info")
            if contact_id and str(contact_id) not in public_contact_ids:
                # This Contact is private and should be removed from the Coverage
                coverage["planning"].pop("contact_info")
