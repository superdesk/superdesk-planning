# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from copy import deepcopy

from quart_babel import gettext as _
from bson import ObjectId

from superdesk.core import get_config
from superdesk.resource_fields import ID_FIELD
from superdesk.flask import g
from superdesk import Resource, get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.item import ITEM_STATE, CONTENT_STATE
from planning.common import (
    ASSIGNMENT_WORKFLOW_STATE,
    get_related_items,
    get_coverage_for_assignment,
    update_assignment_on_link_unlink,
    get_next_assignment_status,
    get_delivery_publish_time,
    is_content_link_to_coverage_allowed,
    assignment_allows_multiple_content_linked,
)
from apps.archive.common import get_user, is_assigned_to_a_desk
from apps.content import push_content_notification
from superdesk.notification import push_notification
import logging
from planning.history.assignments import AssignmentsHistoryService

logger = logging.getLogger(__name__)


class AssignmentsLinkService(AsyncBaseService):
    async def on_create_async(self, docs):
        for doc in docs:
            await self._validate(doc)

    async def create_async(self, docs, **kwargs):
        ids = []
        production = get_resource_service("archive")

        for doc in docs:
            assignment = await get_resource_service("assignments").find_one_async(
                req=None, _id=doc.pop("assignment_id")
            )
            item_id = doc.pop("item_id")
            actioned_item = await production.find_one_async(req=None, _id=item_id)
            related_items = await get_related_items(actioned_item)
            ids = await self.link_archive_items_to_assignments(assignment, related_items, actioned_item, doc)

        return ids

    async def link_archive_items_to_assignments(self, assignment, related_items, actioned_item, doc):
        assignments_service = get_resource_service("assignments")
        delivery_service = get_resource_service("delivery")
        await assignments_service.validate_assignment_action(assignment)
        already_completed = assignment["assigned_to"]["state"] == ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        items = []
        ids = []
        deliveries = []
        published_updated_items = []
        updates = {"assigned_to": deepcopy(assignment.get("assigned_to"))}
        need_complete = False
        multiple_content_enabled = assignment_allows_multiple_content_linked(assignment)
        for item in related_items:
            if not item.get("assignment_id") or (item["_id"] == actioned_item.get("_id") and doc.get("force")):
                # Update the delivery for the item if one exists
                delivery = await delivery_service.find_one_async(req=None, item_id=item[ID_FIELD])
                if delivery:
                    await delivery_service.patch_async(
                        delivery["_id"],
                        {
                            "assignment_id": assignment["_id"],
                            "scheduled_update_id": assignment.get("scheduled_update_id"),
                        },
                    )
                else:
                    # Add a delivery for the item
                    deliveries.append(
                        {
                            "item_id": item[ID_FIELD],
                            "assignment_id": assignment.get(ID_FIELD),
                            "planning_id": assignment["planning_item"],
                            "coverage_id": assignment["coverage_item"],
                            "item_state": doc.get("item_state") or item.get("state"),
                            "sequence_no": item.get("rewrite_sequence") or 0,
                            "publish_time": get_delivery_publish_time(item),
                            "scheduled_update_id": assignment.get("scheduled_update_id"),
                        }
                    )

                if not doc.get("skip_archive_update", False):
                    # Update archive/published collection with assignment linking
                    await update_assignment_on_link_unlink(assignment[ID_FIELD], item, published_updated_items)

                ids.append(item.get(ID_FIELD))
                items.append(item)

                if (
                    not multiple_content_enabled
                    and item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED]
                    and not assignment.get("scheduled_update_id")
                    and assignment["assigned_to"]["state"] != ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                ):
                    # If assignment belongs to coverage, 'complete' it if any news item is published
                    need_complete = True

        # Create all deliveries
        if len(deliveries) > 0:
            await delivery_service.post_async(deliveries)

        assignment_was_updated = await self.update_assignment(
            updates,
            assignment,
            actioned_item,
            doc.pop("reassign", None),
            already_completed,
            need_complete,
            multiple_content_enabled,
        )
        actioned_item["assignment_id"] = assignment[ID_FIELD]
        doc.update(actioned_item)

        # Save assignment history
        # Update assignment history with all items affected
        if len(ids) > 0:
            updates["assigned_to"]["item_ids"] = ids
            if not assignment.get("scheduled_update_id"):
                await AssignmentsHistoryService().on_item_content_link(updates, assignment)

            if (
                not assignment_was_updated
                and (
                    actioned_item.get(ITEM_STATE) not in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED]
                    or already_completed
                )
                and not need_complete
            ):
                # publishing planning item
                await assignments_service.publish_planning(assignment["planning_item"])

        # Send notifications
        push_content_notification(items)
        push_notification(
            "content:link",
            item=str(actioned_item[ID_FIELD]),
            assignment=assignment[ID_FIELD],
        )
        return ids

    async def _validate(self, doc):
        assignment = await get_resource_service("assignments").find_one_async(req=None, _id=doc.get("assignment_id"))

        if not assignment:
            raise SuperdeskApiError.badRequestError(_("Assignment not found."))

        item = await get_resource_service("archive").find_one_async(req=None, _id=doc.get("item_id"))

        if not item:
            raise SuperdeskApiError.badRequestError(_("Content item not found."))

        if not is_content_link_to_coverage_allowed(item):
            raise SuperdeskApiError.badRequestError(
                _(
                    'Content type "%(content_type)s" is not allowed to be linked to a coverage',
                    content_type=item["type"],
                )
            )

        if not doc.get("force") and item.get("assignment_id"):
            raise SuperdeskApiError.badRequestError(
                _("Content is already linked to an assignment. Cannot link assignment and content.")
            )

        if not is_assigned_to_a_desk(item):
            raise SuperdeskApiError.badRequestError(_("Content not in workflow. Cannot link assignment and content."))

        if not item.get("rewrite_of") and not assignment_allows_multiple_content_linked(assignment):
            if await get_resource_service("delivery").count_async({"assignment_id": doc.get("assignment_id")}) > 0:
                raise SuperdeskApiError.badRequestError(
                    _("Content already exists for the assignment. Cannot link assignment and content.")
                )

            # scheduled update validation
            if assignment.get("scheduled_update_id"):
                raise SuperdeskApiError.badRequestError(
                    _("Only updates can be linked to a scheduled update assignment")
                )

        coverage = await get_coverage_for_assignment(assignment)
        allowed_states = [
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
            ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
        ]
        if (
            coverage
            and len(coverage.get("scheduled_updates") or []) > 0
            and str(assignment["_id"]) != str((coverage.get("assigned_to") or {}).get("assignment_id"))
        ):
            if (coverage.get("assigned_to") or {}).get("state") not in allowed_states:
                raise SuperdeskApiError("Previous coverage is not linked to content.")

            # Check all previous scheduled updated to be linked/completed
            for s in coverage.get("scheduled_updates"):
                assigned_to = s.get("assigned_to") or {}
                if str(assigned_to.get("assignment_id")) == str(doc.get("assignment_id")):
                    break

                if assigned_to.get("state") not in allowed_states:
                    raise SuperdeskApiError("Previous scheduled-update pending content-linking/completion")

    async def update_assignment(
        self,
        updates,
        assignment,
        actioned_item,
        reassign,
        already_completed,
        need_complete,
        multiple_content_enabled,
    ):
        # Update assignments, assignment history and publish planning
        # set the state to in progress if no item in the updates chain has ever been published
        updated = False
        if need_complete:
            updates["assigned_to"]["state"] = ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        elif not already_completed:
            new_state = (
                ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                if (
                    not multiple_content_enabled
                    and actioned_item.get(ITEM_STATE) in [CONTENT_STATE.PUBLISHED, CONTENT_STATE.CORRECTED]
                )
                else ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
            )
            updates["assigned_to"]["state"] = get_next_assignment_status(updates, new_state)
            updated = True

        # on fulfiling the assignment the user is assigned the assignment, for add to planning it is not
        if reassign and not multiple_content_enabled:
            user = get_user()
            if user and str(user.get(ID_FIELD)) != (assignment.get("assigned_to") or {}).get("user"):
                updates["assigned_to"]["user"] = str(user.get(ID_FIELD))
                updated = True

            # if the item & assignment are'nt on the same desk, move the assignment to the item desk
            if (assignment.get("assigned_to") or {}).get("desk") != str(actioned_item.get("task").get("desk")):
                updates["assigned_to"]["desk"] = str(actioned_item.get("task").get("desk"))
                updated = True

            # On a reassign if it was accepted clear the accept flag
            if assignment.get("accepted", False):
                updates["accepted"] = False
                updated = True

        if need_complete:
            await get_resource_service("assignments_complete").update_async(assignment[ID_FIELD], updates, assignment)
        if updated:
            await get_resource_service("assignments").patch_async(assignment[ID_FIELD], updates)

        return updated


class AssignmentsLinkResource(Resource):
    endpoint_name = resource_title = "assignments_link"
    url = "assignments/link"
    schema = {
        "assignment_id": {"type": "objectid", "required": True},
        "item_id": {"type": "string", "required": True},
        "item_state": {"type": "string"},
        "reassign": {"type": "boolean", "required": True},
        "force": {"type": "boolean"},
        "skip_archive_update": {"type": "boolean"},
    }

    resource_methods = ["POST"]
    item_methods = []

    privileges = {"POST": "archive"}


async def _get_assignment_for_content_duplicate(item: dict) -> dict | None:
    """Retrieve Assignment to link to the duplicate content item.

    If this item returns None, then the newly created duplicate item is not to be linked to an Assignment.
    Returns true if all of the following conditions are met:

    * ``ASSIGNMENT_LINK_DUPLICATE_CONTENT`` setting is enabled
    * The original item has ``assignment_id`` (linked to an Assignment)
    * Assignment with ``assignment_id`` exists
    * Item is not being duplicated to the personal space
    * Assignment has ``planning.multiple_content`` enabled

    :param: item: The content item where the Assignment is to be possibly linked to
    :return: Returns the assignment data if it exists and meets the criteria for multiple content
            link duplication. Otherwise, returns None.
    """

    if not get_config(bool, "ASSIGNMENT_LINK_DUPLICATE_CONTENT", False):
        return None

    assignment_id: ObjectId | None = item.get("assignment_id")
    if not assignment_id:
        return None
    elif not (item.get("task") or {}).get("desk"):
        return None

    assignment: dict | None = g.get("archive_assignment")
    if not assignment:
        assignment = await get_resource_service("assignments").find_one_async(req=None, _id=assignment_id)
        if not assignment:
            logger.warning(f"Failed to find assignment {assignment_id} for duplicated item {item['_id']}")
            return None
        g.archive_assignment = assignment

    if not assignment_allows_multiple_content_linked(assignment):
        return None

    return assignment


async def on_archive_item_duplicate(updated: dict, original: dict, operation: str) -> None:
    """Remove the ``assignment_id`` from the duplicated item.

    Before the duplicated item is to be created, check to see if the new item is to be linked to the same Assignment.
    If it is not, then remove the ``assignment_id`` from the duplicated item.
    """

    if not await _get_assignment_for_content_duplicate(updated):
        updated.pop("assignment_id", None)


async def on_archive_item_duplicated(updated: dict, original: dict, operation: str) -> None:
    """Link the newly created duplicated item to the Assignment."""

    assignment = await _get_assignment_for_content_duplicate(updated)
    if assignment:
        await get_resource_service("assignments_link").post_async(
            [
                {
                    "assignment_id": assignment["_id"],
                    "item_id": updated["_id"],
                    "reassign": False,
                    "force": True,  # Force the linking, even though this item has ``assignment_id``
                    "skip_archive_update": True,  # No need to update item, as we've already done this
                }
            ]
        )
