# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from flask import current_app as app
from superdesk.publish.formatters import Formatter
import superdesk
from apps.archive.common import ARCHIVE
import json
from superdesk.utils import json_serialize_datetime_objectId
from copy import deepcopy
from superdesk import get_resource_service
from planning.common import ASSIGNMENT_WORKFLOW_STATE, WORKFLOW_STATE
from superdesk.metadata.item import CONTENT_STATE
from .utils import expand_contact_info, get_matching_products
from .json_utils import translate_names


class JsonPlanningFormatter(Formatter):
    """
    Simple json output formatter a sample output formatter for planning items
    """

    name = "JSON Planning"
    type = "json_planning"

    def __init__(self):
        """
        Set format type and no export or preview
        """
        self.format_type = "json_planning"
        self.can_preview = False
        self.can_export = False

    # fields to be removed from the planning item
    remove_fields = (
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
    )

    # fields to be removed from coverage
    remove_coverage_fields = (
        "original_creator",
        "version_creator",
        "assigned_to",
        "flags",
    )
    remove_coverage_planning_fields = ("contact_info", "files", "xmp_file")

    def can_format(self, format_type, article):
        if article.get("flags", {}).get("marked_for_not_publication", False):
            return False
        return format_type == self.format_type and article.get("type") == "planning"

    def format(self, item, subscriber, codes=None):
        pub_seq_num = superdesk.get_resource_service("subscribers").generate_sequence_number(subscriber)
        output_item = self._format_item(item)
        return [
            (
                pub_seq_num,
                json.dumps(output_item, default=json_serialize_datetime_objectId),
            )
        ]

    def _format_item(self, item):
        """Format the item to json event"""
        output_item = deepcopy(item)
        for f in self.remove_fields:
            output_item.pop(f, None)
        for coverage in output_item.get("coverages", []):
            self._expand_coverage_contacts(coverage)

            deliveries, workflow_state = self._expand_delivery(coverage)
            if workflow_state:
                coverage["workflow_status"] = self._get_coverage_workflow_state(workflow_state)

            coverage["deliveries"] = deliveries
            for f in self.remove_coverage_fields:
                coverage.pop(f, None)

            for key in self.remove_coverage_planning_fields:
                if key in (coverage.get("planning") or {}):
                    coverage["planning"].pop(key, None)

        output_item["agendas"] = self._expand_agendas(item)
        output_item["products"] = get_matching_products(item)

        translate_names(output_item)

        return output_item

    def _get_coverage_workflow_state(self, assignment_state):
        if assignment_state in {
            ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
        }:
            return WORKFLOW_STATE.ACTIVE
        else:
            return assignment_state

    def _expand_agendas(self, item):
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
        for agenda in item.get("agendas", []):
            agenda_details = get_resource_service("agenda").find_one(req=None, _id=agenda)
            if agenda_details and agenda_details.get("is_enabled"):
                for f in remove_agenda_fields:
                    agenda_details.pop(f, None)
                expanded.append(agenda_details)
        return expanded

    def _expand_delivery(self, coverage):
        """Find any deliveries associated with the assignment

        :param assignment_id:
        :return:
        """
        assigned_to = coverage.pop("assigned_to", None) or {}
        coverage["coverage_provider"] = assigned_to.get("coverage_provider")
        assignment_id = assigned_to.get("assignment_id")

        if not assignment_id:
            return [], None

        assignment = superdesk.get_resource_service("assignments").find_one(req=None, _id=assignment_id)
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
        deliveries = list(delivery_service.get(req=None, lookup={"coverage_id": coverage.get("coverage_id")}))

        # Get the associated article(s) linked to the coverage(s)
        query = {"$and": [{"_id": {"$in": [item["item_id"] for item in deliveries]}}]}
        articles = {item["_id"]: item for item in get_resource_service(ARCHIVE).get_from_mongo(req=None, lookup=query)}

        # Check to see if in this delivery chain, whether the item has been published at least once
        item_never_published = True
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

            if delivery.get("item_state") == CONTENT_STATE.PUBLISHED:
                item_never_published = False

        return deliveries, assignment.get("assigned_to").get("state")

    def _expand_coverage_contacts(self, coverage):
        EXTENDED_INFO = bool(app.config.get("PLANNING_JSON_ASSIGNED_INFO_EXTENDED"))

        if (coverage.get("assigned_to") or {}).get("contact"):
            expanded_contacts = expand_contact_info([coverage["assigned_to"]["contact"]])
            if expanded_contacts:
                coverage["coverage_provider_contact_info"] = {
                    "first_name": expanded_contacts[0]["first_name"],
                    "last_name": expanded_contacts[0]["last_name"],
                }

        if (coverage.get("assigned_to") or {}).get("user"):
            user = get_resource_service("users").find_one(req=None, _id=coverage["assigned_to"]["user"])
            if user and not user.get("private"):
                coverage["assigned_user"] = {
                    "first_name": user.get("first_name"),
                    "last_name": user.get("last_name"),
                    "display_name": user.get("display_name"),
                }

                if EXTENDED_INFO:
                    coverage["assigned_user"].update(
                        email=user.get("email"),
                    )

        if (coverage.get("assigned_to") or {}).get("desk"):
            desk = get_resource_service("desks").find_one(req=None, _id=coverage["assigned_to"]["desk"])
            if desk:
                coverage["assigned_desk"] = {
                    "name": desk.get("name"),
                }

                if EXTENDED_INFO:
                    coverage["assigned_desk"].update(
                        email=desk.get("email"),
                    )
