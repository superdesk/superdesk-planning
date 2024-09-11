# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from copy import deepcopy

from eve.utils import config
from flask import request

from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.metadata.utils import item_url, generate_guid
from superdesk.metadata.item import GUID_NEWSML
from superdesk.utc import utcnow, utc_to_local

from planning.utils import get_related_event_links_for_planning, get_related_event_items_for_planning
from planning.common import (
    ITEM_STATE,
    WORKFLOW_STATE,
    TEMP_ID_PREFIX,
    get_coverage_status_from_cv,
    get_config_planning_duplicate_retain_assignee_details,
)


logger = logging.getLogger(__name__)


class PlanningDuplicateResource(Resource):
    endpoint_name = "planning_duplicate"
    resource_title = endpoint_name

    url = "planning/<{0}:item_id>/duplicate".format(item_url)

    resource_methods = ["POST"]
    item_methods = []

    privileges = {"POST": "planning_planning_management"}


class PlanningDuplicateService(BaseService):
    def create(self, docs, **kwargs):
        history_service = get_resource_service("planning_history")
        planning_service = get_resource_service("planning")

        parent_id = request.view_args["item_id"]
        parent_plan = planning_service.find_one(req=None, _id=parent_id)
        new_plan = self._duplicate_planning(parent_plan)

        planning_service.on_create([new_plan])
        planning_service.create([new_plan])

        history_service.on_duplicate(parent_plan, new_plan)
        history_service.on_duplicate_from(new_plan, parent_id)
        planning_service.on_duplicated(new_plan, parent_id)

        return [new_plan["guid"]]

    def _duplicate_planning(self, original):
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
                        events_to_remove.append(related_event[config.ID_FIELD])

                # Remove any of the Event's flagged to be removed from above
                if len(events_to_remove):
                    new_plan["related_events"] = [
                        related_event
                        for related_event in related_events
                        if related_event["_id"] not in events_to_remove
                    ]

        for f in (
            "_id",
            "guid",
            "lock_user",
            "lock_time",
            "original_creator",
            "_planning_schedule" "lock_session",
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

        planning_datetime = utc_to_local(config.DEFAULT_TIMEZONE, new_plan.get("planning_date"))
        local_datetime = utc_to_local(config.DEFAULT_TIMEZONE, utcnow())
        if planning_datetime.date() < local_datetime.date():
            new_plan["planning_date"] = new_plan["planning_date"] + (local_datetime.date() - planning_datetime.date())

        for cov in new_plan.get("coverages") or []:
            cov.get("planning", {}).pop("workflow_status_reason", None)
            cov.pop("scheduled_updates", None)
            cov.get("planning", {})["scheduled"] = new_plan.get("planning_date")
            cov["coverage_id"] = TEMP_ID_PREFIX + "duplicate"
            cov["workflow_status"] = WORKFLOW_STATE.DRAFT
            cov["news_coverage_status"] = get_coverage_status_from_cv("ncostat:int")
            cov["news_coverage_status"].pop("is_active", None)

            if not get_config_planning_duplicate_retain_assignee_details():
                cov.pop("assigned_to", None)

        return new_plan
