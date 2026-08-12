# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning"""

import logging
from itertools import chain
from io import BytesIO

from quart_babel import gettext as _

from lxml import etree
from bson import ObjectId
from eve.methods.common import resolve_document_etag
from eve.utils import ParsedRequest

from superdesk.core import json, get_app_config, get_current_app
from superdesk.eve_async.service import AsyncBaseService
from superdesk.eve_async.cursors import AsyncEveCursor
from superdesk.flask import request
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service, Resource
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow
from superdesk.metadata.utils import item_url
from superdesk.users.services import current_user_has_privilege
from superdesk.notification import push_notification
from superdesk.publish_async.utils import get_next_sequence_number
from apps.archive.common import get_user, get_auth

from planning.errors import AssignmentApiError
from planning.types import Planning, PLANNING_RELATED_EVENT_LINK_TYPE
from planning.types.unified import PlanningItemType
from planning.common import (
    WORKFLOW_STATE,
    prepare_ingested_item_for_storage,
    get_coverage_type_name,
    TO_BE_CONFIRMED_FIELD,
    get_planning_xmp_assignment_mapping,
    get_planning_xmp_slugline_mapping,
    get_planning_use_xmp_for_pic_slugline,
    get_planning_use_xmp_for_pic_assignments,
    set_ingest_version_datetime,
    is_new_version,
    update_ingest_on_patch,
)

from planning.events.events_history_async_service import EventsHistoryAsyncService
from planning.signals import planning_ingested
from planning.utils import (
    get_related_planning_for_events_async,
    get_first_related_event_id_for_planning,
    get_related_event_items_for_planning,
)

logger = logging.getLogger(__name__)


class PlanningService(AsyncBaseService):
    """Service class for the planning model."""

    async def post_in_mongo(self, docs, **kwargs):
        """Post an ingested item(s)"""

        for doc in docs:
            prepare_ingested_item_for_storage(doc)
            self._resolve_defaults(doc)
            set_ingest_version_datetime(doc)

        await self.on_create_async(docs)
        resolve_document_etag(docs, self.datasource)
        ids = await self.backend.create_in_mongo_async(self.datasource, docs, **kwargs)
        await self.on_created_async(docs)
        for doc in docs:
            await planning_ingested.send(doc, None)
        return ids

    async def patch_in_mongo(self, id, document, original):
        """Patch an ingested item onto an existing item locally"""
        prepare_ingested_item_for_storage(document)
        update_ingest_on_patch(document, original)
        response = await self.backend.update_in_mongo_async(self.datasource, id, document, original)
        await self.on_updated_async(document, original, from_ingest=True)
        await planning_ingested.send(document, original)
        return response

    def is_new_version(self, new_item, old_item):
        return is_new_version(new_item, old_item)

    def ingest_cancel(self, item, feeding_service):
        """Ignore cancelling on ingest, this will happen in ``update_post_item``"""

        pass

    async def create_async(self, docs: list[dict], skip_signals: bool = True, **kwargs):
        for doc in docs:
            doc["type"] = "planning"
            doc.setdefault("dates", {})["start"] = doc.pop("planning_date", None)

        response = await self.backend.create_async(self.datasource, docs, skip_signals=skip_signals, **kwargs)

        for doc in docs:
            dates = doc.pop("dates", {})
            doc["planning_date"] = dates.get("start")

        return response

    async def post_async(self, docs: list[dict], **kwargs):
        return await self.create_async(docs, skip_signals=False)

    async def find_one_async(self, req, **lookup):
        item = await super().find_one_async(req, **lookup)
        if item:
            dates = item.pop("dates", {})
            item["planning_date"] = dates.get("start")

        return item

    async def _update_event_history(self, doc: Planning):
        events_service = get_resource_service("events")
        events_history_service = EventsHistoryAsyncService()

        for original_event in get_related_event_items_for_planning(doc, "primary"):
            await events_service.system_update_async(
                original_event[ID_FIELD],
                {
                    "expiry": None,
                    # Event hasn't actually been updated
                    # So we leave these version dates alone
                    "_updated": original_event["_updated"],
                    "versioncreated": original_event["versioncreated"],
                },
                original_event,
            )
            await events_history_service.on_item_updated(
                {"planning_id": doc[ID_FIELD]}, original_event, "planning_created"
            )

    async def on_duplicated(self, doc, parent_id):
        await self._update_event_history(doc)
        session_id = get_auth().get("_id")
        push_notification(
            "planning:duplicated",
            item=str(doc.get(ID_FIELD)),
            original=str(parent_id),
            user=str(doc.get("original_creator", "")),
            added_agendas=doc.get("agendas") or [],
            removed_agendas=[],
            session=session_id,
        )

    def should_update(self, old_item, new_item, provider):
        return True

    async def set_ingest_provider_sequence_async(self, item, provider):
        """Sets the value of ingest_provider_sequence in item.

        :param item: object to which ingest_provider_sequence to be set
        :param provider: ingest_provider object, used to build the key name of sequence
        """
        sequence_number = await get_next_sequence_number(
            key_name="ingest_providers_{_id}".format(_id=provider[ID_FIELD]),
            max_seq_number=get_app_config("MAX_VALUE_OF_INGEST_SEQUENCE"),
        )
        item["ingest_provider_sequence"] = str(sequence_number)

    async def update_async(self, id, updates, original, skip_signals: bool = True):
        if "planning_date" in updates:
            updates["dates"] = (original.get("dates") or {}).copy()
            updates["dates"]["start"] = updates.pop("planning_date")

        new_updates = await self.backend.update_async(self.datasource, id, updates, original, skip_signals=skip_signals)

        if (updates.get("dates") or {}).get("start"):
            updates["planning_date"] = updates["dates"]["start"]
            updates.pop("dates")

        return new_updates

    async def patch_async(self, id, updates: dict):
        original = await self.find_one_async(req=None, _id=id)
        if original is None:
            raise SuperdeskApiError.notFoundError(_(f"Item with id {id} not found"))

        return await self.update_async(id, updates, original, skip_signals=False)

    def can_edit(self, item, user_id):
        # Check privileges
        if not current_user_has_privilege("planning_planning_management"):
            return False, "User does not have sufficient permissions."
        return True, ""

    async def get_planning_by_agenda_id(self, agenda_id):
        """Get the planing item by Agenda

        :param dict agenda_id: Agenda _id
        :return list: list of planing items
        """
        query = {"query": {"bool": {"must": {"term": {"agendas": str(agenda_id)}}}}}
        req = ParsedRequest()
        req.args = {"source": json.dumps(query)}
        return await super().get_async(req=req, lookup=None)

    async def get_async(self, req: ParsedRequest | None, lookup: dict | None) -> AsyncEveCursor:
        if req is None:
            req = ParsedRequest()

        if not lookup:
            lookup = {}
            lookup["type"] = PlanningItemType.PLANNING.value
        return await self.backend.get_async(self.datasource, req=req, lookup=lookup)

    async def get_all_items_in_relationship(
        self, item: Planning, event_link_type: PLANNING_RELATED_EVENT_LINK_TYPE = "primary"
    ):
        event_id = get_first_related_event_id_for_planning(item, event_link_type)
        if not event_id:
            return []

        events_service = get_resource_service("events")
        if item.get("recurrence_id"):
            # One call wil get all items in the recurring series from event service
            return await events_service.get_all_items_in_relationship(
                {"recurrence_id": item["recurrence_id"]}, event_link_type
            )
        else:
            # Get associated event
            all_items = await (await events_service.find_async(where={"_id": event_id})).to_list()
            # Get all associated planning items
            return chain(all_items, await get_related_planning_for_events_async([event_id], event_link_type))

    # TODO-UNIFIED: Remove once ContentAPI is upgraded
    def set_planning_schedule(self, updates, original=None):
        """This set the list of schedule based on the coverage and planning.

        Sorting currently works on two fields "planning_date" and "scheduled" date.
        "planning_date" is stored on the planning and is equal to event start date for planning items
        created from event or current date for adhoc planning item
        "scheduled" is stored on the coverage nested document and it is optional.
        Hence to sort and filter planning based on these two dates a
        nested documents of scheduled date is required

        :param dict updates: planning update document
        :param dict original: planning original document
        """

        coverages = updates.get("coverages", [])
        planning_date = updates.get("planning_date") or (original or {}).get("planning_date") or utcnow()

        add_default_schedule = True
        add_default_updates_schedule = True
        schedule = []
        updates_schedule = []
        for coverage in coverages:
            if coverage.get("planning", {}).get("scheduled"):
                add_default_schedule = False

            schedule.append(
                {
                    "coverage_id": coverage.get("coverage_id"),
                    "scheduled": coverage.get("planning", {}).get("scheduled"),
                }
            )

            for s in coverage.get("scheduled_updates") or []:
                if s.get("planning", {}).get("scheduled") and add_default_updates_schedule:
                    add_default_updates_schedule = False

                updates_schedule.append(
                    {
                        "scheduled_update_id": s.get("scheduled_update_id"),
                        "scheduled": s.get("planning", {}).get("scheduled"),
                    }
                )

        if add_default_schedule:
            schedule.append({"coverage_id": None, "scheduled": planning_date or utcnow()})

        if add_default_updates_schedule:
            updates_schedule.append({"scheduled_update_id": None, "scheduled": planning_date or utcnow()})

        updates["_planning_schedule"] = schedule
        updates["_updates_schedule"] = updates_schedule

    # TODO-UNIFIED: Remove once Planning action service is upgraded
    async def cancel_coverage(
        self,
        coverage,
        coverage_cancel_state,
        original_workflow_status,
        assignment=None,
        reason=None,
        event_cancellation=False,
        event_reschedule=False,
    ):
        await self._perform_coverage_cancel(
            coverage,
            coverage_cancel_state,
            original_workflow_status,
            assignment,
            reason,
            event_cancellation,
            event_reschedule,
        )

        for s in coverage.get("scheduled_updates") or []:
            await self._perform_coverage_cancel(
                s,
                coverage_cancel_state,
                original_workflow_status,
                None,
                reason,
                event_cancellation,
                event_reschedule,
            )

    # TODO-UNIFIED: Remove once Planning action service is upgraded
    async def _perform_coverage_cancel(
        self,
        coverage,
        coverage_cancel_state,
        original_workflow_status,
        assignment,
        reason,
        event_cancellation,
        event_reschedule,
    ):
        # If coverage is already cancelled, don't change it's state_reason
        if coverage.get("previous_status"):
            return

        coverage["news_coverage_status"] = coverage_cancel_state
        coverage["previous_status"] = original_workflow_status
        coverage["workflow_status"] = WORKFLOW_STATE.CANCELLED
        coverage["planning"]["workflow_status_reason"] = reason

        # Cancel assignment if the coverage has an assignment
        if coverage.get("assigned_to"):
            coverage["assigned_to"]["state"] = WORKFLOW_STATE.CANCELLED
            assignment_service = get_resource_service("assignments")
            if not assignment:
                assignment = await assignment_service.find_one_async(
                    req=None, _id=coverage["assigned_to"].get("assignment_id")
                )

            if assignment:
                await assignment_service.cancel_assignment(assignment, coverage, event_cancellation, event_reschedule)

    # TODO-UNIFIED: Remove once PlanningHistory has been upgraaded
    def is_coverage_planning_modified(self, updates, original):
        for key in updates.get("planning").keys():
            if not key.startswith("_") and updates.get("planning")[key] != (original.get("planning") or {}).get(key):
                return True

        if (
            TO_BE_CONFIRMED_FIELD in original
            and TO_BE_CONFIRMED_FIELD in updates
            and original[TO_BE_CONFIRMED_FIELD] != updates[TO_BE_CONFIRMED_FIELD]
        ):
            return True

        return False

    # TODO-UNIFIED: Remove once PlanningHistory has been upgraaded
    def is_coverage_assignment_modified(self, updates, original):
        if (updates or {}).get("assigned_to"):
            keys = ["desk", "user", "state", "coverage_provider", "contact"]
            for key in keys:
                if key in updates.get("assigned_to") and updates["assigned_to"][key] != (
                    original.get("assigned_to") or {}
                ).get(key):
                    return True

            if updates["assigned_to"].get("priority") and updates["assigned_to"]["priority"] != original.get(
                "priority"
            ):
                return True

        return False

    # TODO-UNIFIED: Remove once PlanningPost has been upgraaded
    async def delete_assignments_for_coverages(self, coverages, notify=True):
        failed_assignments = []
        deleted_assignments = []
        assignment_service = get_resource_service("assignments")
        for coverage in coverages:
            assign_id = coverage["assigned_to"].get("assignment_id")
            if not assign_id:
                continue
            assign_planning = coverage.get("planning")
            try:
                await assignment_service.delete_action_async(lookup={"_id": assign_id})
                deleted_assignments.append(
                    {
                        "id": assign_id,
                        "slugline": assign_planning.get("slugline"),
                        "type": assign_planning.get("g2_content_type"),
                    }
                )
            except AssignmentApiError as e:
                logger.error("There is a assignment '{}' is in progress".format(assign_id))
                failed_assignments.append(
                    {
                        "state": "in Progress",
                        "slugline": assign_planning.get("slugline"),
                        "type": assign_planning.get("g2_content_type"),
                    }
                )
            except SuperdeskApiError as e:
                failed_assignments.append(
                    {
                        "error": str(e),
                        "slugline": assign_planning.get("slugline"),
                        "type": assign_planning.get("g2_content_type"),
                    }
                )
                # Mark the assignment to be deleted.
                original_assigment = await assignment_service.find_one_async(req=None, _id=assign_id)
                if original_assigment:
                    await assignment_service.system_update_async(
                        ObjectId(assign_id),
                        {"_to_delete": True},
                        original_assigment,
                        skip_planning_sync=True,
                        notification_source="planning",
                    )

        if request:
            session_id = get_auth().get("_id")
            user_id = get_user().get(ID_FIELD)
            if len(deleted_assignments) > 0:
                push_notification(
                    "assignments:delete",
                    items=deleted_assignments,
                    session=session_id,
                    user=user_id,
                )

            if len(failed_assignments) > 0 and notify:
                push_notification(
                    "assignments:delete:fail",
                    items=failed_assignments,
                    session=session_id,
                    user=user_id,
                )

    # TODO-UNIFIED: Remove once Assignments has been upgraded
    async def get_xmp_file_for_updates(self, updates_coverage, original_coverage, for_slugline=False):
        rv = False
        if not (updates_coverage["planning"] or {}).get("xmp_file"):
            return rv

        if not get_coverage_type_name((updates_coverage.get("planning") or {}).get("g2_content_type")) in [
            "Picture",
            "picture",
        ]:
            return rv

        if not self.is_xmp_updated(updates_coverage, original_coverage):
            return rv

        coverage_id = updates_coverage.get("coverage_id") or (original_coverage or {}).get("coverage_id")
        xmp_file = await get_resource_service("planning_files").find_one_async(
            req=None, _id=updates_coverage["planning"]["xmp_file"]
        )
        if not xmp_file:
            logger.error(
                "Attached xmp_file not found. Coverage: {0}, xmp_file: {1}".format(
                    coverage_id, updates_coverage["planning"]["xmp_file"]
                )
            )
            return rv

        app = get_current_app()
        xmp_file = app.media.get(xmp_file["media"], resource="planning_files")
        if not xmp_file:
            logger.error(
                "xmp_file not found in media storage. Coverage: {0}, xmp_file: {1}".format(
                    coverage_id, updates_coverage["planning"]["xmp_file"]
                )
            )
            return rv

        if for_slugline:
            if not get_planning_use_xmp_for_pic_slugline() or not get_planning_xmp_slugline_mapping():
                return rv
        else:
            if (
                not (updates_coverage.get("assigned_to") or {}).get("assignment_id")
                and not updates_coverage.get("type") == "assignment"
            ):
                return rv

            if not get_planning_use_xmp_for_pic_assignments() or not get_planning_xmp_assignment_mapping():
                return rv

        return xmp_file

    def is_xmp_updated(self, updates_coverage, original_coverage=None):
        return (
            updates_coverage["planning"].get("xmp_file")
            and ((original_coverage or {}).get("planning") or {}).get("xmp_file")
            != updates_coverage["planning"]["xmp_file"]
        )

    async def set_xmp_file_info(self, updates_coverage, original_coverage=None):
        xmp_file = await self.get_xmp_file_for_updates(updates_coverage, original_coverage)
        if not xmp_file:
            return

        assignment_id = updates_coverage.get("_id") or updates_coverage["assigned_to"].get("assignment_id")
        try:
            mapped = False
            parsed = etree.parse(xmp_file)
            xmp_assignment_mapping = get_planning_xmp_assignment_mapping()
            tags = parsed.xpath(
                xmp_assignment_mapping["xpath"],
                namespaces=xmp_assignment_mapping["namespaces"],
            )
            if tags:
                tags[0].attrib[xmp_assignment_mapping["atribute_key"]] = assignment_id
                mapped = True

            if not mapped:
                parent_xpath = xmp_assignment_mapping["xpath"][0 : xmp_assignment_mapping["xpath"].rfind("/")]
                parent = parsed.xpath(parent_xpath, namespaces=xmp_assignment_mapping["namespaces"])
                if parent:
                    elem = etree.SubElement(
                        parent[0],
                        "{{{0}}}Description".format(xmp_assignment_mapping["namespaces"]["rdf"]),
                        nsmap=xmp_assignment_mapping["namespaces"],
                    )
                    elem.attrib[xmp_assignment_mapping["atribute_key"]] = assignment_id
                else:
                    logger.error("Cannot find xmp_mapping path in XMP file for assignment: {}".format(assignment_id))
                    return

            buf = BytesIO()
            buf.write(etree.tostring(parsed.getroot(), pretty_print=True))
            buf.seek(0)
            app = get_current_app()
            media_id = app.media.put(
                buf,
                resource="planning_files",
                filename=xmp_file.filename,
                content_type="application/octet-stream",
            )
            await get_resource_service("planning_files").patch_async(
                updates_coverage["planning"]["xmp_file"],
                {"filemeta": {"media_id": media_id}, "media": media_id},
            )
            push_notification("planning_files:updated", item=updates_coverage["planning"]["xmp_file"])
        except Exception:
            logger.error(
                "Error while injecting assignment ID to XMP File. Assignment: {0}, xmp_file: {1}".format(
                    assignment_id, updates_coverage["planning"]["xmp_file"]
                )
            )

    # async def duplicate_xmp_file(self, coverage):
    #     cov_plan = coverage.get("planning") or {}
    #     if not (
    #         cov_plan.get("xmp_file")
    #         and get_coverage_type_name(cov_plan.get("g2_content_type")) in ["Picture", "picture"]
    #     ):
    #         return
    #
    #     file_id = coverage["planning"]["xmp_file"]
    #     xmp_file = await get_resource_service("planning_files").find_one_async(req=None, _id=file_id)
    #     coverage_msg = "Duplicating Coverage: {}".format(coverage["coverage_id"])
    #     if not xmp_file:
    #         logger.error("XMP File {} attached to coverage not found. {}".format(file_id, coverage_msg))
    #         return
    #
    #     app = get_current_app()
    #     xmp_file = app.media.get(xmp_file["media"], resource="planning_files")
    #     if not xmp_file:
    #         logger.error("Media file for XMP File {} not found. {}".format(file_id, coverage_msg))
    #         return
    #
    #     try:
    #         buf = BytesIO()
    #         buf.write(xmp_file.read())
    #         buf.seek(0)
    #         media_id = app.media.put(
    #             buf,
    #             resource="planning_files",
    #             filename=xmp_file.name,
    #             content_type="application/octet-stream",
    #         )
    #     except Exception as e:
    #         logger.exception("Error creating media file. {}. Exception: {}".format(coverage_msg, e))
    #     planning_file_ids = await get_resource_service("planning_files").post_async([{"media": media_id}])
    #     coverage["planning"]["xmp_file"] = planning_file_ids[0]

    # TODO-UNIFIED: Implement when fixing recurring events
    # async def _update_recurring_planning_items(self, updates, original, update_method):
    #     SKIP_PLANNING_FIELDS = {
    #         "_id",
    #         "guid",
    #         "unique_id",
    #         "original_creator",
    #         "firstcreated",
    #         "lock_user",
    #         "lock_time",
    #         "lock_session",
    #         "lock_action",
    #         "revert_state",
    #         "ingest_provider",
    #         "source",
    #         "original_source",
    #         "ingest_provider_sequence",
    #         "ingest_firstcreated",
    #         "ingest_versioncreated",
    #         "related_events",
    #         "state",
    #         "pubstatus",
    #         "expiry",
    #         "expired",
    #         "featured",
    #         "_planning_schedule",
    #         "_updates_schedule",
    #         "planning_date",
    #         "state_reason",
    #     }
    #     SKIP_COVERAGE_FIELDS = {
    #         "coverage_id",
    #         "original_coverage_id",
    #         "guid",
    #         "original_creator",
    #         "firstcreated",
    #         "previous_status",
    #     }
    #     app = get_current_app().as_any()
    #     for plan in self._iter_recurring_plannings_to_update(updates, original, update_method):
    #         plan_updates = deepcopy(updates)
    #         for field in SKIP_PLANNING_FIELDS:
    #             plan_updates.pop(field, None)
    #
    #         try:
    #             planning_date_diff = updates["planning_date"] - original["planning_date"]
    #             if planning_date_diff:
    #                 plan_updates["planning_date"] = plan["planning_date"] + planning_date_diff
    #         except KeyError:
    #             pass
    #
    #         if len(updates.get("coverages") or []) and len(plan.get("coverages") or []):
    #             plan_updates["coverages"] = deepcopy(plan["coverages"])
    #             for coverage in plan_updates["coverages"]:
    #                 try:
    #                     original_coverage_id = coverage["original_coverage_id"]
    #                 except KeyError:
    #                     continue
    #
    #                 coverage_updates = get_coverage_by_id(updates, original_coverage_id, "original_coverage_id")
    #                 if coverage_updates is None:
    #                     continue
    #
    #                 for field, value in coverage_updates.items():
    #                     if field in SKIP_COVERAGE_FIELDS:
    #                         continue
    #                     elif field == "assigned_to":
    #                         if coverage.get("workflow_status") != WORKFLOW_STATE.DRAFT:
    #                             # This coverage has already been added to the workflow
    #                             # ``assigned_to`` information should be managed from the Assignment not Coverage
    #                             continue
    #
    #                         # Copy the ``assigned_to`` data, keeping the original ``assignment_id`` (if any)
    #                         original_assignment_id = coverage.get("assignment_id")
    #                         coverage[field] = deepcopy(value)
    #                         if original_assignment_id is not None:
    #                             coverage[field]["assignment_id"] = original_assignment_id
    #                     elif field == "planning":
    #                         original_scheduled = (coverage.get("planning") or {}).get("scheduled")
    #                         coverage["planning"] = deepcopy(value)
    #                         coverage_original = get_coverage_by_id(
    #                             original, original_coverage_id, "original_coverage_id"
    #                         )
    #                         if coverage_original is not None:
    #                             scheduled_diff = value["scheduled"] - coverage_original["planning"]["scheduled"]
    #                             coverage["planning"]["scheduled"] = original_scheduled + scheduled_diff
    #                         else:
    #                             coverage["planning"]["scheduled"] = original_scheduled
    #                     else:
    #                         coverage[field] = deepcopy(value)
    #
    #             # Add new Coverages that were added during this update request
    #             for coverage in updates["coverages"]:
    #                 if get_coverage_by_id(original, coverage["coverage_id"]) is not None:
    #                     # Skip this one, as this Coverage exists in the original
    #                     continue
    #
    #                 new_coverage = deepcopy(coverage)
    #                 for field in SKIP_COVERAGE_FIELDS:
    #                     new_coverage.pop(field, None)
    #
    #                 # Remove the Assignment ID (if any)
    #                 try:
    #                     new_coverage["assigned_to"].pop("assignment_id", None)
    #                 except (KeyError, TypeError):
    #                     pass
    #
    #                 # Set the new scheduled date, relative to the planning date
    #                 try:
    #                     plan_date = plan_updates.get("planning_date") or plan["planning_date"]
    #                     if plan_date:
    #                         scheduled_diff = coverage["planning"]["scheduled"] - (
    #                             updates.get("planning_date") or original.get("planning_date")
    #                         )
    #                         new_coverage["planning"]["scheduled"] = plan_date + scheduled_diff
    #                 except (KeyError, TypeError):
    #                     pass
    #
    #                 plan_updates["coverages"].append(new_coverage)
    #
    #         await self.patch_async(plan["_id"], plan_updates)
    #         await app.on_updated_planning.call_async(plan_updates, {"_id": plan["_id"]})

    # def _iter_recurring_plannings_to_update(self, updates, original, update_method):
    #     selected_start = updates.get("planning_date") or original.get("planning_date")
    #     # Make sure we are working with a datetime instance
    #     if not isinstance(selected_start, datetime):
    #         selected_start = datetime.strptime(selected_start, "%Y-%m-%dT%H:%M:%S%z")
    #
    #     try:
    #         lookup = {"planning_recurrence_id": original["planning_recurrence_id"]}
    #     except KeyError:
    #         return
    #
    #     for plan in self.get_from_mongo(req=None, lookup=lookup):
    #         if plan["_id"] == original["_id"]:
    #             # Skip this Planning item, as it is the same item provided to the update request
    #             continue
    #         elif update_method == UPDATE_FUTURE and plan["planning_date"] < selected_start:
    #             continue
    #         yield plan


class PlanningResource(Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    endpoint_name = url = "planning"
    item_url = item_url
    # schema = planning_schema
    allow_unknown = True
    datasource = {
        "source": "planning",
        "search_backend": "elastic",
    }
    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {
        "POST": "planning_planning_management",
        "PATCH": "planning_planning_management",
        "DELETE": "planning",
    }
    etag_ignore_fields = ["_planning_schedule", "_updates_schedule"]

    mongo_indexes = {
        "planning_recurrence_id": ([("planning_recurrence_id", 1)], {"background": True}),
    }

    merge_nested_documents = True
