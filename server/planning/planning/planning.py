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

from typing import Dict, Any, Optional, List, cast
from typing_extensions import assert_never
from copy import deepcopy
import logging
from datetime import datetime
from itertools import chain
from io import BytesIO

from quart_babel import gettext as _

from lxml import etree
from bson import ObjectId
from eve.methods.common import resolve_document_etag
from eve.utils import ParsedRequest

from superdesk.core import json, get_current_app, get_app_config
from superdesk.eve_async.service import AsyncBaseService
from superdesk.flask import request
from superdesk.resource_fields import ID_FIELD, ITEMS
from superdesk import get_resource_service, Resource
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow, utc_to_local, local_to_utc
from superdesk.metadata.utils import generate_guid, item_url
from superdesk.metadata.item import GUID_NEWSML
from superdesk.users.services import current_user_has_privilege
from superdesk.notification import push_notification
from superdesk.publish_async.utils import get_next_sequence_number
from apps.archive.common import get_user, get_auth, update_dates_for

from planning.errors import AssignmentApiError
from planning.history import fields_to_remove as history_fields_to_remove
from planning.types import (
    Planning,
    Event,
    UPDATE_METHOD,
    PlanningRelatedEventLink,
    ContentProfile,
    PLANNING_RELATED_EVENT_LINK_TYPE,
    CoverageProfile,
)
from planning.planning.planning_history_async_service import PlanningHistoryAsyncService
from planning.planning.planning_autosave_service import PlanningAutosaveAsyncService
from planning.assignments.assignments_history_async import AssignmentsHistoryAsyncService
from planning.content_profiles.planning_types_async_service import PlanningTypesAsyncService
from planning.content_profiles.utils import (
    get_coverage_schema,
    get_enabled_fields,
    get_custom_vocabulary_fields_from_profile,
)
from planning.common import (
    get_coverage_status_from_cv,
    WORKFLOW_STATE,
    ASSIGNMENT_WORKFLOW_STATE,
    prepare_ingested_item_for_storage,
    update_post_item,
    get_coverage_type_name,
    set_original_creator,
    unique_items_in_order,
    TEMP_ID_PREFIX,
    DEFAULT_ASSIGNMENT_PRIORITY,
    get_planning_allow_scheduled_updates,
    TO_BE_CONFIRMED_FIELD,
    get_planning_xmp_assignment_mapping,
    sanitize_input_data,
    get_planning_xmp_slugline_mapping,
    get_planning_use_xmp_for_pic_slugline,
    get_planning_use_xmp_for_pic_assignments,
    set_ingest_version_datetime,
    is_new_version,
    update_ingest_on_patch,
    UPDATE_SINGLE,
    UPDATE_FUTURE,
    UPDATE_ALL,
    POST_STATE,
    copy_translated_values_to_root_level_fields,
)

from planning.events.events_history_async_service import EventsHistoryAsyncService
from planning.events.events_utils import get_recurring_timeline
from planning.planning_notifications import PlanningNotifications
from planning.content_profiles.utils import is_field_enabled, is_post_planning_with_event_enabled
from planning.signals import planning_created, planning_ingested
from .planning_schema import planning_schema
from planning.utils import (
    get_planning_event_link_method,
    get_related_planning_for_events,
    get_related_planning_for_events_async,
    get_related_event_links_for_planning,
    get_related_event_ids_for_planning,
    get_first_related_event_id_for_planning,
    get_related_event_items_for_planning,
)
from .planning_utils import get_coverage_by_id
from planning.coverage_assignments import get_metadata_updates_between_entities

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

    async def find_one_async(self, req, **lookup):
        item = await super().find_one_async(req, **lookup)
        if item:
            for coverage in item.get("coverages", []):
                if coverage.get("planning", {}).get("scheduled") and not isinstance(
                    coverage["planning"]["scheduled"], datetime
                ):
                    coverage["planning"]["scheduled"] = datetime.strptime(
                        coverage["planning"]["scheduled"], "%Y-%m-%dT%H:%M:%S%z"
                    )
        return item

    async def on_create_async(self, docs):
        """Set default metadata."""
        planning_type = await PlanningTypesAsyncService().find_one(name="planning")
        assert planning_type is not None, "Expected planning_type to not be None"

        history_service = PlanningHistoryAsyncService()
        generated_planning_items = []
        for doc in docs:
            if "guid" not in doc:
                doc["guid"] = generate_guid(type=GUID_NEWSML)
            doc[ID_FIELD] = doc["guid"]

            # SDCP-638
            if not doc.get("language"):
                try:
                    doc["language"] = doc["languages"][0]
                except (KeyError, IndexError):
                    doc["language"] = get_app_config("DEFAULT_LANGUAGE")

            await self.validate_planning(doc)
            set_original_creator(doc)

            user = get_user()
            if user and user.get(ID_FIELD):
                doc["version_creator"] = user[ID_FIELD]
                doc["versioncreated"] = utcnow()

            first_event = await self._set_planning_event_info(doc, cast(ContentProfile, planning_type.to_dict()))
            await self._set_coverage(doc)
            self.set_planning_schedule(doc)
            # set timestamps
            update_dates_for(doc)

            copy_translated_values_to_root_level_fields(doc, doc["language"])

            update_method: Optional[UPDATE_METHOD] = doc.pop("update_method", None)
            if first_event and update_method is not None:
                new_plans = await self._add_planning_to_event_series(doc, first_event, update_method)
                if len(new_plans):
                    generated_planning_items.extend(new_plans)

        if len(generated_planning_items):
            docs.extend(generated_planning_items)

    async def on_created_async(self, docs):
        session_id = get_auth().get("_id")
        history_service = PlanningHistoryAsyncService()
        post_planning_with_event = await is_post_planning_with_event_enabled()
        for doc in docs:
            plan_id = str(doc.get(ID_FIELD))
            push_notification(
                "planning:created",
                item=plan_id,
                user=str(doc.get("original_creator", "")),
                added_agendas=doc.get("agendas") or [],
                removed_agendas=[],
                session=session_id,
                event_ids=get_related_event_ids_for_planning(doc, "primary"),  # Event IDs for primary events
            )
            if doc["state"] == "ingested":
                await history_service.on_item_created([doc])
            await self._update_event_history(doc)
            planning_created.send(self, item=doc)

            first_primary_event_id = get_first_related_event_id_for_planning(doc, "primary")
            if first_primary_event_id and post_planning_with_event:
                event = await get_resource_service("events").find_one_async(req=None, _id=first_primary_event_id)
                if not event:
                    logger.warning(
                        "Failed to find linked event for planning",
                        extra=dict(
                            event_id=first_primary_event_id,
                            plan_id=plan_id,
                        ),
                    )
                elif event.get("pubstatus") == POST_STATE.USABLE:
                    updates = doc.copy()
                    updates["pubstatus"] = POST_STATE.USABLE
                    await update_post_item(updates, doc)

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

    async def update_async(self, id, updates, original):
        updates.setdefault("versioncreated", utcnow())
        item = await self.backend.update_async(self.datasource, id, updates, original)
        return item

    async def on_update_async(self, updates, original):
        update_method = updates.pop("update_method", UPDATE_SINGLE)
        user = get_user()

        await self.validate_on_update(updates, original, user)

        if user and user.get(ID_FIELD):
            if self._should_update_version_creator(updates, original):
                updates["version_creator"] = user[ID_FIELD]
                updates["versioncreated"] = utcnow()

        await self._set_coverage(updates, original)
        self.set_planning_schedule(updates, original)
        copy_translated_values_to_root_level_fields(updates, updates.get("language", original.get("language")))

        if update_method and update_method != UPDATE_SINGLE:
            await self._update_recurring_planning_items(updates, original, update_method)

    async def validate_on_update(self, updates, original, user):
        lock_user = original.get("lock_user", None)
        str_user_id = str(user.get(ID_FIELD)) if user else None

        if lock_user and str(lock_user) != str_user_id:
            raise SuperdeskApiError.forbiddenError(_("The item was locked by another user"))

        await self.validate_planning(updates, original)

    async def validate_planning(self, updates, original=None):
        from planning.agendas_async.agendas_async_service import AgendasAsyncService

        if (not original and not updates.get("planning_date")) or (
            "planning_date" in updates and updates["planning_date"] is None
        ):
            raise SuperdeskApiError(message=_("Planning item should have a date"))

        sanitize_input_data(updates)

        self._validate_events_links(updates)

        # Validate if agendas being added are enabled agendas
        agenda_service = AgendasAsyncService()
        for agenda_id in updates.get("agendas", []):
            agenda = await agenda_service.find_one(req=None, _id=agenda_id)
            if not agenda:
                raise SuperdeskApiError.forbiddenError(_("Agenda '{}' does not exist").format(agenda_id))

            if not agenda.is_enabled and (original is None or agenda_id not in original.get("agendas", [])):
                raise SuperdeskApiError.forbiddenError(_("Agenda '{}' is not enabled").format(agenda.name))

        # Remove duplicate agendas
        if len(updates.get("agendas", [])) > 0:
            updates["agendas"] = unique_items_in_order(updates["agendas"])

        # Validate scheduled updates
        for coverage in updates.get("coverages") or []:
            coverage_schedule = (coverage.get("planning") or {}).get("scheduled")
            schedule_updates = list(coverage.get("scheduled_updates") or [])
            schedule_updates.reverse()
            for i, scheduled_update in enumerate(schedule_updates):
                scheduled_update_schedule = (scheduled_update.get("planning") or {}).get("scheduled")
                if not scheduled_update_schedule:
                    continue

                if coverage_schedule and scheduled_update_schedule <= coverage_schedule:
                    raise SuperdeskApiError(message="Scheduled updates must be after the original coverage.")

                next_schedule = next(
                    (
                        s
                        for s in schedule_updates[i + 1 : len(schedule_updates)]
                        if (s.get("planning") or {}).get("scheduled") is not None
                    ),
                    None,
                )
                if next_schedule and next_schedule["planning"]["scheduled"] > scheduled_update["planning"]["scheduled"]:
                    raise SuperdeskApiError(message="Scheduled updates of a coverage must be after the previous update")

    def _validate_events_links(self, updates) -> None:
        ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR = "Only 1 primary linked event is allowed"
        event_link_method = get_planning_event_link_method()

        if updates.get("related_events"):
            related_events_links = updates.get("related_events")
            if event_link_method == "one_primary":
                assert 1 == len(related_events_links), ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR
                link = related_events_links[0]
                link.setdefault("link_type", "primary")
                assert link["link_type"] == "primary", "Only primary event links are allowed"
            elif event_link_method == "many_secondary":
                for link in related_events_links:
                    link.setdefault("link_type", "secondary")
                    assert link["link_type"] == "secondary", "Only secondary event links are allowed"
            elif event_link_method == "one_primary_many_secondary":
                primary_links = get_related_event_links_for_planning(updates, "primary")
                secondary_links = get_related_event_links_for_planning(updates, "secondary")
                assert len(primary_links) <= 1, ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR
                assert len(primary_links) + len(secondary_links) == len(
                    related_events_links
                ), "Missing events link type"
            else:
                assert_never(event_link_method)

    async def _set_planning_event_info(self, doc: Planning, planning_type: ContentProfile) -> Optional[Event]:
        """Set the planning event date

        :param dict doc: planning document
        :param dict planning_types: planning type
        """
        event_id = get_first_related_event_id_for_planning(doc, "primary")

        if not event_id:
            return None

        event = await get_resource_service("events").find_one_async(req=None, _id=event_id)

        if not event:
            logger.warning(
                "Failed to find linked event for planning",
                extra=dict(
                    event_id=event_id,
                    plan_id=doc.get(ID_FIELD),
                ),
            )
            return None

        if event.get("recurrence_id"):
            doc["recurrence_id"] = event.get("recurrence_id")

        # populate headline using name
        if event.get("name") and is_field_enabled("headline", planning_type):
            doc.setdefault("headline", event["name"])

        if event.get(TO_BE_CONFIRMED_FIELD):
            doc[TO_BE_CONFIRMED_FIELD] = True

        return event

    async def _add_planning_to_event_series(
        self, plan: Planning, event: Event, update_method: UPDATE_METHOD
    ) -> List[Dict[str, Any]]:
        if update_method not in [UPDATE_FUTURE, UPDATE_ALL]:
            return []

        recurrence_id = event.get("recurrence_id")
        if not recurrence_id:
            # Not a series of Events, can safely return
            return []

        plan["planning_recurrence_id"] = generate_guid(type=GUID_NEWSML)
        planning_date_relative = plan["planning_date"] - event["dates"]["start"]
        items = []

        historic, past, future = await get_recurring_timeline(event)
        event_series = future if update_method == UPDATE_FUTURE else historic + past + future

        for series_entry in event_series:
            if series_entry["_id"] == event["_id"]:
                # This is the Event that was provided
                # We assume a Planning item was already created for this Event
                continue

            new_plan = deepcopy(plan)

            # Set the Planning & Event IDs for the new item
            new_plan["guid"] = new_plan["_id"] = generate_guid(type=GUID_NEWSML)
            new_plan["related_events"] = [
                PlanningRelatedEventLink(_id=series_entry["_id"], recurrence_id=recurrence_id, link_type="primary")
            ]
            new_plan["recurrence_id"] = recurrence_id

            # Set the Planning date/time relative to the Event start date/time
            new_plan["planning_date"] = series_entry["dates"]["start"] + planning_date_relative
            for coverage in new_plan.get("coverages") or []:
                # Remove the Coverage and Assignment IDs (as these will be created for us in ``self._set_coverage``)
                coverage["original_coverage_id"] = coverage.pop("coverage_id", None)
                (coverage.get("assigned_to") or {}).pop("assignment_id", None)

                # Set the scheduled date/time relative to the Event start date/time
                coverage_date_relative = coverage["planning"]["scheduled"] - event["dates"]["start"]
                coverage["planning"]["scheduled"] = series_entry["dates"]["start"] + coverage_date_relative

            await self._set_coverage(new_plan)
            self.set_planning_schedule(new_plan)

            items.append(new_plan)

        return items

    def _get_added_removed_agendas(self, updates, original):
        updated_agendas = [str(a) for a in (updates.get("agendas") or [])]
        existing_agendas = [str(a) for a in (original.get("agendas") or [])]
        removed_agendas = list(set(existing_agendas) - set(updated_agendas))
        added_agendas = list(set(updated_agendas) - set(existing_agendas))
        return added_agendas, removed_agendas

    async def _get_event_links(self, event_id) -> List[str]:
        return [str(link["_id"]) for link in await get_related_planning_for_events_async([event_id])]

    async def _notify_related_events_changed(self, updates, original) -> bool:
        if "related_events" not in updates:
            return False

        def get_ids(links):
            return set([str(link["_id"]) for link in links])

        updates_ids = get_ids(updates.get("related_events") or [])
        original_ids = get_ids(original.get("related_events") or [])

        removed_ids = original_ids - updates_ids
        added_ids = updates_ids - original_ids
        changed_ids = removed_ids.union(added_ids)

        for _id in changed_ids:
            push_notification(
                "event:link_updated",
                event=str(_id),
                planning=str(original.get(ID_FIELD)),
                action="delete" if _id in removed_ids else "create",
                links=await self._get_event_links(_id),
            )

        return len(changed_ids) > 0

    async def _process_removed_assignments(self, updates: dict, original: dict) -> None:
        if "coverages" not in updates:
            # Non-coverage updates (for example linking related events) must not
            # be treated as coverage removals.
            return

        assignment_service = get_resource_service("assignments")
        planning_item = deepcopy(original)
        planning_item.update(deepcopy(updates))
        updated_coverages = {coverage.get("coverage_id"): coverage for coverage in updates.get("coverages") or []}

        for original_coverage in original.get("coverages") or []:
            updated_coverage = updated_coverages.get(original_coverage.get("coverage_id")) or {}
            assignment_id = (original_coverage.get("assigned_to") or {}).get("assignment_id")

            if not assignment_id or (updated_coverage.get("assigned_to") or {}).get("assignment_id"):
                # Either no Assignment is currently linked, or the updated Coverage is still linked
                continue

            if original_coverage.get("workflow_status") not in [WORKFLOW_STATE.CANCELLED, WORKFLOW_STATE.DRAFT]:
                # This Assignment is in workflow, so we need the Assignment service's side-effects
                cursor = await assignment_service.find_async(
                    where={"coverage_item": original_coverage.get("coverage_id")}
                )
                async for assignment in cursor:
                    await assignment_service.delete_async(lookup={"_id": assignment_id})
                    await assignment_service.on_deleted_async(assignment, update_planning=False)
                    await self.send_remove_assignment_notifications(planning_item, original_coverage, assignment)
            else:
                # Otherwise just directly delete the Assignment
                await assignment_service.delete_async(lookup={"coverage_item": original_coverage.get("coverage_id")})

            assignment = {
                "planning_item": original.get(ID_FIELD),
                "coverage_item": updated_coverage.get("coverage_id"),
            }

            scheduled_update = updated_coverage.get("scheduled_update") or original_coverage.get("scheduled_update")
            if scheduled_update:
                assignment["scheduled_update_id"] = scheduled_update

            await AssignmentsHistoryAsyncService().on_item_deleted(assignment)

    async def on_updated_async(self, updates, original, from_ingest=False):
        await self._process_removed_assignments(updates, original)
        added, removed = self._get_added_removed_agendas(updates, original)
        item_id = str(original[ID_FIELD])
        session_id = get_auth().get(ID_FIELD)
        user_id = str(updates.get("version_creator", ""))
        doc = deepcopy(original)
        doc.update(updates)
        related_events_changed = await self._notify_related_events_changed(updates, original)

        push_notification(
            "planning:updated",
            item=item_id,
            user=str(updates.get("version_creator", "")),
            added_agendas=added,
            removed_agendas=removed,
            session=session_id,
            event_ids=get_related_event_ids_for_planning(doc, "primary"),
            related_events_changed=related_events_changed,
        )

        updates["coverages"] = doc.get("coverages") or []

        if original.get("lock_user") and "lock_user" in updates and updates.get("lock_user") is None:
            # When the Planning is unlocked by a patch
            push_notification(
                "planning:unlock",
                item=item_id,
                user=user_id,
                lock_session=session_id,
                etag=updates["_etag"],
                event_ids=get_related_event_ids_for_planning(doc, "primary"),  # Event IDs for primary events,
                recurrence_id=original.get("recurrence_id") or None,
                from_ingest=from_ingest,
                type=original.get("type"),
            )

        posted = await update_post_item(updates, original)
        if posted:
            new_planning = self.find_one(req=None, _id=original.get(ID_FIELD))
            updates["_etag"] = new_planning["_etag"]

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

    async def remove_coverages(self, updates, original):
        if "coverages" not in updates:
            return

        for coverage in (original or {}).get("coverages") or []:
            updated_coverage = next(
                (
                    cov
                    for cov in updates.get("coverages") or []
                    if cov.get("coverage_id") == coverage.get("coverage_id")
                ),
                None,
            )

            if not updated_coverage:
                for s in coverage.get("scheduled_updates") or []:
                    await self.remove_coverage_entity(s, original)

                await self.remove_coverage_entity(coverage, original)

    def set_coverage_active(self, coverage, planning, parentCoverage=None):
        # If the coverage is created and assigned to a desk/user and the PLANNING_AUTO_ASSIGN_TO_WORKFLOW is
        # True the coverage will be created in workflow unless the overide flag is set.
        if (
            get_app_config("PLANNING_AUTO_ASSIGN_TO_WORKFLOW", False)
            and (coverage.get("assigned_to", {}).get("desk") or coverage.get("assigned_to", {}).get("user"))
            and not planning.get("flags", {}).get("overide_auto_assign_to_workflow", False)
            and coverage["workflow_status"] == WORKFLOW_STATE.DRAFT
        ):
            coverage["workflow_status"] = WORKFLOW_STATE.ACTIVE
            coverage["add_coverage_to_workflow"] = True

            # set all scheduled_updates to be activated
            for s in coverage.get("scheduled_updates") or []:
                if s.get("assigned_to") and s["workflow_status"] == WORKFLOW_STATE.DRAFT:
                    s["workflow_status"] = WORKFLOW_STATE.ACTIVE

            return

        assigned_to = coverage.get("assigned_to")
        if (assigned_to and assigned_to.get("state") == ASSIGNMENT_WORKFLOW_STATE.ASSIGNED) or (
            parentCoverage or {}
        ).get("workflow_status") == WORKFLOW_STATE.ACTIVE:
            coverage["workflow_status"] = WORKFLOW_STATE.ACTIVE
            return

    async def remove_coverage_entity(self, coverage_entity, original_planning, entity_type="coverage"):
        if original_planning.get("state") == WORKFLOW_STATE.CANCELLED:
            raise SuperdeskApiError.badRequestError(
                _("Cannot remove {} of a cancelled planning item").format(entity_type)
            )

        assignment = coverage_entity.get("assigned_to", None)
        if assignment and assignment.get("state") not in [
            WORKFLOW_STATE.DRAFT,
            WORKFLOW_STATE.CANCELLED,
            None,
        ]:
            raise SuperdeskApiError.badRequestError(
                "Assignment already exists. {} cannot be deleted.".format(entity_type.capitalize())
            )

        updated_coverage_entity = deepcopy(coverage_entity)
        updated_coverage_entity.pop("assigned_to", None)
        await self._create_update_assignment(original_planning, {}, updated_coverage_entity, coverage_entity)

    async def add_coverages(self, updates, original):
        if "coverages" not in updates:
            return

        planning_date = original.get("planning_date") or updates.get("planning_date")
        all_day = updates.get("all_day", original.get("all_day"))
        original_coverage_ids = [
            coverage["coverage_id"] for coverage in original.get("coverages") or [] if coverage.get("coverage_id")
        ]
        for coverage in updates.get("coverages") or []:
            coverage_id = coverage.get("coverage_id", "")
            if not coverage_id or TEMP_ID_PREFIX in coverage_id or coverage_id not in original_coverage_ids:
                if "duplicate" in coverage_id or coverage.get("original_coverage_id") != coverage.get("coverage_id"):
                    await self.duplicate_xmp_file(coverage)
                # coverage to be created
                if not coverage_id or TEMP_ID_PREFIX in coverage_id:
                    coverage["coverage_id"] = generate_guid(type=GUID_NEWSML)
                if coverage.get("original_coverage_id") is None:
                    coverage["original_coverage_id"] = coverage["coverage_id"]
                coverage["firstcreated"] = utcnow()

                # Make sure the coverage has a ``scheduled`` date
                # If none was supplied, fallback to ``planning.planning_date``
                # A coverage's ``scheduled`` is always a real datetime with a timezone (stored in UTC),
                # unlike ``planning_date`` which may be a "floating" date for all day Planning items
                coverage.setdefault("planning", {})
                if not coverage["planning"].get("scheduled"):
                    coverage["planning"]["scheduled"] = (
                        self.get_all_day_scheduled_date(planning_date) if all_day else planning_date
                    )

                await self.inherit_planning_metadata(coverage, updates, original)

                set_original_creator(coverage)
                self.set_coverage_active(coverage, updates)
                await self.set_slugline_from_xmp(coverage, None)
                await self._create_update_assignment(original, updates, coverage)
                await self.add_scheduled_updates(updates, original, coverage)

    def set_scheduled_update_active(self, scheduled_update, planning, coverage):
        self.set_coverage_active(scheduled_update, planning, coverage)

        if (
            coverage.get("workflow_status") == WORKFLOW_STATE.DRAFT
            and scheduled_update.get("workflow_status") == WORKFLOW_STATE.ACTIVE
        ):
            raise SuperdeskApiError(
                message="Cannot add a scheduled update to workflow when original coverage is not in workflow"
            )

    async def remove_scheduled_updates(self, updates, original, coverage, original_coverage):
        for s in original_coverage.get("scheduled_updates") or []:
            updated_s = next(
                (
                    updated_s
                    for updated_s in coverage.get("scheduled_updates") or []
                    if updated_s.get("scheduled_update_id") == s.get("scheduled_update_id")
                ),
                None,
            )

            if not updated_s:
                await self.remove_coverage_entity(s, original)

    async def add_scheduled_updates(self, updates, original, coverage):
        for s in coverage.get("scheduled_updates") or []:
            if not get_planning_allow_scheduled_updates():
                raise SuperdeskApiError(message="Not configured to create scheduled updates to a coverage")

            if not s.get("scheduled_update_id") or TEMP_ID_PREFIX in s["scheduled_update_id"]:
                s["coverage_id"] = coverage["coverage_id"]
                s["scheduled_update_id"] = generate_guid(type=GUID_NEWSML)
                self.set_scheduled_update_active(s, updates, coverage)
                await self._create_update_assignment(original, updates, s, None)

    async def update_scheduled_updates(self, updates, original, coverage, original_coverage):
        for s in coverage.get("scheduled_updates") or []:
            original_scheduled_update = next(
                (
                    orig_s
                    for orig_s in (original_coverage.get("scheduled_updates") or [])
                    if s["scheduled_update_id"] == orig_s.get("scheduled_update_id")
                ),
                None,
            )

            if original_scheduled_update:
                if (
                    original_scheduled_update.get("workflow_status") == WORKFLOW_STATE.DRAFT
                    and s.get("workflow_status") == WORKFLOW_STATE.ACTIVE
                ):
                    self.set_scheduled_update_active(s, updates, coverage)
                await self._create_update_assignment(original, updates, s, original_scheduled_update)

    async def update_coverages(self, updates, original):
        if "coverages" not in updates:
            return

        for coverage in updates.get("coverages") or []:
            coverage_id = coverage.get("coverage_id")
            original_coverage = next(
                (cov for cov in original.get("coverages") or [] if cov["coverage_id"] == coverage_id),
                None,
            )
            if not original_coverage:
                continue

            if (original_coverage.get("flags") or {}).get("no_content_linking", False) != (
                coverage.get("flags") or {}
            ).get("no_content_linking", False) and coverage.get("workflow_status") != WORKFLOW_STATE.DRAFT:
                raise SuperdeskApiError.badRequestError(
                    "Cannot edit content linking flag of a coverage already in workflow"
                )

            # Make sure the coverage update has a ``scheduled`` date
            # If none was supplied, fallback to ``original.planning.scheduled``
            coverage.setdefault("planning", {})
            coverage["planning"].setdefault("scheduled", (original_coverage.get("planning") or {}).get("scheduled"))

            await self.inherit_planning_metadata(coverage, updates, original)

            self.set_coverage_active(coverage, updates)
            await self.set_slugline_from_xmp(coverage, original_coverage)
            if self.coverage_changed(coverage, original_coverage):
                user = get_user()
                if user:
                    # ``version_creator`` cannot be null
                    coverage["version_creator"] = str(user.get(ID_FIELD))
                coverage["versioncreated"] = utcnow()

                contact_id = coverage.get(
                    "contact",
                    (original_coverage.get("assigned_to") or {}).get("contact", None),
                )

                # If the internal note has changed send a notification, except if it's been cancelled
                if (
                    coverage.get("planning", {}).get("internal_note", "")
                    != original_coverage.get("planning", {}).get("internal_note", "")
                    and coverage.get("news_coverage_status", {}).get("qcode") != "ncostat:notint"
                ):
                    target_user = coverage.get("assigned_to", original_coverage.get("assigned_to", {})).get(
                        "user", None
                    )
                    target_desk = coverage.get("assigned_to", original_coverage.get("assigned_to", {})).get(
                        "desk", None
                    )

                    await PlanningNotifications().notify_assignment(
                        coverage_status=coverage.get("workflow_status"),
                        target_desk=target_desk if target_user is None else None,
                        target_user=target_user,
                        contact_id=contact_id,
                        message="assignment_internal_note_msg",
                        coverage_type=get_coverage_type_name(coverage.get("planning", {}).get("g2_content_type", "")),
                        slugline=coverage.get("planning", {}).get("slugline", ""),
                        internal_note=coverage.get("planning", {}).get("internal_note", ""),
                    )
                # If the scheduled time for the coverage changes
                if coverage.get("planning", {}).get("scheduled", datetime.min).strftime("%c") != original_coverage.get(
                    "planning", {}
                ).get("scheduled", datetime.min).strftime("%c"):
                    target_user = coverage.get("assigned_to", original_coverage.get("assigned_to", {})).get(
                        "user", None
                    )
                    target_desk = coverage.get("assigned_to", original_coverage.get("assigned_to", {})).get(
                        "desk", None
                    )
                    await PlanningNotifications().notify_assignment(
                        coverage_status=coverage.get("workflow_status"),
                        target_desk=target_desk if target_user is None else None,
                        target_user=target_user,
                        contact_id=contact_id,
                        message="assignment_due_time_msg",
                        due=utc_to_local(
                            get_app_config("DEFAULT_TIMEZONE"),
                            coverage.get("planning", {}).get("scheduled"),
                        ).strftime("%c"),
                        coverage_type=get_coverage_type_name(coverage.get("planning", {}).get("g2_content_type", "")),
                        slugline=coverage.get("planning", {}).get("slugline", ""),
                    )

            await self.add_scheduled_updates(updates, original, coverage)
            await self.update_scheduled_updates(updates, original, coverage, original_coverage)
            await self.remove_scheduled_updates(updates, original, coverage, original_coverage)
            await self._create_update_assignment(original, updates, coverage, original_coverage)

    async def _set_coverage(self, updates, original=None):
        if "coverages" not in updates:
            return

        if not original:
            original = {}

        # [SDESK-3073]: Commenting the following section as we cannot reproduce the ******
        # scenario where a patch is sent without any coverages (unless all coverages are removed)
        # if not updates.get('coverages'):
        # # If the description text has changed, make sure to update the assignment(s)
        # if updates.get('description_text') or updates.get('internal_note'):
        # for coverage in (original.get('coverages') or []):
        # self._create_update_assignment(original, updates, coverage, coverage)
        # return
        # ********* [SDESK-3073]: End revert ***************"""

        await self.remove_coverages(updates, original)
        await self.add_coverages(updates, original)
        await self.update_coverages(updates, original)

    @staticmethod
    def coverage_changed(updates, original):
        for field in ["news_coverage_status", "planning", "workflow_status"]:
            if updates.get(field) != original.get(field):
                return True

        return False

    @staticmethod
    def get_all_day_scheduled_date(value: datetime) -> datetime:
        """Resolve ``value`` to the real UTC instant of local midnight on its calendar date

        A coverage's ``scheduled`` date is always a real datetime with a timezone, stored in
        UTC (see ``field_range``), so a value inherited from a "floating" all day ``planning_date``
        must be converted to the actual UTC instant of local midnight rather than copied as-is.
        """

        tz_name = get_app_config("DEFAULT_TIMEZONE")
        return local_to_utc(tz_name, datetime(value.year, value.month, value.day))

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

        add_default_updates_schedule = True
        # The planning item's own `planning_date` must always be searchable/sortable via
        # `_planning_schedule`, even when coverages have their own distinct `scheduled` dates
        schedule = [{"coverage_id": None, "scheduled": planning_date or utcnow()}]
        updates_schedule = []
        for coverage in coverages:
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

        if add_default_updates_schedule:
            updates_schedule.append({"scheduled_update_id": None, "scheduled": planning_date or utcnow()})

        updates["_planning_schedule"] = schedule
        updates["_updates_schedule"] = updates_schedule

    async def _create_update_assignment(
        self,
        planning_original: dict,
        planning_updates: dict,
        updates: dict,
        original: dict | None = None,
    ) -> None:
        """Create or update the assignment.

        :param dict planning_original: original parent planning document
        :param dict planning_updates: updates for the parent planning document
        :param dict updates: coverage update document
        :param dict original: coverage original document
        """
        if not original:
            original = {}

        planning = deepcopy(planning_original)
        planning.update(planning_updates)
        planning_id = planning.get(ID_FIELD)
        if not planning_id:
            raise SuperdeskApiError.badRequestError(_("Planning item is required to create assignments."))

        assignment_service = get_resource_service("assignments")
        updated_coverage = deepcopy(original)
        updated_coverage.update(deepcopy(updates))
        assigned_to: dict | None = updated_coverage.get("assigned_to")

        if not assigned_to:
            return

        assignment_updates: dict
        if not assigned_to.get("assignment_id"):
            if not assigned_to.get("user") and not assigned_to.get("desk"):
                # If there is no Desk or User, we will not create a new Assignment yet
                return

            assignment_updates = get_metadata_updates_between_entities(
                planning=planning,
                coverage=updated_coverage,
                destination="assignment",
                assignment={},
            )
            if assignment_updates:
                new_assignment_id = str((await assignment_service.post_from_planning([assignment_updates]))[0])
                updates["assigned_to"]["assignment_id"] = new_assignment_id
                # Copy across the ``priority`` as well (as it's placed in a different location)
                if assignment_updates.get("priority"):
                    updates["assigned_to"]["priority"] = assignment_updates["priority"]
        else:
            if not updates.get("assigned_to"):
                if planning_original.get("state") == WORKFLOW_STATE.CANCELLED or updated_coverage.get(
                    "workflow_status"
                ) not in [WORKFLOW_STATE.CANCELLED, WORKFLOW_STATE.DRAFT]:
                    raise SuperdeskApiError.badRequestError(_("Coverage not in correct state to remove assignment."))

                # Return now, we will process the assignment after the DB is updated
                return

            existing_assignment_id = ObjectId(assigned_to["assignment_id"])
            original_assignment = await assignment_service.find_one_async(req=None, _id=existing_assignment_id)
            if not original_assignment:
                # Assignment was already deleted - remove the stale assignment_id reference
                # so the user can continue editing the coverage
                if not updates.get("assigned_to"):
                    updates["assigned_to"] = None
                else:
                    updates["assigned_to"] = deepcopy(updated_coverage.get("assigned_to") or updates["assigned_to"])
                    updates["assigned_to"].pop("assignment_id", None)
                return

            await self.set_xmp_file_info(updates, original)

            # Check if the coverage was cancelled
            if (
                original.get("workflow_status") != updates.get("workflow_status")
                and updates.get("workflow_status") == WORKFLOW_STATE.CANCELLED
            ):
                coverage_cancel_state = get_coverage_status_from_cv("ncostat:notint")
                coverage_cancel_state.pop("is_active", None)
                await self.cancel_coverage(
                    updates,
                    coverage_cancel_state,
                    original.get("workflow_status"),
                    original_assignment,
                    updates.get("planning", {}).get("workflow_status_reason"),
                )
                return

            if (
                original.get("workflow_status") == WORKFLOW_STATE.DRAFT
                and updated_coverage.get("workflow_status") == WORKFLOW_STATE.ACTIVE
            ):
                # If we made a coverage 'active' - change assignment status to active
                assigned_to["state"] = ASSIGNMENT_WORKFLOW_STATE.ASSIGNED

            assignment_updates = get_metadata_updates_between_entities(
                planning=planning,
                coverage=updated_coverage,
                destination="assignment",
                assignment=original_assignment,
            )

            if assignment_updates:
                # Update only if anything got modified
                await assignment_service.system_update_async(
                    existing_assignment_id,
                    assignment_updates,
                    original_assignment,
                    skip_planning_sync=True,
                    notification_source="planning",
                )

            # If there has been a change in the planning internal note then notify the assigned users/desk
            if planning_updates.get("internal_note") and planning_original.get("internal_note") != planning_updates.get(
                "internal_note"
            ):
                await PlanningNotifications().notify_assignment(
                    coverage_status=updates.get("workflow_status"),
                    target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
                    target_user=assigned_to.get("user"),
                    contact_id=assigned_to.get("contact"),
                    message="assignment_planning_internal_note_msg",
                    coverage_type=get_coverage_type_name(updates.get("planning", {}).get("g2_content_type", "")),
                    slugline=planning.get("slugline", ""),
                    internal_note=planning.get("internal_note", ""),
                    no_email=True,
                )

            if self.is_xmp_updated(updates, original):
                updated_assignment = deepcopy(original_assignment)
                updated_assignment.update(assignment_updates)
                await PlanningNotifications().notify_assignment(
                    coverage_status=updates.get("workflow_status"),
                    target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
                    target_user=assigned_to.get("user"),
                    contact_id=assigned_to.get("contact"),
                    message="assignment_planning_xmp_file_msg",
                    meta_message="assignment_details_email",
                    coverage_type=get_coverage_type_name(updates.get("planning", {}).get("g2_content_type", "")),
                    slugline=planning.get("slugline", ""),
                    assignment=updated_assignment,
                )

        # Copy Assignment updates back onto the Coverage so it gets stored in the DB
        if assignment_updates.get("assigned_to"):
            updates["assigned_to"].update(assignment_updates["assigned_to"])

        if assignment_updates.get("priority"):
            updates["assigned_to"]["priority"] = assignment_updates["priority"]

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

    async def duplicate_coverage_for_article_rewrite(self, planning_id, coverage_id, updates):
        planning = await self.find_one_async(req=None, _id=planning_id)

        if not planning:
            raise SuperdeskApiError.badRequestError(_("Planning does not exist"))

        coverages = planning.get("coverages") or []
        try:
            coverage = next(c for c in coverages if c.get("coverage_id") == coverage_id)
        except StopIteration:
            raise SuperdeskApiError.badRequestError(_("Coverage does not exist"))

        coverage_planning = coverage.get("planning") or {}
        updates_planning = updates.get("planning") or {}
        coverages.append(
            {
                "planning": {
                    "g2_content_type": updates_planning.get("g2_content_type")
                    or coverage_planning.get("g2_content_type"),
                    "slugline": updates_planning.get("slugline") or coverage_planning.get("slugline"),
                    "scheduled": updates_planning.get("scheduled") or coverage_planning.get("scheduled"),
                },
                "news_coverage_status": updates.get("news_coverage_status") or coverage.get("news_coverage_status"),
                "workflow_status": WORKFLOW_STATE.ACTIVE,
                "assigned_to": updates.get("assigned_to") or coverage.get("assigned_to"),
            }
        )

        coverage_ids = [c["coverage_id"] for c in coverages if c.get("coverage_id")]
        new_plan = await self.patch_async(planning[ID_FIELD], {"coverages": coverages})

        try:
            new_coverage = next(c for c in new_plan["coverages"] if c.get("coverage_id") not in coverage_ids)
        except StopIteration:
            raise SuperdeskApiError.badRequestError(_("New coverage was not found!"))

        planning.update(new_plan)
        return planning, new_coverage

    async def remove_assignment(self, assignment_item):
        coverage_id = assignment_item.get("coverage_item")
        planning_item = await self.find_one_async(req=None, _id=assignment_item.get("planning_item"))

        if not planning_item or assignment_item.get("_to_delete"):
            return planning_item

        coverages = planning_item.get("coverages") or []
        try:
            coverage_item = next(c for c in coverages if c.get("coverage_id") == coverage_id)
        except StopIteration:
            raise SuperdeskApiError.badRequestError(_("Coverage does not exist"))

        if not coverage_item.get("assigned_to"):
            # Assignment was already removed (unposting a planning item scenario)
            return planning_item

        await self.send_remove_assignment_notifications(planning_item, coverage_item, assignment_item)
        for s in coverage_item.get("scheduled_updates") or []:
            if "assigned_to" in s:
                s["assigned_to"] = {}
            s["workflow_status"] = WORKFLOW_STATE.DRAFT

        if "assigned_to" in coverage_item:
            coverage_item["assigned_to"] = {}
        coverage_item["workflow_status"] = WORKFLOW_STATE.DRAFT

        updated_planning = await self.system_update_async(
            planning_item[ID_FIELD], {"coverages": coverages}, planning_item
        )

        await PlanningAutosaveAsyncService().on_assignment_removed(planning_item[ID_FIELD], coverage_id)

        updated_planning["related_events"] = get_related_event_links_for_planning(planning_item)

        return updated_planning

    async def send_remove_assignment_notifications(
        self, planning_item: dict, coverage_item: dict, assignment_item: dict
    ) -> None:
        for s in coverage_item.get("scheduled_updates") or []:
            assigned_to = s.get("assigned_to")
            await PlanningNotifications().notify_assignment(
                coverage_status=s.get("workflow_status"),
                target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
                target_user=assigned_to.get("user"),
                message="assignment_removed_msg",
                coverage_type=get_coverage_type_name(coverage_item.get("planning", {}).get("g2_content_type", "")),
                slugline=planning_item.get("slugline", ""),
            )

        assigned_to = assignment_item.get("assigned_to") or {}
        await PlanningNotifications().notify_assignment(
            coverage_status=coverage_item.get("workflow_status"),
            target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
            target_user=assigned_to.get("user"),
            message="assignment_removed_msg",
            coverage_type=get_coverage_type_name(coverage_item.get("planning", {}).get("g2_content_type", "")),
            slugline=planning_item.get("slugline", ""),
        )

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

    async def on_event_converted_to_recurring(self, updates, original):
        event_id = original[ID_FIELD]
        for item in await get_related_planning_for_events_async([original[ID_FIELD]]):
            related_events = get_related_event_links_for_planning(item)

            # Set the ``recurrence_id`` in the ``planning.related_events`` field
            for event in related_events:
                if event["_id"] == event_id:
                    event["recurrence_id"] = updates["recurrence_id"]
                    break
            await self.patch_async(
                item[ID_FIELD],
                {
                    "recurrence_id": updates["recurrence_id"],
                    "related_events": related_events,
                },
            )

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

    async def set_slugline_from_xmp(self, updates_coverage, original_coverage=None):
        xmp_file = await self.get_xmp_file_for_updates(updates_coverage, original_coverage, for_slugline=True)
        if not xmp_file:
            return

        parsed = etree.parse(xmp_file)
        xmp_slugline_mapping = get_planning_xmp_slugline_mapping()
        tags = parsed.xpath(xmp_slugline_mapping["xpath"], namespaces=xmp_slugline_mapping["namespaces"])
        if tags:
            updates_coverage["planning"]["slugline"] = tags[0].text

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

    async def duplicate_xmp_file(self, coverage):
        cov_plan = coverage.get("planning") or {}
        if not (
            cov_plan.get("xmp_file")
            and get_coverage_type_name(cov_plan.get("g2_content_type")) in ["Picture", "picture"]
        ):
            return

        file_id = coverage["planning"]["xmp_file"]
        xmp_file = await get_resource_service("planning_files").find_one_async(req=None, _id=file_id)
        coverage_msg = "Duplicating Coverage: {}".format(coverage["coverage_id"])
        if not xmp_file:
            logger.error("XMP File {} attached to coverage not found. {}".format(file_id, coverage_msg))
            return

        app = get_current_app()
        xmp_file = app.media.get(xmp_file["media"], resource="planning_files")
        if not xmp_file:
            logger.error("Media file for XMP File {} not found. {}".format(file_id, coverage_msg))
            return

        try:
            buf = BytesIO()
            buf.write(xmp_file.read())
            buf.seek(0)
            media_id = app.media.put(
                buf,
                resource="planning_files",
                filename=xmp_file.name,
                content_type="application/octet-stream",
            )
        except Exception as e:
            logger.exception("Error creating media file. {}. Exception: {}".format(coverage_msg, e))
        planning_file_ids = await get_resource_service("planning_files").post_async([{"media": media_id}])
        coverage["planning"]["xmp_file"] = planning_file_ids[0]

    async def _update_recurring_planning_items(self, updates, original, update_method):
        SKIP_PLANNING_FIELDS = {
            "_id",
            "guid",
            "unique_id",
            "original_creator",
            "firstcreated",
            "lock_user",
            "lock_time",
            "lock_session",
            "lock_action",
            "revert_state",
            "ingest_provider",
            "source",
            "original_source",
            "ingest_provider_sequence",
            "ingest_firstcreated",
            "ingest_versioncreated",
            "related_events",
            "state",
            "pubstatus",
            "expiry",
            "expired",
            "featured",
            "_planning_schedule",
            "_updates_schedule",
            "planning_date",
            "state_reason",
        }
        SKIP_COVERAGE_FIELDS = {
            "coverage_id",
            "original_coverage_id",
            "guid",
            "original_creator",
            "firstcreated",
            "previous_status",
        }
        app = get_current_app().as_any()
        for plan in self._iter_recurring_plannings_to_update(updates, original, update_method):
            plan_updates = deepcopy(updates)
            for field in SKIP_PLANNING_FIELDS:
                plan_updates.pop(field, None)

            try:
                planning_date_diff = updates["planning_date"] - original["planning_date"]
                if planning_date_diff:
                    plan_updates["planning_date"] = plan["planning_date"] + planning_date_diff
            except KeyError:
                pass

            if len(updates.get("coverages") or []) and len(plan.get("coverages") or []):
                plan_updates["coverages"] = deepcopy(plan["coverages"])
                for coverage in plan_updates["coverages"]:
                    try:
                        original_coverage_id = coverage["original_coverage_id"]
                    except KeyError:
                        continue

                    coverage_updates = get_coverage_by_id(updates, original_coverage_id, "original_coverage_id")
                    if coverage_updates is None:
                        continue

                    for field, value in coverage_updates.items():
                        if field in SKIP_COVERAGE_FIELDS:
                            continue
                        elif field == "assigned_to":
                            if coverage.get("workflow_status") != WORKFLOW_STATE.DRAFT:
                                # This coverage has already been added to the workflow
                                # ``assigned_to`` information should be managed from the Assignment not Coverage
                                continue

                            # Copy the ``assigned_to`` data, keeping the original ``assignment_id`` (if any)
                            original_assignment_id = coverage.get("assignment_id")
                            coverage[field] = deepcopy(value)
                            if original_assignment_id is not None:
                                coverage[field]["assignment_id"] = original_assignment_id
                        elif field == "planning":
                            original_scheduled = (coverage.get("planning") or {}).get("scheduled")
                            coverage["planning"] = deepcopy(value)
                            coverage_original = get_coverage_by_id(
                                original, original_coverage_id, "original_coverage_id"
                            )
                            if coverage_original is not None:
                                scheduled_diff = value["scheduled"] - coverage_original["planning"]["scheduled"]
                                coverage["planning"]["scheduled"] = original_scheduled + scheduled_diff
                            else:
                                coverage["planning"]["scheduled"] = original_scheduled
                        else:
                            coverage[field] = deepcopy(value)

                # Add new Coverages that were added during this update request
                for coverage in updates["coverages"]:
                    if get_coverage_by_id(original, coverage["coverage_id"]) is not None:
                        # Skip this one, as this Coverage exists in the original
                        continue

                    new_coverage = deepcopy(coverage)
                    for field in SKIP_COVERAGE_FIELDS:
                        new_coverage.pop(field, None)

                    # Remove the Assignment ID (if any)
                    try:
                        new_coverage["assigned_to"].pop("assignment_id", None)
                    except (KeyError, TypeError):
                        pass

                    # Set the new scheduled date, relative to the planning date
                    try:
                        plan_date = plan_updates.get("planning_date") or plan["planning_date"]
                        if plan_date:
                            scheduled_diff = coverage["planning"]["scheduled"] - (
                                updates.get("planning_date") or original.get("planning_date")
                            )
                            new_coverage["planning"]["scheduled"] = plan_date + scheduled_diff
                    except (KeyError, TypeError):
                        pass

                    plan_updates["coverages"].append(new_coverage)

            await self.patch_async(plan["_id"], plan_updates)
            await app.on_updated_planning.call_async(plan_updates, {"_id": plan["_id"]})

    def _iter_recurring_plannings_to_update(self, updates, original, update_method):
        selected_start = updates.get("planning_date") or original.get("planning_date")
        # Make sure we are working with a datetime instance
        if not isinstance(selected_start, datetime):
            selected_start = datetime.strptime(selected_start, "%Y-%m-%dT%H:%M:%S%z")

        try:
            lookup = {"planning_recurrence_id": original["planning_recurrence_id"]}
        except KeyError:
            return

        for plan in self.get_from_mongo(req=None, lookup=lookup):
            if plan["_id"] == original["_id"]:
                # Skip this Planning item, as it is the same item provided to the update request
                continue
            elif update_method == UPDATE_FUTURE and plan["planning_date"] < selected_start:
                continue
            yield plan

    async def inherit_planning_metadata(self, coverage: dict, updates: dict, original: dict) -> None:
        """
        Inherit planning metadata fields to coverage if not explicitly set in coverage profile.
        The fields inherited are those overlapping metadata fields from the planning schema and coverage schema
        """

        schema: CoverageProfile | None = None

        if coverage.get("profile"):
            schema = await get_coverage_schema(coverage["profile"])
            if not schema:
                logger.warning(
                    "Issue copying Planning metadata to Coverage, CoverageProfile not found",
                    extra={
                        "coverage_id": coverage.get("coverage_id"),
                        "profile": coverage["profile"],
                    },
                )

        supported_fields = {"anpa_category", "subject", "genre", "priority", "location", "headline", "slugline"}

        if schema:
            custom_vocabulary_fields = get_custom_vocabulary_fields_from_profile(schema)
            enabled_fields = {
                field
                for field in get_enabled_fields(schema)
                if field in supported_fields and field not in custom_vocabulary_fields
            }
        else:
            enabled_fields = supported_fields
            custom_vocabulary_fields = set()

        for field in enabled_fields:
            value = updates.get(field, original.get(field))
            if field != "subject" and value:
                coverage["planning"].setdefault(field, value)

        subjects: list[dict] | None = updates.get("subject", original.get("subject"))
        if subjects and "subject" not in coverage["planning"]:
            # Copy ``Subject`` and ``Custom Vocabulary`` fields that are enabled in both Planning and Coverage profiles
            coverage["planning"]["subject"] = [
                subject
                for subject in subjects
                if (
                    (not subject.get("scheme") and "subject" in enabled_fields)
                    or (subject.get("scheme") in custom_vocabulary_fields)
                )
            ]

    @staticmethod
    def _should_update_version_creator(updates, original):
        """
        Check if version_creator and versioncreated should be updated.

        Uses an exclusion approach since planning fields are dynamic and configurable.
        Returns True if planning fields changed, False for coverage-only or system field changes.
        """
        excluded_fields = set(history_fields_to_remove) | {
            "coverages",
            "update_method",
            "state",
            "pubstatus",
            "state_reason",
            "revert_state",
            "expired",
            "versionposted",
            "version",
        }

        for field in updates.keys():
            if field not in excluded_fields:
                if updates.get(field) != original.get(field):
                    return True

        return False


class PlanningResource(Resource):
    """Resource for planning data model

    See IPTC-G2-Implementation_Guide (version 2.21) Section 16.5 for schema details
    """

    endpoint_name = url = "planning"
    item_url = item_url
    schema = planning_schema
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
