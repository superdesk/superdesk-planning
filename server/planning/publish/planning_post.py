# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import logging

from copy import deepcopy
from eve.utils import config

from superdesk.utc import utcnow
from superdesk.flask import abort
from superdesk import get_resource_service
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification

from planning.types import UnifiedPlanningResource
from planning.validate import validate_docs
from planning.planning import PlanningResource
from planning.common import (
    WORKFLOW_STATE,
    POST_STATE,
    UPDATE_SINGLE,
    UPDATE_ALL,
    get_item_post_state,
    get_version_item_for_post,
)
from planning.history.planning import UnifiedPlanningHistoryService
from planning.content_profiles.utils import is_cancel_planning_with_event_enabled
from planning.utils import get_related_event_items_for_planning_async
from planning.planning.planning_utils import delete_assignments_for_coverages

from .common import validate_post_state, validate_item_for_publish, enqueue_unified_planning


logger = logging.getLogger(__name__)


class PlanningPostResource(PlanningResource):
    schema = {
        "planning": {"type": "string", "required": True},
        "etag": {"type": "string", "required": True},
        "pubstatus": {"type": "string", "required": True, "allowed": tuple(POST_STATE)},
    }

    url = "planning/post"
    resource_title = endpoint_name = "planning_post"
    resource_methods = ["POST"]
    privileges = {"POST": "planning_planning_post"}
    item_methods = []


class PlanningPostService(AsyncBaseService):
    async def create_async(self, docs, **kwargs):
        ids = []
        assignments_to_delete = []
        cancel_plan_with_event_enabled = await is_cancel_planning_with_event_enabled()
        planning_service = UnifiedPlanningResource.get_service()
        for doc in docs:
            original = await planning_service.find_by_id(doc["planning"])
            if not original:
                abort(412)

            plan = original.to_dict()
            related_events = await get_related_event_items_for_planning_async(plan, "primary")

            if (
                cancel_plan_with_event_enabled
                and doc["pubstatus"] == POST_STATE.USABLE
                and any(1 for e in related_events if e.get("pubstatus") == POST_STATE.CANCELLED)
            ):
                raise SuperdeskApiError(message="Can't post the planning item as event is already unposted/cancelled.")
            await validate_item_for_publish(plan)
            # await self.validate_item(plan, related_events, doc["pubstatus"], cancel_plan_with_event_enabled)

            if kwargs.get("related_planning"):
                await self.validate_related_item(plan)

            validate_post_state(doc["pubstatus"])

            if doc["pubstatus"] == POST_STATE.USABLE:
                for related_event in related_events:
                    await self.post_associated_event(related_event)

            await self.post_planning(plan, doc["pubstatus"], assignments_to_delete, **kwargs)
            ids.append(doc["planning"])

        if assignments_to_delete:
            await delete_assignments_for_coverages(assignments_to_delete)
        return ids

    async def on_created_async(self, docs):
        for doc in docs:
            push_notification(
                "planning:posted",
                item=str(doc.get(config.ID_FIELD) or doc.get("planning")),
                etag=doc.get("_etag"),
                pubstatus=doc.get("pubstatus"),
            )

    @staticmethod
    async def validate_related_item(doc):
        errors_list = await validate_docs([{"validate_on_post": False, "type": "planning", "validate": doc}])
        errors = errors_list[0]

        if errors:
            return abort(400, description=["Related planning : " + error for error in errors])

    async def post_associated_event(self, event):
        """If the planning item is associated with an even that is not posted we need to post the event

        :param event_id:
        :return:
        """

        if not event or event.get("pubstatus"):
            return

        update_method = UPDATE_ALL if event.get("recurrence_id") else UPDATE_SINGLE
        await get_resource_service("events_post").post_async(
            [
                {
                    "event": event[config.ID_FIELD],
                    "etag": event["_etag"],
                    "update_method": update_method,
                    "pubstatus": "usable",
                }
            ]
        )

    async def post_planning(self, plan, new_post_state, assignments_to_delete, **kwargs):
        """Post a Planning item"""
        updates = {
            "state": get_item_post_state(plan, new_post_state),
            "pubstatus": new_post_state,
            "versionposted": utcnow(),
        }
        if updates["state"] in [WORKFLOW_STATE.SCHEDULED, WORKFLOW_STATE.KILLED]:
            updates["state_reason"] = None

        if new_post_state == POST_STATE.CANCELLED and len(plan.get("coverages", [])):
            updates["coverages"] = plan["coverages"]
            for coverage in updates["coverages"]:
                if coverage.get("assigned_to", {}).get("assignment_id"):
                    assignments_to_delete.append(deepcopy(coverage))
                    coverage["assigned_to"] = {}
                if coverage.get("workflow_status") != WORKFLOW_STATE.CANCELLED:
                    coverage["workflow_status"] = WORKFLOW_STATE.DRAFT
                    if coverage.get("planning", {}).pop("workflow_status_reason", None):
                        coverage["planning"]["workflow_status_reason"] = None

        updated_plan = await UnifiedPlanningResource.get_service().update(plan["_id"], updates, skip_signals=True)
        plan.update(updated_plan.to_dict())

        # Set a version number
        version, plan = get_version_item_for_post(plan)
        await enqueue_unified_planning(plan, version)

        # Save the version into the history
        updates["version"] = version
        await UnifiedPlanningHistoryService()._save_history(plan, updates, "post")
