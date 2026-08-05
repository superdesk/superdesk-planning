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

from typing import List
from copy import deepcopy
from eve.utils import config

from superdesk.utc import utcnow
from superdesk.flask import abort
from superdesk.resource import Resource
from superdesk import get_resource_service, logger
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.notification import push_notification

from planning.validate import validate_docs
from planning.planning import PlanningResource
from planning.common import (
    WORKFLOW_STATE,
    POST_STATE,
    UPDATE_SINGLE,
    UPDATE_ALL,
    get_item_post_state,
    enqueue_planning_item,
    get_version_item_for_post,
    get_contacts_from_item,
)
from planning.planning.planning_history_async_service import PlanningHistoryAsyncService
from planning.content_profiles.utils import is_cancel_planning_with_event_enabled
from planning.utils import get_related_event_items_for_planning_async
from planning.types import Event, Planning

logger = logging.getLogger(__name__)


class PlanningPostResource(PlanningResource):
    schema = {
        # Disable data relation validation for now
        "planning": {"type": "string", "required": True},
        # "planning": Resource.rel("planning", type="string", required=True),
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
        for doc in docs:
            plan = await get_resource_service("planning").find_one_async(req=None, _id=doc["planning"])
            related_events = await get_related_event_items_for_planning_async(plan, "primary")

            await self.validate_item(plan, related_events, doc["pubstatus"], cancel_plan_with_event_enabled)

            if not plan:
                abort(412)

            if kwargs.get("related_planning"):
                await self.validate_related_item(plan)

            self.validate_post_state(doc["pubstatus"])

            if doc["pubstatus"] == POST_STATE.USABLE:
                for related_event in related_events:
                    await self.post_associated_event(related_event)

            await self.post_planning(plan, doc["pubstatus"], assignments_to_delete, **kwargs)
            ids.append(doc["planning"])

        await get_resource_service("planning").delete_assignments_for_coverages(assignments_to_delete)
        return ids

    async def on_created_async(self, docs):
        for doc in docs:
            push_notification(
                "planning:posted",
                item=str(doc.get(config.ID_FIELD) or doc.get("planning")),
                etag=doc.get("_etag"),
                pubstatus=doc.get("pubstatus"),
            )

    def validate_post_state(self, new_post_state):
        try:
            assert new_post_state in tuple(POST_STATE)
        except AssertionError:
            abort(409)

    @staticmethod
    async def validate_item(
        doc: Planning, related_events: List[Event], new_post_status: str, cancel_plan_with_event_enabled: bool
    ):
        if (
            cancel_plan_with_event_enabled
            and new_post_status == POST_STATE.USABLE
            and any(1 for e in related_events if e.get("pubstatus") == POST_STATE.CANCELLED)
        ):
            raise SuperdeskApiError(message="Can't post the planning item as event is already unposted/cancelled.")

        errors_list = await validate_docs([{"validate_on_post": True, "type": "planning", "validate": doc}])
        errors = errors_list[0]

        if errors:
            # We use abort here instead of raising SuperdeskApiError.badRequestError
            # as eve handles error responses differently between POST and PATCH methods
            abort(400, description=errors)

        if doc.get("coverages"):
            for coverage in doc["coverages"]:
                errors_list = await validate_docs(
                    [{"validate_on_post": True, "type": "coverage", "validate": coverage}]
                )
                errors = errors_list[0]
                if errors:
                    abort(400, description=errors)

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
        if event:
            update_method = UPDATE_ALL if event.get("recurrence_id") else UPDATE_SINGLE
            if event and event.get("pubstatus") is None:
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
                pass

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

        updated_plan = await get_resource_service("planning").update_async(
            plan["_id"], updates, plan, skip_signals=True
        )
        plan.update(updated_plan)

        # Set a version number
        version, plan = get_version_item_for_post(plan)
        await self.publish_planning(plan, version)

        # Save the version into the history
        updates["version"] = version
        await PlanningHistoryAsyncService()._save_history(plan, updates, "post")

    async def publish_planning(self, plan, version):
        # Check and remove private contacts while posting planning, only public contact will be visible
        public_contact_ids = [str(contact["_id"]) async for contact in await get_contacts_from_item(plan)]
        for coverage in plan.get("coverages") or []:
            if (coverage.get("planning") or {}).get("contact_info"):
                if str(coverage["planning"]["contact_info"]) not in public_contact_ids:
                    # This Contact is private and should be removed from the Coverage
                    coverage["planning"].pop("contact_info", None)

        """Enqueue the planning item"""
        # Create an entry in the planning versions collection for this published version
        version_id = await get_resource_service("published_planning").post_async(
            [
                {
                    "item_id": plan["_id"],
                    "version": version,
                    "type": "planning",
                    "published_item": plan,
                }
            ]
        )
        if version_id:
            # Enqueue the item for publishing.
            await enqueue_planning_item(version_id[0])
        else:
            logger.error("Failed to save planning version for planning item id {}".format(plan["_id"]))

    def _get_post_state(self, plan, new_post_state):
        if new_post_state == POST_STATE.CANCELLED:
            return WORKFLOW_STATE.KILLED

        if plan.get("pubstatus") != POST_STATE.USABLE:
            # posting for first time, default to 'schedule' state
            return WORKFLOW_STATE.SCHEDULED

        return plan.get("state")
