# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from superdesk.core import get_config
from superdesk import get_resource_service
from apps.archive.common import ARCHIVE

from planning.common import ASSIGNMENT_WORKFLOW_STATE, WORKFLOW_STATE
from planning.unified.agenda import AgendasAsyncService
from planning.utils import get_first_related_event_id_for_planning, get_related_event_links_for_planning

from .utils import expand_contact_info
from .json_base_formatter import BaseJsonFormatter


class JsonPlanningFormatter(BaseJsonFormatter):
    """
    Simple json output formatter a sample output formatter for planning items
    """

    name = "JSON Planning"
    type = "json_planning"
    resource_type = "planning"
    include_files = None

    def __init__(self):
        """
        Set format type and no export or preview
        """
        super().__init__()
        self.format_type = "json_planning"

    # fields to be removed from the planning item
    remove_fields: set[str] | None = {
        "lock_time",
        "lock_action",
        "lock_session",
        "lock_user",
        "_etag",
        "_current_version",
        "original_creator",
        "version_creator",
        "_planning_schedule",
        "files",
        "_updates_schedule",
    }

    # fields to be removed from coverage
    remove_coverage_fields = (
        "original_creator",
        "version_creator",
        "assigned_to",
        "flags",
    )
    remove_coverage_planning_fields = ("contact_info", "files", "xmp_file")

    async def _format_item(self, item, subscribers: list[dict] | None = None):
        """Format the item to json planning"""
        await super()._format_item(item)
        for coverage in item.get("coverages", []):
            await self._expand_coverage_contacts(coverage)

            deliveries, workflow_state = await self._expand_delivery(coverage)
            if workflow_state:
                coverage["workflow_status"] = self._get_coverage_workflow_state(workflow_state)

            coverage["deliveries"] = deliveries
            for f in self.remove_coverage_fields:
                coverage.pop(f, None)

            for key in self.remove_coverage_planning_fields:
                if key in (coverage.get("planning") or {}):
                    coverage["planning"].pop(key, None)

        item["agendas"] = await self._expand_agendas(item)

        first_primary_event_id = get_first_related_event_id_for_planning(item, "primary")
        if first_primary_event_id:
            item["event_item"] = first_primary_event_id

        events = []
        for event_ref in get_related_event_links_for_planning(item):
            event = await get_resource_service("events").find_one_async(req=None, _id=event_ref["_id"])
            events.append(
                {
                    "rel": event_ref["link_type"],
                    "uri": f"urn:event:{event_ref['_id']}",
                    "literal": event_ref["_id"],
                    "name": (event.get("name") or "") if event else "",
                }
            )
        item["events"] = events

        return item

    def _get_coverage_workflow_state(self, assignment_state):
        if assignment_state in {
            ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
        }:
            return WORKFLOW_STATE.ACTIVE
        else:
            return assignment_state

    async def _expand_agendas(self, item):
        """
        Given an item it will scan any agendas, look them up and return the expanded values, if enabled

        :param item:
        :return: Array of expanded agendas
        """
        remove_agenda_fields = {
            "_etag",
            "_type",
            "original_creator",
            "_updated",
            "_created",
            "is_enabled",
        }
        expanded = []
        agenda_service = AgendasAsyncService()
        for agenda in item.get("agendas", []):
            agenda_details = await agenda_service.find_by_id_raw(agenda)
            if agenda_details and agenda_details.get("is_enabled"):
                for f in remove_agenda_fields:
                    agenda_details.pop(f, None)
                expanded.append(agenda_details)
        return expanded

    async def _expand_delivery(self, coverage):
        """Find any deliveries associated with the assignment

        :param assignment_id:
        :return:
        """
        assigned_to = coverage.pop("assigned_to", None) or {}
        coverage["coverage_provider"] = assigned_to.get("coverage_provider")
        assignment_id = assigned_to.get("assignment_id")

        if not assignment_id:
            return [], None

        assignment = await superdesk.get_resource_service("assignments").find_one_async(req=None, _id=assignment_id)
        if not assignment:
            return [], None

        if assignment.get("assigned_to").get("state") not in [
            ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
        ]:
            return [], assignment.get("assigned_to").get("state")

        delivery_service = get_resource_service("delivery")
        remove_fields = (
            "coverage_id",
            "planning_id",
            "_created",
            "_updated",
            "assignment_id",
            "_etag",
        )
        deliveries = await (
            await delivery_service.get_async(req=None, lookup={"coverage_id": coverage.get("coverage_id")})
        ).to_list()

        # Get the associated article(s) linked to the coverage(s)
        query = {"$and": [{"_id": {"$in": [item["item_id"] for item in deliveries]}}]}
        articles = {
            item["_id"]: item
            async for item in await get_resource_service(ARCHIVE).get_from_mongo_async(req=None, lookup=query)
        }

        # Check to see if in this delivery chain, whether the item has been published at least once
        for delivery in deliveries:
            for f in remove_fields:
                delivery.pop(f, None)

            # TODO: This is a hack, need to find a better way of doing this
            # If the linked article was auto-published, then use the ``ingest_id`` for the article ID
            # This is required when the article was published using the ``NewsroomNinjsFormatter``
            # Otherwise this coverage in Newshub would point to a non-existing wire item
            article = articles.get(delivery["item_id"])
            if (
                article is not None
                and article.get("ingest_id")
                and (article.get("auto_publish") or (article.get("extra") or {}).get("publish_ingest_id_as_guid"))
            ):
                delivery["item_id"] = article["ingest_id"]

        return deliveries, assignment.get("assigned_to").get("state")

    async def _expand_coverage_contacts(self, coverage):
        ASIGNEE_FIELDS = get_config(list[str], "PLANNING_JSON_EXCLUDE_ASSIGNEE_FIELDS", [])
        EXTENDED_INFO = get_config(bool, "PLANNING_JSON_ASSIGNED_INFO_EXTENDED", False)

        if "contact" not in ASIGNEE_FIELDS and (coverage.get("assigned_to") or {}).get("contact"):
            expanded_contacts = await expand_contact_info([coverage["assigned_to"]["contact"]])
            if expanded_contacts:
                coverage["coverage_provider_contact_info"] = {
                    "first_name": expanded_contacts[0]["first_name"],
                    "last_name": expanded_contacts[0]["last_name"],
                }

        if "user" not in ASIGNEE_FIELDS and (coverage.get("assigned_to") or {}).get("user"):
            user = get_resource_service("users").find_one(req=None, _id=coverage["assigned_to"]["user"])
            if user and not user.get("private"):
                coverage["assigned_user"] = {
                    "first_name": user.get("first_name") or "",
                    "last_name": user.get("last_name") or "",
                    "display_name": user.get("display_name"),
                }

                if EXTENDED_INFO:
                    coverage["assigned_user"].update(
                        email=user.get("email"),
                    )

        if "desk" not in ASIGNEE_FIELDS and (coverage.get("assigned_to") or {}).get("desk"):
            desk = get_resource_service("desks").find_one(req=None, _id=coverage["assigned_to"]["desk"])
            if desk:
                coverage["assigned_desk"] = {
                    "name": desk.get("name"),
                }

                if EXTENDED_INFO:
                    coverage["assigned_desk"].update(
                        email=desk.get("email"),
                    )
