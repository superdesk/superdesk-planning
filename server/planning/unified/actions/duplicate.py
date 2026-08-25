# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Merged duplicate logic for Event & Planning items (SDBELGA-1119).

Only Planning items expose a dedicated ``duplicate`` action endpoint. Events are
duplicated client-side by creating a new item with ``duplicate_from`` set, which
is handled generically by ``UnifiedPlanningResourceService.on_created``.
"""

from copy import deepcopy
from typing import Any

from quart_babel import gettext as _

from superdesk.core import get_app_config
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.resource_fields import ID_FIELD
from superdesk.metadata.utils import generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk.utc import utcnow, utc_to_local

from planning.common import (
    ITEM_STATE,
    WORKFLOW_STATE,
    TEMP_ID_PREFIX,
    get_coverage_status_from_cv,
    get_config_planning_duplicate_retain_assignee_details,
    get_config_planning_duplicate_retain_coverage_status,
)
from planning.history.planning import UnifiedPlanningHistoryService
from planning.types.unified import PlanningItemType
from planning.utils import get_related_event_links_for_planning, get_related_event_items_for_planning


async def process_duplicate(original: dict[str, Any]) -> dict[str, Any]:
    if original.get("type") == PlanningItemType.EVENT.value:
        # Events duplicate via create-with-`duplicate_from`, not this endpoint
        raise SuperdeskApiError.badRequestError(
            message=_("Event duplication is performed via item creation, not the duplicate action.")
        )
    return await process_planning_item_duplicate(original)


def duplicate_planning_item(original: dict[str, Any]) -> dict:
    new_plan = deepcopy(original)
    related_events = get_related_event_links_for_planning(original)

    if len(related_events):
        if original.get("expired") or original.get(ITEM_STATE) == WORKFLOW_STATE.RESCHEDULED:
            # If the Planning item has expired, or has been rescheduled, and is associated with an Event
            # then we remove the link to the associated Events as the Event would have been expired also.
            new_plan["related_events"] = []
        elif original.get(ITEM_STATE) == WORKFLOW_STATE.CANCELLED:
            events_to_remove = []

            for related_event in get_related_event_items_for_planning(original):
                if related_event.get(ITEM_STATE) == WORKFLOW_STATE.CANCELLED:
                    # If both the Planning and Events are cancelled, then unlink this Event
                    events_to_remove.append(related_event[ID_FIELD])

            # Remove any of the Event's flagged to be removed from above
            if len(events_to_remove):
                new_plan["related_events"] = [
                    related_event for related_event in related_events if related_event["_id"] not in events_to_remove
                ]

    for f in (
        "_id",
        "guid",
        "lock_user",
        "lock_time",
        "original_creator",
        "_planning_schedule",
        "lock_session",
        "lock_action",
        "_created",
        "_updated",
        "_etag",
        "pubstatus",
        "expired",
        "featured",
        "state_reason",
        "_updates_schedule",
    ):
        new_plan.pop(f, None)

    new_plan[ITEM_STATE] = WORKFLOW_STATE.DRAFT
    new_plan["guid"] = generate_guid(type=GUID_NEWSML)

    default_timezone = get_app_config("DEFAULT_TIMEZONE")
    planning_datetime = utc_to_local(default_timezone, new_plan.get("planning_date"))
    local_datetime = utc_to_local(default_timezone, utcnow())
    if planning_datetime.date() < local_datetime.date():
        new_plan["planning_date"] = new_plan["planning_date"] + (local_datetime.date() - planning_datetime.date())

    for cov in new_plan.get("coverages") or []:
        cov.get("planning", {}).pop("workflow_status_reason", None)
        cov.pop("scheduled_updates", None)
        cov["coverage_id"] = TEMP_ID_PREFIX + "duplicate"
        cov["workflow_status"] = WORKFLOW_STATE.DRAFT

        # Only reset coverage scheduled time if it's in the past, similar to planning_date logic
        coverage_scheduled = cov.get("planning", {}).get("scheduled")
        if coverage_scheduled:
            coverage_datetime = utc_to_local(default_timezone, coverage_scheduled)
            if coverage_datetime.date() < local_datetime.date():
                cov.get("planning", {})["scheduled"] = new_plan.get("planning_date")

        if not get_config_planning_duplicate_retain_coverage_status():
            cov["news_coverage_status"] = get_coverage_status_from_cv("ncostat:int")
            cov["news_coverage_status"].pop("is_active", None)

        if not get_config_planning_duplicate_retain_assignee_details():
            cov["assigned_to"] = {}

        # Clear the assignment link so the duplicate gets its own assignment.
        cov.get("assigned_to", {}).pop("assignment_id", None)

    return new_plan


async def process_planning_item_duplicate(parent_plan: dict[str, Any]) -> dict[str, Any]:
    """
    Function to duplicate planning item.

    :param original: The original planning item.
    :return: List of new planning item guid.
    """
    planning_service = get_resource_service("planning")
    history_service = UnifiedPlanningHistoryService()

    parent_id = parent_plan[ID_FIELD]
    new_plan = duplicate_planning_item(parent_plan)

    await planning_service.on_create_async([new_plan])
    await planning_service.create_async([new_plan])

    await history_service.on_duplicate(parent_plan, new_plan)
    await history_service.on_duplicate_from(new_plan, parent_id)
    await planning_service.on_duplicated(new_plan, parent_id)

    return new_plan
