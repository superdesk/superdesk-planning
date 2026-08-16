# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Assignments"""

from typing import Dict, Any
from copy import deepcopy
import logging
from contextvars import ContextVar

from bson import ObjectId
from icalendar import Calendar, Event
from eve.utils import ParsedRequest
from quart_babel import lazy_gettext, gettext

import superdesk
from superdesk.eve_async.service import AsyncBaseService
from superdesk.core import json, get_current_app, get_app_config, get_config
from superdesk.resource_fields import ID_FIELD, ITEMS, ETAG, VERSION
from superdesk.flask import request
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.metadata.utils import item_url
from superdesk.metadata.item import (
    metadata_schema,
    ITEM_STATE,
    CONTENT_STATE,
    ITEM_TYPE,
)
from superdesk.resource import not_analyzed
from superdesk.notification import push_notification
from superdesk.users.services import current_user_has_privilege

from apps.archive.common import get_user, get_auth
from apps.duplication.archive_move import ITEM_MOVE
from apps.publish.content.common import ITEM_PUBLISH, ITEM_CORRECT, ITEM_KILL, ITEM_TAKEDOWN, ITEM_UNPUBLISH
from apps.content import push_content_notification
from apps.item_lock.components.item_lock import LOCK_SESSION, LOCK_ACTION

from planning.errors import AssignmentApiError
from planning.planning.planning_schema import coverage_schema, planning_schema
from planning.common import (
    ASSIGNMENT_WORKFLOW_STATE,
    assignment_workflow_state,
    remove_lock_information,
    is_locked_in_this_session,
    get_coverage_type_name,
    get_version_item_for_post,
    get_related_items,
    enqueue_planning_item,
    WORKFLOW_STATE,
    get_next_assignment_status,
    get_delivery_publish_time,
    TO_BE_CONFIRMED_FIELD,
    TO_BE_CONFIRMED_FIELD_SCHEMA,
    update_assignment_on_link_unlink,
    get_notify_self_on_assignment,
    planning_auto_assign_to_workflow,
    get_config_assignment_manual_reassignment_only,
    set_original_creator,
)

from planning.types import EventResourceModel, AssignmentResourceModel
from planning.planning_notifications import PlanningNotifications
from planning.common import format_address, get_assginment_name, assignment_allows_multiple_content_linked
from .assignments_history import ASSIGNMENT_HISTORY_ACTIONS
from .assignments_history_async import AssignmentsHistoryAsyncService
from planning.utils import (
    get_event_formatted_dates,
    get_formatted_contacts,
    update_event_item_with_translations_value,
    get_related_planning_for_events_async,
    get_related_event_ids_for_planning,
    get_first_related_event_id_for_planning,
    get_first_event_item_for_planning_id,
)
from planning.coverage_assignments import update_planning_from_assignment_changes
from planning.unified.coverages import remove_assignment_from_coverage
from planning.locks.unlock import unlock_item

logger = logging.getLogger(__name__)

# Disable data relation validation for now
planning_type = {"type": "string", "required": True}
# planning_type = deepcopy(superdesk.Resource.rel("planning", type="string", required=True))
# planning_type["mapping"] = not_analyzed
notification_source_ctx: ContextVar[str | None] = ContextVar("assignment_notification_source", default=None)


class AssignmentsService(AsyncBaseService):
    """Service class for the Assignments model."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._skip_planning_sync: bool = False

    async def _update_planning_coverages_from_assignment(self, assignment: dict) -> None:
        if self._skip_planning_sync:
            # Avoid clashing with planning updates that already manage coverages
            return

        await update_planning_from_assignment_changes(assignment)

    async def on_fetched_resource_archive(self, docs):
        await self._enhance_archive_items(docs.get(ITEMS, []))

    async def on_fetched_item_archive(self, doc):
        if doc.get("assignment_id"):
            assignment = await self.find_one_async(req=None, _id=doc["assignment_id"])
            if assignment:
                doc["assignment"] = assignment.get("assigned_to") or {}

    async def _enhance_archive_items(self, docs):
        ids = [str(item["assignment_id"]) for item in docs if item.get("assignment_id")]
        if len(ids):
            cursor = await self.get_from_mongo_async(req=None, lookup={"_id": {"$in": ids}})
            assignments = {str(item[ID_FIELD]): item async for item in cursor}

            for doc in docs:
                if doc.get("assignment_id") in assignments:
                    doc["assignment"] = assignments[doc["assignment_id"]].get("assigned_to") or {}

    async def on_fetched_async(self, docs):
        await self._enhance_assignments(docs.get("_items", []))

    async def on_fetched_item_async(self, doc):
        await self._enhance_assignments([doc])

    async def _enhance_assignments(self, docs):
        """Populate `item_ids` with ids for all linked Archive items for an Assignment"""
        assignment_archive_map: dict[str, tuple[list[str], list[dict]]] = {}
        async for item in await self.get_archive_links_for_assignments([doc.get(ID_FIELD) for doc in docs]):
            linked_item_ids, linked_items = assignment_archive_map.setdefault(str(item.get("assignment_id")), ([], []))
            linked_item_ids.append(str(item.get("guid")))
            linked_items.append(
                {
                    "_id": item.get("guid"),
                    "_type": item.get("_type"),
                    "event_id": item.get("event_id"),
                }
            )

        for doc in docs:
            self.set_type(doc, doc)

            try:
                linked_item_ids, linked_items = assignment_archive_map[str(doc.get("_id"))]
                doc["item_ids"] = linked_item_ids
                doc["linked_items"] = linked_items
            except KeyError:
                pass

    async def get_archive_links_for_assignments(self, assignment_ids):
        """
        Given an array of assignment id's return the matching items
        :param assignment_ids:
        :return:
        """
        query = {
            "query": {"bool": {"must": [{"terms": {"assignment_id": assignment_ids}}]}},
            "size": get_config(int, "ASSIGNMENTS_LINKED_ITEMS_SIZE", 500),
        }

        req = ParsedRequest()
        repos = "archive,published,archived"
        req.args = {
            "source": json.dumps(query),
            "repo": repos,
            "run_signals": False,
            "projections": json.dumps(["_id", "guid", "_type", "event_id", "assignment_id"]),
            "aggs": None,
        }
        return await get_resource_service("search").get_async(req=req, lookup=None, signals=False)

    async def get_archive_items_for_assignment(self, assignment):
        """Using the `search` resource service, retrieve the list of Archive items linked to the provided Assignment."""

        query = {
            "query": {
                "bool": {
                    "must": {"term": {"assignment_id": str(assignment[ID_FIELD])}},
                },
            },
            "size": get_config(int, "ASSIGNMENTS_LINKED_ITEMS_SIZE", 500),
        }

        req = ParsedRequest()
        repos = "archive,published,archived"
        req.args = {"source": json.dumps(query), "repo": repos}
        return await get_resource_service("search").get_async(req=req, lookup=None)

    @staticmethod
    def set_type(updates, original):
        if not original.get(ITEM_TYPE):
            updates[ITEM_TYPE] = "assignment"

    async def on_create_async(self, docs):
        for doc in docs:
            set_original_creator(doc)
            self.set_type(doc, {})
            await self.validate_assignment(doc, {})

            user = get_user()
            doc["version_creator"] = str(user.get(ID_FIELD)) if user else None

    async def on_created_async(self, docs):
        for doc in docs:
            await self._send_assignment_creation_notification(doc)
            await self._update_planning_coverages_from_assignment(doc)

        await AssignmentsHistoryAsyncService().on_item_created(docs)

    async def _send_assignment_creation_notification(self, doc):
        assignment_state = doc["assigned_to"].get("state")
        if assignment_state != ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            self.notify("assignments:created", doc, {})

            if assignment_state != ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
                await get_resource_service("planning").set_xmp_file_info(doc)
                await self.send_assignment_notification(doc, {})

    async def on_update_async(self, updates, original):
        self.set_type(updates, original)
        await self.validate_assignment(updates, original)
        if updates.get("assigned_to"):
            if not updates["assigned_to"].get("user"):
                # In case user was removed, make sure it's a null value
                updates["assigned_to"]["user"] = None
            else:
                # Moving from submitted to assigned after user assigned after desk submission
                if original.get("assigned_to")["state"] == ASSIGNMENT_WORKFLOW_STATE.SUBMITTED:
                    updates["assigned_to"]["state"] = get_next_assignment_status(
                        updates, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
                    )

        user = get_user()
        updates["version_creator"] = str(user.get(ID_FIELD)) if user else None
        remove_lock_information(updates)

    async def validate_assignment(self, updates: dict, original: dict) -> None:
        if original:
            await self.validate_assignment_action(original)

        assigned_to = updates.get("assigned_to") or {}
        if (assigned_to.get("user") or assigned_to.get("contact")) and planning_auto_assign_to_workflow():
            if not assigned_to.get("desk"):
                raise SuperdeskApiError.badRequestError(message=gettext("Assignment should have a desk."))

        multi_content_disabled = not assignment_allows_multiple_content_linked(original)
        desk_changed = original.get("assigned_to", {}).get("desk") != assigned_to.get("desk")
        in_progress_or_submitted = original.get("assigned_to", {}).get("state") in [
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
            ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
        ]
        if multi_content_disabled and desk_changed and in_progress_or_submitted:
            raise SuperdeskApiError.forbiddenError(
                message=gettext("Assignment linked to content. Desk reassignment not allowed.")
            )

    async def validate_assignment_action(self, assignment: dict) -> None:
        if assignment.get("_to_delete"):
            plan = await get_resource_service("planning").find_one_async(req=None, _id=assignment.get("planning_item"))
            state = "unposted" if (plan or {}).get("state") == WORKFLOW_STATE.KILLED else (plan or {}).get("state")
            raise SuperdeskApiError.forbiddenError(gettext("Action failed. Related planning item is {}").format(state))

    def notify(self, event_name, updates, original, source: str | None = None):
        # No notifications for 'draft' assignments
        if self.is_assignment_draft(updates, original):
            return

        # We set lock information to None if any update (patch) is triggered by user action.
        # In this case, we do not send lock_user from original item.
        # But, for system_update, we need to send lock_user of original item
        lock_user = original.get("lock_user")
        if "lock_user" in updates:
            lock_user = None

        doc = deepcopy(original)
        doc.update(updates)
        assigned_to = doc.get("assigned_to") or {}
        kwargs = {
            "item": doc.get(ID_FIELD),
            "etag": doc.get("_etag"),
            "coverage": doc.get("coverage_item"),
            "planning": doc.get("planning_item"),
            "assigned_user": assigned_to.get("user"),
            "assigned_date_user": assigned_to.get("assigned_date_user"),
            "assigned_desk": assigned_to.get("desk"),
            "assigned_date_desk": assigned_to.get("assigned_date_desk"),
            "assigned_contact": assigned_to.get("contact"),
            "user": doc.get("version_creator", doc.get("original_creator")),
            "original_assigned_desk": (original.get("assigned_to") or {}).get("desk"),
            "original_assigned_user": (original.get("assigned_to") or {}).get("user"),
            "assignment_state": assigned_to["state"],
            "lock_user": lock_user,
            "session": get_auth().get("_id"),
        }

        if source is not None:
            kwargs["source"] = source

        if event_name == "assignments:updated" and not updates.get("assigned_to") and updates.get("priority"):
            kwargs["priority"] = doc.get("priority")

        push_notification(event_name, **kwargs)

    async def on_updated_async(self, updates, original):
        source = notification_source_ctx.get()
        self.notify("assignments:updated", updates, original, source=source)
        await self.send_assignment_notification(updates, original)

        assignment = deepcopy(original)
        assignment.update(updates)
        await self._update_planning_coverages_from_assignment(assignment)

        # If Assignee details have changed, and the current request comes from an Assignment API endpoint
        # then re-publish the Planning item (So updated Assignment details are published to subscribers)
        current_request = get_current_app().get_current_request()
        assignee_details_changed = self.assignee_details_changed(updates, original)
        if assignee_details_changed and (current_request is None or "/planning" not in current_request.path):
            await self.publish_planning(original.get("planning_item"))

    def assignee_details_changed(self, updates: Dict[str, Any], original: Dict[str, Any]) -> bool:
        if "assigned_to" in updates:
            original_assigned_to = original.get("assigned_to") or {}
            updated_assigned_to = updates["assigned_to"] or {}

            for field in {"user", "desk", "state", "contact", "coverage_provider"}:
                if original_assigned_to.get(field) != updated_assigned_to.get(field):
                    return True

        if "priority" in updates and updates["priority"] != original.get("priority"):
            return True

        return False

    async def system_update_async(
        self,
        id,
        updates,
        original,
        skip_planning_sync: bool = False,
        notification_source: str | None = None,
        **kwargs,
    ):
        self._skip_planning_sync = skip_planning_sync
        updates_to_apply = deepcopy(updates)
        notification_source_token = notification_source_ctx.set(notification_source)
        try:
            rtn = await super().system_update_async(id, updates_to_apply, original, **kwargs)
            if self.is_assignment_being_activated(updates, original):
                doc = deepcopy(original)
                doc.update(updates)
                await self._send_assignment_creation_notification(doc)
                await AssignmentsHistoryAsyncService().on_item_add_to_workflow(updates, original)
            elif (
                original.get(LOCK_ACTION) != "content_edit"
                and updates.get("assigned_to")
                and updates.get("assigned_to").get("state") != ASSIGNMENT_WORKFLOW_STATE.CANCELLED
            ):
                app = get_current_app().as_any()
                await app.on_updated_assignments.call_async(updates, original)
        finally:
            notification_source_ctx.reset(notification_source_token)
            self._skip_planning_sync = False
        return rtn

    async def post_from_planning(self, docs):
        self._skip_planning_sync = True
        try:
            return await self.post_async(docs)
        finally:
            self._skip_planning_sync = False

    def is_assignment_modified(self, updates, original):
        """Checks whether the assignment is modified or not"""
        if "assigned_to" not in updates:
            return False
        updates_assigned_to = updates.get("assigned_to") or {}
        original_assigned_to = original.get("assigned_to") or {}
        return (
            updates_assigned_to.get("desk") != original_assigned_to.get("desk")
            or updates_assigned_to.get("user") != original_assigned_to.get("user")
            or updates_assigned_to.get("contact") != original_assigned_to.get("contact")
        )

    async def send_assignment_notification(self, updates, original=None, force=False):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if self.is_assignment_draft(updates, original):
            return

        # No assignment notification sent on start work
        if (
            original.get("assigned_to", {}).get("state") == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED
            and updates.get("assigned_to", {}).get("state") == ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
        ):
            return

        assigned_to = updates.get("assigned_to", {})
        assigned_to_user = None

        if assigned_to.get("user"):
            assigned_to_user = await get_resource_service("users").find_one_async(req=None, _id=assigned_to.get("user"))

        assignment_id = updates.get("_id") or assigned_to.get("assignment_id", "Unknown")
        if not original:
            original = {}
        else:
            assignment_id = original.get("_id")

        if not force and not self.is_assignment_modified(updates, original):
            return

        user = get_user()

        # Determine the name of the desk that the assigment has been allocated to
        assigned_to_desk = await get_resource_service("desks").find_one_async(req=None, _id=assigned_to.get("desk"))
        desk_name = assigned_to_desk.get("name") if assigned_to_desk else "Unknown"

        # Determine the display name of the assignee
        assignee = None
        if assigned_to.get("contact"):
            assigned_to_contact = get_resource_service("contacts").find_one(req=None, _id=assigned_to.get("contact"))
            if assigned_to_contact and len(assigned_to_contact.get("contact_email") or []):
                assignee = "{} {} ({})".format(
                    assigned_to_contact.get("first_name") or "",
                    assigned_to_contact.get("last_name") or "",
                    assigned_to_contact["contact_email"][0],
                )

        if assignee is None and assigned_to.get("user"):
            if assigned_to_user and assigned_to_user.get("slack_username"):
                assignee = "@" + assigned_to_user.get("slack_username")
            else:
                assignee = assigned_to_user.get("display_name") if assigned_to_user else "Unknown"

        coverage_type = updates.get("planning", original.get("planning", {})).get("g2_content_type", "")
        slugline = updates.get("planning", original.get("planning", {})).get("slugline", "with no slugline")
        coverage_status = updates.get("planning", original.get("planning", {})).get("news_coverage_status", {}) or {}

        client_url = get_app_config("CLIENT_URL")

        assignment = deepcopy(original)
        assignment.update(updates)
        planning_id = assignment.get("planning_item")

        if not planning_id:
            raise SuperdeskApiError.badRequestError(
                message="Unable to send notifications, planning_id not found on assignment",
                payload=dict(
                    assignment_id=assignment_id,
                ),
            )

        event_item = await get_first_event_item_for_planning_id(planning_id, "primary")
        if event_item:
            contacts = []
            for contact_id in event_item.get("event_contact_info", []):
                contact_details = get_resource_service("contacts").find_one(req=None, _id=contact_id)
                if contact_details:
                    contacts.append(contact_details)
            if len(contacts):
                event_item["event_contact_info"] = contacts

        # Allow to create the ICS object only if there is scheduled time in the assignment.
        # This situation won't be applicable in the production but only for the test cases.
        if not assignment["planning"].get("scheduled"):
            logger.error("Assignment has no scheduled date, cannot create an ICS file")
            event = {}
        else:
            # Create the ICS object to be added to the email usable in google calendar.
            ical = Calendar()
            scheduled_time = assignment["planning"]["scheduled"]
            app_name = get_app_config("APPLICATION_NAME")
            org_name = get_app_config("ORGANIZATION_NAME_ABBREVIATION") or get_app_config("ORGANIZATION_NAME")
            language = get_app_config("DEFAULT_LANGUAGE").upper()
            ical.add("PRODID", f"-//{app_name}//{org_name}//{language}")
            ical.add("VERSION", "2.0")

            UID = str(assignment["_id"])
            url = client_url + "#/workspace/assignments?assignment=" + UID
            summary = get_assginment_name(assignment)
            priority = assignment.get("priority")
            created = assignment["_created"]
            updated = assignment["_updated"]

            # Add an event to the ICS file
            event = Event()
            event["UID"] = UID
            event["CLASS"] = "PUBLIC"

            # Use Event start and End time based on Config
            app = get_current_app()
            if app.config.get("ASSIGNMENT_MAIL_ICAL_USE_EVENT_DATES") and event_item:
                event_dates = event_item["dates"]
                event["DTSTART"] = event_dates["start"].strftime("%Y%m%dT%H%M%SZ")
                event["DTEND"] = event_dates["end"].strftime("%Y%m%dT%H%M%SZ")
            else:
                event["DTSTART"] = scheduled_time.strftime("%Y%m%dT%H%M%SZ")
                event["DTEND"] = scheduled_time.strftime("%Y%m%dT%H%M%SZ")

            event[f"SUMMARY;LANGUAGE={language}"] = summary
            event["DESCRIPTION"] = assignment.get("description_text", "")
            event["PRIORITY"] = priority

            if event_item:
                if event_item.get("location"):
                    location = event_item["location"][0]
                    format_address(location)
                    formatted_location = (
                        location.get("name")
                        if not location.get("formatted_address")
                        else "{0}, {1}".format(location.get("name"), location["formatted_address"])
                    )
                    event["LOCATION"] = formatted_location

            event.add("CREATED", created)
            event.add("LAST-MODIFIED", updated)
            event.add("DTSTAMP", updated)
            event.add(
                "STATUS", "CANCELED" if assigned_to["state"] == ASSIGNMENT_WORKFLOW_STATE.CANCELLED else "CONFIRMED"
            )
            event["URL"] = url

            ical.add_component(event)

            # Add the ICS object to the assignment
            assignment["planning"]["ics_data"] = ical.to_ical().decode("utf-8")

        # get formatted contacts and event date time for email templates
        formatted_contacts = get_formatted_contacts(event_item) if event_item else []
        fomatted_event_date = get_event_formatted_dates(event_item) if event_item else ""

        event_item = (
            update_event_item_with_translations_value(event_item, assignment.get("planning", {}).get("language"))
            if event_item
            else None
        )

        if event_item and event_item.get("related_items"):
            coverage_language = assignment.get("planning", {}).get("language")
            event_item["related_items"] = [
                article for article in event_item["related_items"] if article.get("language") == coverage_language
            ]

        # The assignment is to an external contact or a user
        if assigned_to.get("contact") or assigned_to.get("user"):
            # If it is a reassignment
            meta_msg = "assignment_details_internal_email" if assigned_to.get("user") else "assignment_details_email"
            if original.get("assigned_to"):
                # it is being reassigned by the original assignee, notify the new assignee
                if original.get("assigned_to", {}).get("user", "") == str(user.get(ID_FIELD, None)):
                    await PlanningNotifications().notify_assignment(
                        target_user=assigned_to.get("user"),
                        message="assignment_reassigned_1_msg",
                        meta_message=meta_msg,
                        coverage_type=get_coverage_type_name(coverage_type),
                        news_coverage_status=coverage_status.get("label", ""),
                        slugline=slugline,
                        desk=desk_name,
                        client_url=client_url,
                        assignment_id=assignment_id,
                        assignment=assignment,
                        event=event_item,
                        is_link=True,
                        contact_id=assigned_to.get("contact"),
                        contacts=formatted_contacts,
                        location=event.get("LOCATION", ""),
                        event_date_time=fomatted_event_date,
                    )
                    # notify the desk
                    if assigned_to.get("desk"):
                        await PlanningNotifications().notify_assignment(
                            target_desk=assigned_to.get("desk"),
                            message="assignment_reassigned_3_msg",
                            meta_message=meta_msg,
                            assignee=assignee,
                            client_url=client_url,
                            assignment_id=assignment_id,
                            desk=desk_name,
                            assignor=user.get("display_name"),
                            assignment=assignment,
                            event=event_item,
                            omit_user=True,
                            is_link=True,
                            contacts=formatted_contacts,
                            location=event.get("LOCATION", ""),
                            event_date_time=fomatted_event_date,
                        )

                else:
                    # if it was assigned to a desk before, test if there has been a change of desk
                    if original.get("assigned_to") and original.get("assigned_to").get("desk") != updates.get(
                        "assigned_to"
                    ).get("desk"):
                        # Determine the name of the desk that the assigment was allocated to
                        assigned_from_desk = await get_resource_service("desks").find_one_async(
                            req=None, _id=original.get("assigned_to").get("desk")
                        )
                        desk_from_name = assigned_from_desk.get("name") if assigned_from_desk else "Unknown"
                        assigned_from = original.get("assigned_to")
                        assigned_from_user = await get_resource_service("users").find_one_async(
                            req=None, _id=assigned_from.get("user")
                        )
                        old_assignee = assigned_from_user.get("display_name") if assigned_from_user else ""
                        await PlanningNotifications().notify_assignment(
                            target_desk=assigned_to.get("desk"),
                            target_desk2=original.get("assigned_to").get("desk"),
                            target_user=assigned_to.get("user"),
                            message="assignment_reassigned_2_msg",
                            meta_message=meta_msg,
                            coverage_type=get_coverage_type_name(coverage_type),
                            news_coverage_status=coverage_status.get("label", ""),
                            slugline=slugline,
                            assignee=assignee,
                            desk=desk_name,
                            old_assignee=old_assignee,
                            client_url=client_url,
                            assignment_id=assignment_id,
                            old_desk=desk_from_name,
                            assignor=user.get("display_name"),
                            assignment=assignment,
                            event=event_item,
                            omit_user=True,
                            is_link=True,
                            contact_id=assigned_to.get("contact"),
                            contacts=formatted_contacts,
                            location=event.get("LOCATION", ""),
                            event_date_time=fomatted_event_date,
                        )
                    else:
                        # it is being reassigned by someone else so notify both the new assignee and the old
                        await PlanningNotifications().notify_assignment(
                            target_user=original.get("assigned_to").get("user"),
                            target_desk=(
                                original.get("assigned_to").get("desk")
                                if original.get("assigned_to").get("user") is None
                                else None
                            ),
                            message="assignment_reassigned_3_msg",
                            meta_message=meta_msg,
                            coverage_type=get_coverage_type_name(coverage_type),
                            news_coverage_status=coverage_status.get("label", ""),
                            slugline=slugline,
                            assignee=assignee,
                            client_url=client_url,
                            assignment_id=assignment_id,
                            desk=desk_name,
                            assignor=user.get("display_name"),
                            assignment=assignment,
                            event=event_item,
                            omit_user=True,
                            is_link=True,
                            contact_id=original.get("assigned_to").get("contact"),
                            contacts=formatted_contacts,
                            location=event.get("LOCATION", ""),
                            event_date_time=fomatted_event_date,
                        )
                        # notify the assignee
                        assigned_from = original.get("assigned_to")
                        assigned_from_user = await get_resource_service("users").find_one_async(
                            req=None, _id=assigned_from.get("user")
                        )
                        old_assignee = assigned_from_user.get("display_name") if assigned_from_user else None
                        await PlanningNotifications().notify_assignment(
                            target_user=assigned_to.get("user"),
                            message="assignment_reassigned_4_msg",
                            meta_message=meta_msg,
                            coverage_type=get_coverage_type_name(coverage_type),
                            news_coverage_status=coverage_status.get("label", ""),
                            slugline=slugline,
                            assignor=user.get("display_name", ""),
                            old_assignee=" from " + old_assignee if old_assignee else "",
                            client_url=client_url,
                            assignment_id=assignment_id,
                            desk=desk_name,
                            event=event_item,
                            assignment=assignment,
                            omit_user=True,
                            is_link=True,
                            contact_id=assigned_to.get("contact"),
                            contacts=formatted_contacts,
                            location=event.get("LOCATION", ""),
                            event_date_time=fomatted_event_date,
                        )
            else:  # A new assignment
                # Notify the user the assignment has been made to unless assigning to your self
                if str(user.get(ID_FIELD, None)) != assigned_to.get("user", "") or get_notify_self_on_assignment():
                    await PlanningNotifications().notify_assignment(
                        target_user=assigned_to.get("user"),
                        message="assignment_assigned_msg",
                        meta_message=meta_msg,
                        coverage_type=get_coverage_type_name(coverage_type),
                        news_coverage_status=coverage_status.get("label", ""),
                        slugline=slugline,
                        client_url=client_url,
                        assignment_id=assignment_id,
                        assignor=(
                            lazy_gettext("by ") + user.get("display_name", "")
                            if str(user.get(ID_FIELD, None)) != assigned_to.get("user", "")
                            else lazy_gettext("to yourself")
                        ),
                        assignment=assignment,
                        event=event_item,
                        omit_user=True,
                        is_link=True,
                        contact_id=assigned_to.get("contact"),
                        contacts=formatted_contacts,
                        location=event.get("LOCATION", ""),
                        event_date_time=fomatted_event_date,
                    )
        else:  # Assigned/Reassigned to a desk, notify all desk members
            # if it was assigned to a desk before, test if there has been a change of desk
            if original.get("assigned_to") and original.get("assigned_to").get("desk") != updates.get(
                "assigned_to", {}
            ).get("desk"):
                # Determine the name of the desk that the assigment was allocated to
                assigned_from_desk = await get_resource_service("desks").find_one_async(
                    req=None, _id=original.get("assigned_to").get("desk")
                )
                desk_from_name = assigned_from_desk.get("name") if assigned_from_desk else "Unknown"
                if original.get("assigned_to", {}).get("user", "") == str(user.get(ID_FIELD, None)):
                    await PlanningNotifications().notify_assignment(
                        target_desk=assigned_to.get("desk"),
                        message="assignment_to_desk_msg",
                        meta_message="assignment_details_email",
                        coverage_type=get_coverage_type_name(coverage_type),
                        news_coverage_status=coverage_status.get("label", ""),
                        slugline=slugline,
                        assign_type="reassigned",
                        client_url=client_url,
                        assignment_id=assignment_id,
                        desk=desk_name,
                        assignor=user.get("display_name"),
                        assignment=assignment,
                        event=event_item,
                        omit_user=True,
                        is_link=True,
                        contact_id=assigned_to.get("contact"),
                        contacts=formatted_contacts,
                        location=event.get("LOCATION", ""),
                        event_date_time=fomatted_event_date,
                    )
                else:
                    await PlanningNotifications().notify_assignment(
                        target_desk=assigned_to.get("desk"),
                        target_desk2=original.get("assigned_to").get("desk"),
                        message="assignment_submitted_msg",
                        meta_message="assignment_details_email",
                        coverage_type=get_coverage_type_name(coverage_type),
                        news_coverage_status=coverage_status.get("label", ""),
                        slugline=slugline,
                        desk=desk_name,
                        client_url=client_url,
                        assignment_id=assignment_id,
                        from_desk=desk_from_name,
                        assignment=assignment,
                        event=event_item,
                        is_link=True,
                        contact_id=assigned_to.get("contact"),
                        contacts=formatted_contacts,
                        location=event.get("LOCATION", ""),
                        event_date_time=fomatted_event_date,
                    )
            else:
                assign_type = "reassigned" if original.get("assigned_to") else "assigned"
                await PlanningNotifications().notify_assignment(
                    target_desk=assigned_to.get("desk"),
                    message="assignment_to_desk_msg",
                    meta_message="assignment_details_email",
                    coverage_type=get_coverage_type_name(coverage_type),
                    news_coverage_status=coverage_status.get("label", ""),
                    slugline=slugline,
                    assign_type=assign_type,
                    client_url=client_url,
                    assignment_id=assignment_id,
                    desk=desk_name,
                    assignor=user.get("display_name"),
                    assignment=assignment,
                    event=event_item,
                    omit_user=True,
                    is_link=True,
                    contact_id=assigned_to.get("contact"),
                    contacts=formatted_contacts,
                    location=event.get("LOCATION", ""),
                    event_date_time=fomatted_event_date,
                )

    async def send_assignment_cancellation_notification(
        self, assignment, original_state, event_cancellation=False, event_reschedule=False
    ):
        """Set the assignment information and send notification

        :param dict doc: Updates related to assignments
        """
        # No notifications for 'draft' assignments
        if not assignment or original_state == ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            return

        # No notifications on event reschedule
        if event_reschedule:
            return

        user = get_user()
        assigned_to = assignment.get("assigned_to")
        slugline = assignment.get("planning").get("slugline", "")
        coverage_type = assignment.get("planning").get("g2_content_type", "")

        news_coverage_status = assignment.get("planning").get("news_coverage_status", {})
        desk = await get_resource_service("desks").find_one_async(req=None, _id=assigned_to.get("desk"))
        if event_cancellation:
            await PlanningNotifications().notify_assignment(
                target_user=assigned_to.get("user"),
                target_desk=assigned_to.get("desk") if not assigned_to.get("user") else None,
                message="assignment_event_cancelled_msg",
                slugline=slugline,
                coverage_type=get_coverage_type_name(coverage_type),
                news_coverage_status=news_coverage_status.get("label", ""),
                contact_id=assigned_to.get("contact"),
            )
            return
        await PlanningNotifications().notify_assignment(
            target_user=assigned_to.get("user"),
            target_desk=assigned_to.get("desk") if not assigned_to.get("user") else None,
            message="assignment_cancelled_desk_msg",
            user=str(
                user.get("display_name", lazy_gettext("Unknown"))
                if str(user.get(ID_FIELD, None)) != assigned_to.get("user")
                else lazy_gettext("You")
            ),
            omit_user=True,
            slugline=slugline,
            desk=desk.get("name"),
            coverage_type=get_coverage_type_name(coverage_type),
            news_coverage_status=news_coverage_status.get("label", ""),
            assignment_id=assignment.get(ID_FIELD),
            contact_id=assigned_to.get("contact"),
        )

    async def send_acceptance_notification(self, assignment):
        """
        On an external acceptance of an assignment send a notification to the assignor

        :param assignment:
        :return:
        """
        assigned_to = assignment.get("assigned_to")

        if assigned_to.get("state") != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            return

        slugline = assignment.get("planning").get("slugline", "")
        coverage_type = assignment.get("planning").get("g2_content_type", "")
        news_coverage_status = assignment.get("planning").get("news_coverage_status", {})
        target_user = assigned_to.get("assignor_user")

        assignee_name = ""
        user_id = assigned_to.get("user")
        if user_id:
            assigned_to_user = await get_resource_service("users").find_one_async(req=None, _id=assigned_to.get("user"))
            assignee_name = assigned_to_user.get("display_name")
        else:
            contact = superdesk.get_resource_service("contacts").find_one(
                req=None, _id=ObjectId(assigned_to.get("contact"))
            )
            assignee_name = contact.get("first_name") + " " + contact.get("last_name")

        await PlanningNotifications().notify_assignment(
            target_user=target_user,
            slugline=slugline,
            coverage_type=coverage_type,
            message="assignment_accepted_msg",
            user=assignee_name,
            omit_user=True,
            news_coverage_status=news_coverage_status.get("label", ""),
        )

    async def cancel_assignment(self, original_assignment, coverage, event_cancellation=False, event_reschedule=False):
        coverage_to_copy = deepcopy(coverage)
        if original_assignment:
            updated_assignment = {"assigned_to": {}}
            updated_assignment["assigned_to"].update(original_assignment.get("assigned_to"))
            updated_assignment.get("assigned_to")["state"] = get_next_assignment_status(
                updated_assignment, ASSIGNMENT_WORKFLOW_STATE.CANCELLED
            )
            updated_assignment["planning"] = coverage_to_copy.get("planning")
            updated_assignment["planning"]["news_coverage_status"] = coverage_to_copy.get("news_coverage_status")
            updated_assignment["planning"]["workflow_status_reason"] = coverage_to_copy["planning"].get(
                "workflow_status_reason"
            )

            if original_assignment.get("assigned_to")["state"] in [
                ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
            ]:
                # unlink the archive item from assignment
                archive_item = await get_resource_service("archive").find_one_async(
                    req=None, assignment_id=original_assignment.get(ID_FIELD)
                )
                if archive_item and archive_item.get("assignment_id"):
                    await get_resource_service("assignments_unlink").post_async(
                        [
                            {
                                "item_id": archive_item.get(ID_FIELD),
                                "assignment_id": original_assignment.get(ID_FIELD),
                                "cancel": True,
                            }
                        ]
                    )

            await self.system_update_async(
                ObjectId(original_assignment.get("_id")),
                updated_assignment,
                original_assignment,
            )

            # Save history
            await AssignmentsHistoryAsyncService().on_item_updated(
                updated_assignment,
                original_assignment,
                ASSIGNMENT_HISTORY_ACTIONS.CANCELLED,
            )
            self.notify("assignments:updated", updated_assignment, original_assignment)
            await self.send_assignment_cancellation_notification(
                updated_assignment,
                original_assignment.get("assigned_to")["state"],
                event_cancellation,
                event_reschedule,
            )

    def _get_empty_updates_for_assignment(self, assignment):
        updated_assignment = {"assigned_to": {}}
        updated_assignment.get("assigned_to").update(assignment.get("assigned_to"))
        return updated_assignment

    def _set_user_for_assignment(self, assignment, assignee, assignor=None):
        updates = self._get_empty_updates_for_assignment(assignment)

        if not get_config_assignment_manual_reassignment_only():
            updates["assigned_to"]["user"] = assignee

            if assignor:
                updates["assigned_to"]["assignor_user"] = assignor

        return updates

    async def _get_assignment_data_on_archive_update(self, updates, original):
        assignment_id = original.get("assignment_id")
        item_user_id = updates.get("version_creator")
        item_desk_id = updates.get("task", {}).get("desk")
        assignment = None
        if assignment_id:
            assignment = await self.find_one_async(req=None, _id=assignment_id)

        return {
            "assignment_id": assignment_id,
            "item_user_id": str(item_user_id),
            "item_desk_id": str(item_desk_id),
            "assignment": assignment,
        }

    async def update_assignment_on_archive_update(self, updates, original):
        if not original.get("assignment_id"):
            return

        assignment_update_data = await self._get_assignment_data_on_archive_update(updates, original)
        current_assignment = assignment_update_data.get("assignment") or {}
        current_assigned_to = current_assignment.get("assigned_to") or {}
        if not current_assignment or current_assigned_to.get("user") == assignment_update_data.get("item_user_id"):
            return

        assignment_updates = self._set_user_for_assignment(
            current_assignment,
            assignment_update_data.get("item_user_id"),
        )
        assignment_updates["assigned_to"]["state"] = get_next_assignment_status(
            current_assignment, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS
        )

        update_required = False
        for field in ("user", "assignor_user", "state"):
            if current_assigned_to.get(field, "") != assignment_updates["assigned_to"].get(field, ""):
                update_required = True
                break

        if update_required:
            await self._update_assignment_and_notify(assignment_updates, current_assignment)
            await AssignmentsHistoryAsyncService().on_item_updated(
                assignment_updates, assignment_update_data.get("assignment", {})
            )

    async def update_assignment_on_archive_operation(self, updates, original, operation=None):
        # Only continue processing for operations we handle
        if operation not in [
            ITEM_MOVE,
            ITEM_PUBLISH,
            ITEM_CORRECT,
            ITEM_KILL,
            ITEM_TAKEDOWN,
            ITEM_UNPUBLISH,
        ]:
            return

        # Get the Assignment item, if none is found then no need to continue processing this operation
        assignment_update_data = await self._get_assignment_data_on_archive_update(updates, original)
        assignment = assignment_update_data.get("assignment")
        if not assignment:
            return

        if operation == ITEM_MOVE:
            if assignment.get("assigned_to")["desk"] != assignment_update_data.get("item_desk_id"):
                updated_assignment = self._set_user_for_assignment(
                    assignment, None, assignment_update_data.get("item_user_id")
                )

                if not assignment_allows_multiple_content_linked(assignment):
                    updated_assignment.get("assigned_to")["desk"] = assignment_update_data.get("item_desk_id")
                    updated_assignment.get("assigned_to")["assignor_user"] = assignment_update_data.get("item_user_id")
                    updated_assignment.get("assigned_to")["state"] = get_next_assignment_status(
                        updated_assignment, ASSIGNMENT_WORKFLOW_STATE.SUBMITTED
                    )

                await self._update_assignment_and_notify(updated_assignment, assignment)
                await AssignmentsHistoryAsyncService().on_item_updated(
                    updated_assignment, assignment, ASSIGNMENT_HISTORY_ACTIONS.SUBMITTED
                )
        elif operation == ITEM_PUBLISH:
            updated_assignment = self._get_empty_updates_for_assignment(assignment)
            if updates.get(ITEM_STATE, original.get(ITEM_STATE, "")) != CONTENT_STATE.SCHEDULED:
                # Update delivery record here
                delivery_service = get_resource_service("delivery")
                delivery = await delivery_service.find_one_async(req=None, item_id=original[ID_FIELD])
                if delivery and delivery.get("item_state") != CONTENT_STATE.PUBLISHED:
                    await delivery_service.patch_async(
                        delivery[ID_FIELD],
                        {
                            "item_state": CONTENT_STATE.PUBLISHED,
                            "sequence_no": original.get("rewrite_sequence") or 0,
                            "publish_time": get_delivery_publish_time(updates, original),
                        },
                    )

                multiple_content_allowed = assignment_allows_multiple_content_linked(assignment)
                if (
                    not multiple_content_allowed
                    and updated_assignment.get("assigned_to")["state"] != ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                ):
                    updated_assignment.get("assigned_to")["state"] = get_next_assignment_status(
                        updated_assignment, ASSIGNMENT_WORKFLOW_STATE.COMPLETED
                    )

                    # Remove lock information as the archive item is unlocked when publishing
                    remove_lock_information(updated_assignment)

                    # Update the Assignment and send websocket notification
                    await self._update_assignment_and_notify(updated_assignment, assignment)
                    await AssignmentsHistoryAsyncService().on_item_complete(updated_assignment, assignment)
                else:
                    # publish planning
                    await self.publish_planning(assignment.get("planning_item"))

                if not multiple_content_allowed and not original.get("rewrite_of"):
                    # Send assignment completed notification
                    assigned_to_user = await get_resource_service("users").find_one_async(
                        req=None, _id=get_user().get(ID_FIELD, "")
                    )
                    assignee = assigned_to_user.get("display_name") if assigned_to_user else "Unknown"
                    target_user = assignment.get("assigned_to", {}).get("assignor_desk")

                    await PlanningNotifications().notify_assignment(
                        target_user=target_user,
                        message="assignment_complete_msg",
                        assignee=assignee,
                        coverage_type=get_coverage_type_name(original.get("planning", {}).get("g2_content_type", "")),
                        slugline=original.get("slugline"),
                        omit_user=True,
                        assignment_id=assignment["_id"],
                        is_link=True,
                        no_email=True,
                    )
        elif operation in [ITEM_CORRECT, ITEM_KILL, ITEM_TAKEDOWN, ITEM_UNPUBLISH]:
            # Make sure to unlock the Assignment on any of the above operations
            # As the `publish` service(s) unlocks the archive item on update
            user_id = assignment_update_data.get("item_user_id")
            if assignment.get(LOCK_SESSION) and user_id:
                await unlock_item(AssignmentResourceModel.from_dict(assignment))

    async def on_events_updated(self, updates: dict[str, Any], original: EventResourceModel):
        """Send assignment notifications if any relevant Event metadata has changed"""

        event = deepcopy(original.to_dict())
        event.update(updates)
        plannings = await get_related_planning_for_events_async([event[ID_FIELD]], "primary")

        if not plannings:
            # If this Event has no associated Planning items
            # then there is no need to send notifications
            return

        changed_fields = []

        for field in ["location", "event_contact_info", "files", "links"]:
            if (updates.get(field) or []) != (original.get(field) or []):
                changed_fields.append(field)

        if not changed_fields:
            # If no relevant Event fields have changed
            # then there is no need to send notifications
            return

        for planning in plannings:
            for coverage in planning.get("coverages") or []:
                assigned_to = coverage.get("assigned_to") or {}

                slugline = (coverage.get("planning") or {}).get("slugline") or ""
                coverage_type = (coverage.get("planning") or {}).get("g2_content_type") or ""

                await PlanningNotifications().notify_assignment(
                    coverage_status=(coverage.get("assigned_to") or {}).get("state"),
                    target_user=assigned_to.get("user"),
                    target_desk=assigned_to.get("desk") if not assigned_to.get("user") else None,
                    message="assignment_event_metadata_msg",
                    slugline=slugline,
                    coverage_type=get_coverage_type_name(coverage_type),
                    event=event,
                    client_url=get_app_config("CLIENT_URL"),
                    no_email=True,
                    contact_id=assigned_to.get("contact"),
                )

    async def create_delivery_for_content_update(self, items):
        """Duplicates the coverage/assignment for the archive rewrite

        If any errors occur at this point in time, the rewrite is still created
        with an error notification shown in the browser.
        """
        archive_service = get_resource_service("archive")
        delivery_service = get_resource_service("delivery")
        planning_service = get_resource_service("planning")
        assignment_link_service = get_resource_service("assignments_link")

        for doc in items:
            item = await archive_service.find_one_async(req=None, _id=doc.get(ID_FIELD))
            original_item = await archive_service.find_one_async(req=None, _id=item.get("rewrite_of"))

            # Skip items not linked to an Assignment/Coverage
            if not original_item.get("assignment_id"):
                continue

            delivery = await delivery_service.find_one_async(req=None, item_id=original_item[ID_FIELD])
            if not delivery:
                raise SuperdeskApiError.badRequestError(gettext("Delivery record not found."))

            planning = await planning_service.find_one_async(req=None, _id=delivery.get("planning_id"))
            if not planning:
                raise SuperdeskApiError.badRequestError(gettext("Planning does not exist"))

            coverage = None
            coverages = planning.get("coverages") or []
            try:
                coverage = next(c for c in coverages if c.get("coverage_id") == delivery.get("coverage_id"))
            except StopIteration:
                raise SuperdeskApiError.badRequestError(gettext("Coverage does not exist"))

            # Link only if linking updates are enabled
            if (coverage.get("flags") or {}).get("no_content_linking"):
                return

            # get latest assignment available to link
            assignment_id = (coverage.get("assigned_to") or {}).get("assignment_id")
            for s in coverage.get("scheduled_updates") or []:
                if (s.get("assigned_to") or {}).get("state") in [
                    ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                    ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
                ]:
                    assignment_id = (s.get("assigned_to") or {}).get("assignment_id")

            assignment = await self.find_one_async(req=None, _id=str(assignment_id))
            if not assignment:
                raise SuperdeskApiError.badRequestError(gettext("Assignment not found."))

            await assignment_link_service.post_async(
                [
                    {
                        "assignment_id": str(assignment[ID_FIELD]),
                        "item_id": str(item[ID_FIELD]),
                        "reassign": True,
                    }
                ]
            )

            doc["assignment_id"] = assignment["_id"]

    async def unlink_assignment_on_delete_archive_rewrite(self):
        # Because this is in response to a Resource level DELETE, we need to get the
        # item ID from the request args, then retrieve the item using that ID
        item_id = request.view_args["original_id"]
        doc = await get_resource_service("archive").find_one_async(req=None, _id=item_id)

        if not doc.get("assignment_id"):
            return

        assignment_id = doc["assignment_id"]
        assignment = await self.find_one_async(req=None, _id=assignment_id)
        if not assignment:
            logger.error(f"Failed to find assignment '{assignment_id}' for archive item '{item_id}'")
            return

        await get_resource_service("assignments_unlink").post_async(
            [{"assignment_id": assignment_id, "item_id": item_id}]
        )
        await self.publish_planning(assignment["planning_item"])

    async def _update_assignment_and_notify(self, updates, original):
        await self.system_update_async(original.get(ID_FIELD), updates, original)

        # send notification
        self.notify("assignments:updated", updates, original)

    async def _get_assignment_from_archive_item(self, updates, original):
        if not original.get("assignment_id"):
            return None

        assignment_update_data = await self._get_assignment_data_on_archive_update({}, original)
        if not assignment_update_data.get("assignment"):
            return None

        return assignment_update_data.get("assignment")

    def can_work_on_content(self, _item, _user_id):
        """Check if user can work on assignment content (lock/unlock for content operations).

        This requires only the archive privilege, as working on content means creating/editing archive items.
        Used for: start_working action, content_edit action, and unlocking assignments.
        """
        if not current_user_has_privilege("archive"):
            return False, lazy_gettext("User does not have sufficient permissions.")
        return True, ""

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege("planning_planning_management"):
            return False, lazy_gettext("User does not have sufficient permissions.")
        return True, ""

    async def on_delete_async(self, doc):
        """
        Validate that we have a lock on the Assignment and it's associated Planning item
        """
        if doc.get("_to_delete") is True or not request:
            # Already marked for delete - no validation needed (could be the background job)
            return

        # Also make sure the Planning item is locked by this user and session
        planning_service = get_resource_service("planning")
        planning_item = await planning_service.find_one_async(req=None, _id=doc.get("planning_item"))

        if not planning_item:
            raise SuperdeskApiError.badRequestError(message=gettext("Failed to find Planning item."))

        # Make sure either the Assignment or Planning item is locked by this user and session
        assignment_linked_to_coverage = any(
            True
            for coverage in planning_item.get("coverages") or []
            if str((coverage.get("assigned_to") or {}).get("assignment_id")) == str(doc["_id"])
        )
        if assignment_linked_to_coverage and not is_locked_in_this_session(doc):
            raise SuperdeskApiError.forbiddenError(message=gettext("Lock is not obtained on the Assignment item"))

        # Make sure the content linked to assignment (if) is also not locked
        # This is needed when the planing item is being unposted/spiked
        archive_items = await self.get_archive_items_for_assignment(doc)
        async for archive_item in archive_items:
            if archive_item.get("lock_user") and not is_locked_in_this_session(archive_item):
                raise SuperdeskApiError.forbiddenError(message=gettext("Associated archive item is locked"))

        # Make sure we cannot delete a completed Assignment
        # This should not be needed, as you cannot obtain a lock on an Assignment that is completed
        # But keeping it here for completeness
        if doc["assigned_to"].get("state") == ASSIGNMENT_WORKFLOW_STATE.COMPLETED:
            raise AssignmentApiError.cannotDeleteAssignmentError(
                "Cannot delete a completed Assignment {}".format(doc.get("planning", {}).get("slugline"))
            )

    async def archive_delete_assignment(self, doc):
        """
        Make sure to clean up the Archive, Delivery and Planning items by:

        * Remove 'assignment_id' from Archive item (if linked)
        * Delete the Delivery record associated with the Assignment & Archive items (if linked)
        * Removing 'assigned_to' dictionary from the associated Coverage
        """
        archive_service = get_resource_service("archive")
        delivery_service = get_resource_service("delivery")
        assignment_id = doc.get(ID_FIELD)

        # If we have a Content Item linked, then we need to remove the
        # assignment_id from it and remove the delivery record
        # Then send a notification that the content has been updated
        related_items = []
        archive_item = await archive_service.find_one_async(req=None, assignment_id=assignment_id)
        if archive_item:
            related_items = await get_related_items(archive_item, doc)
            for item in related_items:
                await update_assignment_on_link_unlink(None, item)
                push_notification(
                    "assignments:removed",
                    item=item[ID_FIELD] if item else None,
                    session=get_auth().get("_id"),
                )

            if len(related_items) > 0:
                # Push content nofitication so connected clients can update the
                # content views (i.e. removes the Calendar icon from Monitoring)
                push_content_notification(related_items)

            # Now delete all deliveries for that assignment
            await delivery_service.delete_action_async(lookup={"assignment_id": ObjectId(assignment_id)})

    async def on_deleted_async(self, doc, update_planning: bool = True):
        deleted_assignments = [doc.get(ID_FIELD)]
        await self.archive_delete_assignment(doc)
        marked_for_delete = False
        # Delete all assignments in that coverage
        cursor = await get_resource_service("assignments").get_from_mongo_async(
            req=None, lookup={"coverage_item": doc["coverage_item"]}
        )
        async for a in cursor:
            if str(a["_id"]) != str(doc["_id"]):
                await self.delete_async(lookup={"_id": a["_id"]})
                await self.archive_delete_assignment(a)
                deleted_assignments.append(a.get(ID_FIELD))
                if a.get("_to_delete"):
                    marked_for_delete = True

        # Remove assignment information from coverage
        if update_planning:
            updated_planning = await remove_assignment_from_coverage(doc)
        else:
            updated_planning = doc

        # Finally send a notification to connected clients that the Assignment
        # has been removed
        archive_item = await get_resource_service("archive").find_one_async(req=None, assignment_id=doc.get(ID_FIELD))
        if updated_planning:
            push_notification(
                "assignments:removed",
                item=archive_item[ID_FIELD] if archive_item else None,
                assignments=deleted_assignments,
                planning=doc.get("planning_item"),
                coverage=doc.get("coverage_item"),
                planning_etag=updated_planning.get(ETAG),
                event_ids=get_related_event_ids_for_planning(updated_planning),
                session=get_auth().get("_id"),
            )
        if not doc.get("_to_delete") or marked_for_delete:
            # publish planning
            await self.publish_planning(doc.get("planning_item"))

    def is_assignment_draft(self, updates, original):
        return updates.get("assigned_to", original.get("assigned_to")).get("state") == ASSIGNMENT_WORKFLOW_STATE.DRAFT

    def is_assignment_being_activated(self, updates, original):
        return (original.get("assigned_to") or {}).get("state") == ASSIGNMENT_WORKFLOW_STATE.DRAFT and (
            updates.get("assigned_to") or {}
        ).get("state") == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED

    async def is_text_assignment(self, assignment):
        # scheduled_update is always for text coverages
        if assignment.get("scheduled_update_id"):
            return True

        text_assignment = False
        content_types = await get_resource_service("vocabularies").find_one_async(req=None, _id="g2_content_type")
        if content_types:
            content_type = [
                t
                for t in (content_types.get("items") or [])
                if t.get("qcode") == assignment.get("planning", {}).get("g2_content_type")
            ]
            if len(content_type) > 0:
                text_assignment = (content_type[0].get("content item type") or content_type[0].get("qcode")) == "text"

        return text_assignment

    async def publish_planning(self, planning_id):
        """Publish the planning item if assignment state changes for following actions

        - Work is started on Assignment
        - Assignment link using fullfill assignment
        - Un-linking the item from assignment
        - Complete an Assignment
        - Revert Availability of an assignment
        - Remove Assignment

        It uses the last published planning item from the published_planning collection
        to re-transmit the coverage/assignment changes.
        :param  planning_id: planning ID
        """
        try:
            planning_service = get_resource_service("planning")
            published_service = get_resource_service("published_planning")

            planning_item = await planning_service.find_one_async(req=None, _id=planning_id) if planning_id else None
            published_planning_item = (
                await published_service.get_last_published_item(planning_id) if planning_id else None
            )

            if not planning_item or not published_planning_item or planning_item.get("state") == WORKFLOW_STATE.KILLED:
                return

            async def _publish_planning(item):
                item.pop(VERSION, None)
                item.pop("item_id", None)
                version, item = get_version_item_for_post(item)

                # Create an entry in the planning versions collection for this published version
                version_id = await published_service.post_async(
                    [
                        {
                            "item_id": item["_id"],
                            "version": version,
                            "type": "planning",
                            "published_item": item,
                        }
                    ]
                )
                if version_id:
                    # Enqueue the item for publishing.
                    await enqueue_planning_item(version_id[0])
                else:
                    logger.error("Failed to save planning version for planning item id {}".format(item["_id"]))

            await _publish_planning(planning_item)
        except Exception:
            logger.exception("Failed to publish assignment for planning.")

    async def accept_assignment(self, assignment_id, assignee):
        """Mark an assignment as accepted

        Set the accept flag in the assignment to true, assuming the assignment is assigned and the assignee is the one
        accepting the assignment. The assignee could be either a Superdesk user or a Contact

        :param assignment_id:
        :param assignee:
        :return:
        """

        # Fetch the assignment to ensure that it exists and is in a state that it makes sense to flag as accepted
        original = await self.find_one_async(req=None, _id=ObjectId(assignment_id))
        if not original:
            raise Exception("Accept Assignment unable to locate assignment {}".format(assignment_id))

        if (original.get("assigned_to") or {}).get("state") != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
            raise Exception("Assignment {} is not in assigned state".format(assignment_id))

        # try to find a user that the assignment is being accepted by
        user_service = superdesk.get_resource_service("users")
        user = await user_service.find_one_async(req=None, _id=ObjectId(assignee))
        if not user:
            # no user try to find a contact
            contact_service = superdesk.get_resource_service("contacts")
            contact = contact_service.find_one(req=None, _id=ObjectId(assignee))
            if contact:
                # make sure it is the assigned contact accepting the assignment
                if str(contact.get(ID_FIELD)) != str(original.get("assigned_to", {}).get("contact")):
                    raise Exception("Attempt to accept assignment by contact that it is not assigned to")
            else:
                raise Exception(
                    "Unknown User or Contact accepting assignment: {}, user/contact: {}".format(assignment_id, assignee)
                )
        else:
            # make sure that the assignment is still assigned to the user that is accepting the assignment
            if str(user.get(ID_FIELD)) != str(original.get("assigned_to", {}).get("user")):
                raise Exception("Attempt to accept assignment by user that it is not assigned to")

        # If the assignment has already been accepted bail out!
        if original.get("accepted", False):
            raise Exception("The assignment {} is already accepted".format(assignment_id))

        update = {"accepted": True}

        # Set flag using system update, bypass locks, etag problems
        await self.system_update_async(ObjectId(assignment_id), update, original)

        # update the history
        await AssignmentsHistoryAsyncService().on_item_updated(update, original, ASSIGNMENT_HISTORY_ACTIONS.ACCEPTED)

        # send notification
        self.notify("assignments:accepted", update, original)

        await self.send_acceptance_notification(original)


assignments_schema: dict[str, Any] = {
    ID_FIELD: {
        "type": "objectid",
        "nullable": False,
    },
    # Audit Information
    "original_creator": metadata_schema["original_creator"],
    "version_creator": metadata_schema["version_creator"],
    "firstcreated": metadata_schema["firstcreated"],
    "versioncreated": metadata_schema["versioncreated"],
    # Item type used by superdesk publishing
    ITEM_TYPE: {
        "type": "string",
        "mapping": not_analyzed,
        "default": "assignment",
    },
    # Assignment details
    "priority": metadata_schema["priority"],
    "coverage_item": {"type": "string", "mapping": not_analyzed},
    "planning_item": planning_type,
    "scheduled_update_id": {"type": "string", "mapping": not_analyzed},
    "lock_user": metadata_schema["lock_user"],
    "lock_time": metadata_schema["lock_time"],
    "lock_session": metadata_schema["lock_session"],
    "lock_action": metadata_schema["lock_action"],
    "assigned_to": {
        "type": "dict",
        "schema": {
            "desk": {"type": "string", "nullable": True, "mapping": not_analyzed},
            "user": {"type": "string", "nullable": True, "mapping": not_analyzed},
            "contact": {"type": "string", "nullable": True, "mapping": not_analyzed},
            "assignor_desk": {"type": "string", "mapping": not_analyzed},
            "assignor_user": {"type": "string", "mapping": not_analyzed},
            "assigned_date_desk": {"type": "datetime"},
            "assigned_date_user": {"type": "datetime"},
            "state": {
                "type": "string",
                "mapping": not_analyzed,
                "allowed": assignment_workflow_state,
            },
            "revert_state": {
                "type": "string",
                "mapping": not_analyzed,
                "allowed": assignment_workflow_state,
            },
            "coverage_provider": {
                "type": "dict",
                "nullable": True,
                "allow_unknown": True,
                "schema": {
                    "qcode": {"type": "string"},
                    "name": {"type": "string"},
                    "contact_type": {"type": "string"},
                },
                "mapping": {
                    "properties": {
                        "qcode": not_analyzed,
                        "name": not_analyzed,
                        "contact_type": not_analyzed,
                    }
                },
            },
        },
    },
    # coverage details
    "planning": deepcopy(coverage_schema["planning"]),
    "description_text": metadata_schema["description_text"],
    "name": planning_schema["name"],
    # Field to mark assignment for deletion if a delete operation fails
    "_to_delete": {"type": "boolean"},
    # Flag that indicates the assignment has been accepted
    "accepted": {"type": "boolean", "default": False},
}
assignments_schema["planning"]["schema"][TO_BE_CONFIRMED_FIELD] = TO_BE_CONFIRMED_FIELD_SCHEMA

# Make sure ``subject`` field with custom CVs are searchable
assignments_schema["planning"]["schema"]["subject"] = deepcopy(planning_schema["subject"])
assignments_schema["planning"]["mapping"]["properties"]["subject"] = deepcopy(planning_schema["subject"]["mapping"])


class AssignmentsResource(superdesk.Resource):
    url = "assignments"
    item_url = item_url
    schema = assignments_schema
    resource_methods = ["GET"]
    item_methods = ["GET", "PATCH", "DELETE"]
    privileges = {"PATCH": "archive", "DELETE": "planning_planning_management"}

    mongo_indexes = {
        "coverage_item_1": ([("coverage_item", 1)], {"background": True}),
        "planning_item_1": ([("planning_item", 1)], {"background": True}),
        "published_state_1": ([("published_state", 1)], {"background": True}),
    }

    datasource = {"source": "assignments", "search_backend": "elastic"}

    etag_ignore_fields = ["planning", "published_state", "published_at"]

    merge_nested_documents = True
