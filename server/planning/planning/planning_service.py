import logging

from io import BytesIO
from lxml import etree
from copy import deepcopy
from bson import ObjectId
from datetime import datetime
from typing_extensions import assert_never
from typing import AsyncGenerator, Any, cast

from apps.auth import get_user, get_auth

from superdesk.core import get_current_app
from superdesk.utc import utcnow, utc_to_local
from superdesk.errors import SuperdeskApiError
from superdesk.resource_fields import ID_FIELD
from superdesk.metadata.item import GUID_NEWSML
from superdesk.notification import push_notification
from superdesk import get_resource_service, get_app_config
from superdesk.core.utils import date_to_str, generate_guid

from planning import PlanningNotifications
from planning.content_profiles.utils import is_field_enabled
from planning.events.events_utils import get_recurring_timeline
from planning.types.enums import AssignmentWorkflowState, LinkType
from planning.types.common import ScheduledUpdate, PlanningCoverage, RelatedEvent
from planning.common import (
    WORKFLOW_STATE,
    unique_items_in_order,
    WorkflowStates,
    DEFAULT_ASSIGNMENT_PRIORITY,
    TO_BE_CONFIRMED_FIELD,
    get_coverage_status_from_cv,
    get_coverage_type_name,
    get_planning_xmp_assignment_mapping,
    get_planning_use_xmp_for_pic_slugline,
    get_planning_xmp_slugline_mapping,
    get_planning_use_xmp_for_pic_assignments,
    TEMP_ID_PREFIX,
    get_planning_allow_scheduled_updates,
    update_post_item,
    sync_assignment_details_to_coverages,
)
from planning.core.service import BasePlanningAsyncService
from planning.types import (
    PlanningResourceModel,
    ContentProfile,
    UpdateMethods,
    EventResourceModel,
)
from planning.utils import (
    get_related_event_links_for_planning,
    get_related_planning_for_events,
    get_planning_event_link_method,
    get_first_related_event_id_for_planning,
    get_related_event_ids_for_planning,
)

from .planning_utils import get_coverage_by_id

logger = logging.getLogger(__name__)


class PlanningAsyncService(BasePlanningAsyncService[PlanningResourceModel]):
    resource_name = "planning"

    @staticmethod
    def has_coverage_changed(updates: PlanningCoverage, original: PlanningCoverage) -> bool:
        for field in ["news_coverage_status", "planning", "workflow_status"]:
            if getattr(updates, field) != getattr(original, field):
                return True
        return False

    async def get_expired_items(
        self, expiry_datetime: datetime, spiked_planning_only: bool = False
    ) -> AsyncGenerator[list[dict[str, Any]], None]:
        """
        Retrieve "expired" items which are those whose planning_date is before `expiry_datetime` and
        have no future schedules or primary-linked events, and are not already expired.

        By default, items are filtered to exclude:
        - Items linked to a primary event or,
        - Items already expired or,
        - Items with future scheduling or a planning_date beyond `expiry_datetime`.

        If `spiked_planning_only` is True, only spiked items are returned, still excluding
        those with future schedules or planning_dates.
        """
        nested_filter = {
            "nested": {
                "path": "_planning_schedule",
                "query": {"range": {"_planning_schedule.scheduled": {"gt": date_to_str(expiry_datetime)}}},
            }
        }
        range_filter = {"range": {"planning_date": {"gt": date_to_str(expiry_datetime)}}}
        query: dict[str, Any] = {
            "query": {
                "bool": {
                    "must_not": [
                        {
                            "nested": {
                                "path": "related_events",
                                "query": {"term": {"related_events.link_type": "primary"}},
                            },
                        },
                        {"term": {"expired": True}},
                        nested_filter,
                        range_filter,
                    ]
                }
            }
        }

        if spiked_planning_only:
            query = {
                "query": {
                    "bool": {
                        "must_not": [nested_filter, range_filter],
                        "must": [{"term": {"state": WORKFLOW_STATE.SPIKED}}],
                    }
                }
            }

        query["sort"] = [{"planning_date": "asc"}]
        query["size"] = 200

        total_received = 0
        total_items = -1

        while True:
            query["from"] = total_received

            results = await self.search(query)
            items = await results.to_list_raw()
            results_count = len(items)

            # If the total_items has not been set, then this is the first query
            # In which case we need to store the total hits from the search
            if total_items < 0:
                total_items = results_count

                # If the search doesn't contain any results, return here
                if total_items < 1:
                    break

            # If the last query doesn't contain any results, return here
            if results_count == 0:
                break

            total_received += results_count

            # Yield the results for iteration by the callee
            yield items

    async def on_event_converted_to_recurring(self, updates: dict[str, Any], original: EventResourceModel):
        for item in get_related_planning_for_events([original.id]):
            related_events = get_related_event_links_for_planning(item)

            # Set the ``recurrence_id`` in the ``planning.related_events`` field
            for event in related_events:
                if event["_id"] == original.id:
                    event["recurrence_id"] = updates["recurrence_id"]
                    break

            await self.update(
                item[ID_FIELD],
                {
                    "recurrence_id": updates["recurrence_id"],
                    "related_events": related_events,
                },
            )

    async def create(self, _docs: list[PlanningResourceModel | dict[str, Any]]) -> list[str]:
        docs = await self._convert_dicts_to_model(_docs)
        await self.prepare_planning_data(docs)
        return await super().create(docs)

    async def on_update(self, updates: dict[str, Any], original: PlanningResourceModel) -> None:
        await super().on_update(updates, original)

        update_method = updates.pop("update_method", UpdateMethods.SINGLE)
        updates.setdefault("versioncreated", utcnow())

        user = get_user()
        self.validate_on_update(updates, original, user)

        updated_planning = PlanningResourceModel.from_dict(updates)
        self._handle_coverages(updated_planning, original)
        self.set_planning_schedule(updated_planning, original)

        # set the updates dictionary with the values from the pydantic model
        # in case the object was edited in-place.
        # TODO-ASYNC: unify everything to use only pydantic models
        updates = updated_planning.to_dict()

        if update_method and update_method != UpdateMethods.SINGLE:
            await self._update_recurring_planning_items(updates, original, update_method)

    async def on_updated(self, updates: dict[str, Any], original_obj: PlanningResourceModel):
        # TODO-ASYNC: figure out what to do with the `from_ingest` param here
        original = original_obj.to_dict()
        added, removed = self._get_added_removed_agendas(updates, original)
        item_id = str(original[ID_FIELD])
        session_id = get_auth().get(ID_FIELD)
        user_id = str(updates.get("version_creator", ""))
        doc = deepcopy(original)
        doc.update(updates)

        push_notification(
            "planning:updated",
            item=item_id,
            user=str(updates.get("version_creator", "")),
            added_agendas=added,
            removed_agendas=removed,
            session=session_id,
            event_ids=get_related_event_ids_for_planning(doc, "primary"),
        )

        self.generate_related_assignments([doc])
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
                from_ingest=False,
                # from_ingest=from_ingest, # TODO-ASYNC: adjust when we know how to tackle this
            )

        posted = update_post_item(updates, original)
        if posted:
            new_planning = self.find_one(req=None, _id=original.get(ID_FIELD))
            updates["_etag"] = new_planning["_etag"]

    @staticmethod
    def _get_added_removed_agendas(updates, original):
        updated_agendas = [str(a) for a in (updates.get("agendas") or [])]
        existing_agendas = [str(a) for a in (original.get("agendas") or [])]
        removed_agendas = list(set(existing_agendas) - set(updated_agendas))
        added_agendas = list(set(updated_agendas) - set(existing_agendas))
        return added_agendas, removed_agendas

    @staticmethod
    def generate_related_assignments(docs):
        for doc in docs:
            doc.pop("_planning_schedule", None)
            doc.pop("_updates_schedule", None)
            sync_assignment_details_to_coverages(doc)

    def validate_on_update(self, updates: dict[str, Any], original: PlanningResourceModel, user: dict[str, Any]):
        lock_user = original.lock_user
        str_user_id = str(user.get(ID_FIELD)) if user else None

        if lock_user and str(lock_user) != str_user_id:
            raise SuperdeskApiError.forbiddenError("The item was locked by another user")

        self.validate_planning(updates, original)

    async def _update_recurring_planning_items(
        self, updates: dict[str, Any], original: PlanningResourceModel, update_method: str
    ):
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

        async for plan in self._iter_recurring_plannings_to_update(updates, original, update_method):
            plan_updates = deepcopy(updates)
            for field in SKIP_PLANNING_FIELDS:
                plan_updates.pop(field, None)

            try:
                planning_date_diff = updates["planning_date"] - original.planning_date
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
                                original.to_dict(), original_coverage_id, "original_coverage_id"
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
                    if get_coverage_by_id(original.to_dict(), coverage["coverage_id"]) is not None:
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
                                updates.get("planning_date") or original.planning_date
                            )
                            new_coverage["planning"]["scheduled"] = plan_date + scheduled_diff
                    except (KeyError, TypeError):
                        pass

                    plan_updates["coverages"].append(new_coverage)

            # TODO-ASYNC: discuss what's a good replacement or approach to substitute `patch` method usages
            # we no longer have `patch` method in async services so using system_update to skip
            # on_update and on_updated hooks here
            await self.system_update(plan["_id"], plan_updates)

            # TODO-ASYNC: check if this is being used, although it seems it is not
            # app.on_updated_planning(plan_updates, {"_id": plan["_id"]})

    async def _iter_recurring_plannings_to_update(
        self, updates: dict[str, Any], original: PlanningResourceModel, update_method
    ):
        selected_start = updates.get("planning_date") or original.planning_date
        assert selected_start is not None

        # Make sure we are working with a datetime instance
        if not isinstance(selected_start, datetime):
            selected_start = datetime.strptime(selected_start, "%Y-%m-%dT%H:%M:%S%z")

        try:
            lookup = {"planning_recurrence_id": original.planning_recurrence_id}
        except KeyError:
            return

        plans_cursor = await self.search(lookup, use_mongo=True)
        for plan in await plans_cursor.to_list_raw():
            if plan["_id"] == original.id:
                # Skip this Planning item, as it is the same item provided to the update request
                continue
            elif update_method == UpdateMethods.FUTURE and plan["planning_date"] < selected_start:
                continue
            yield plan

    async def prepare_planning_data(self, docs: list[PlanningResourceModel]):
        """
        Set default metadata.
        """
        planning_type = get_resource_service("planning_types").find_one(req=None, name="planning")
        history_service = get_resource_service("planning_history")
        generated_planning_items = []

        for doc in docs:
            if not doc.language:
                doc.language = doc.languages[0] if len(doc.languages) > 0 else get_app_config("DEFAULT_LANGUAGE")

            # TODO-ASYNC: consider moving the validation to the pydantic model instead
            self.validate_planning(doc.to_dict())

            # remove duplicate agendas
            if doc.agendas:
                doc.agendas = unique_items_in_order(doc.agendas)

            first_event = await self._populate_planning_from_event(doc, planning_type)
            self._handle_coverages(doc)
            self.set_planning_schedule(doc)

            # set timestamps
            doc.firstcreated = utcnow()
            doc.versioncreated = utcnow()

            is_ingested = doc.state == WorkflowStates.INGESTED
            if is_ingested:
                history_service.on_item_created([doc.to_dict()])

            update_method = doc.update_method
            doc.update_method = None
            if first_event and update_method is not None:
                new_plans = await self._add_planning_to_event_series(doc, first_event, update_method)
                if len(new_plans):
                    if is_ingested:
                        history_service.on_item_created(new_plans)
                    generated_planning_items.extend(new_plans)

        if len(generated_planning_items):
            docs.extend(generated_planning_items)

    def validate_planning(self, updated_planning: dict[str, Any], original=None):
        if (not original and not updated_planning.get("planning_date")) or (
            "planning_date" in updated_planning and updated_planning["planning_date"] is None
        ):
            raise SuperdeskApiError(message="Planning item should have a date")

        # TODO-ASYNC: Move this sanitize logic to the pydantic model instead
        # sanitize_input_data(updated_planning)

        self._validate_events_links(updated_planning)

        # Validate if agendas being added are enabled agendas
        agenda_service = get_resource_service("agenda")
        for agenda_id in updated_planning.get("agendas", []):
            agenda = agenda_service.find_one(req=None, _id=agenda_id)
            if not agenda:
                raise SuperdeskApiError.forbiddenError("Agenda '{}' does not exist".format(agenda_id))

            if not agenda.get("is_enabled", False) and (
                original is None or agenda_id not in original.get("agendas", [])
            ):
                raise SuperdeskApiError.forbiddenError("Agenda '{}' is not enabled".format(agenda.get("name")))

        # Validate scheduled updates
        for coverage in updated_planning.get("coverages") or []:
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

    def _handle_coverages(self, updated_planning: PlanningResourceModel, original: PlanningResourceModel | None = None):
        if not updated_planning.coverages:
            return

        if not original:
            original = PlanningResourceModel(planning_date=utcnow())

        self.remove_deleted_coverages(updated_planning, original)
        self.add_coverages(updated_planning, original)
        self.update_coverages(updated_planning, original)

    def set_planning_schedule(
        self, updated_planning: PlanningResourceModel, original_planning: PlanningResourceModel | None = None
    ):
        """This set the list of schedule based on the coverage and planning.

        Sorting currently works on two fields "planning_date" and "scheduled" date.
        "planning_date" is stored on the planning and is equal to event start date for planning items
        created from event or current date for adhoc planning item
        "scheduled" is stored on the coverage nested document and it is optional.
        Hence to sort and filter planning based on these two dates a
        nested documents of scheduled date is required

        :param dict updated_planning: planning update document
        :param dict original_planning: planning original document
        """

        planning_date = (
            updated_planning.planning_date or (original_planning and original_planning.planning_date) or utcnow()
        )
        add_default_schedule = True
        add_default_updates_schedule = True

        schedule = []
        updates_schedule = []
        for coverage in updated_planning.coverages:
            if coverage.planning.scheduled:
                add_default_schedule = False

            schedule.append(
                {
                    "coverage_id": coverage.coverage_id,
                    "scheduled": coverage.planning.scheduled,
                }
            )

            for s in coverage.scheduled_updates:
                if s.planning.scheduled and add_default_updates_schedule:
                    add_default_updates_schedule = False

                updates_schedule.append(
                    {
                        "scheduled_update_id": s.scheduled_update_id,
                        "scheduled": s.planning.scheduled,
                    }
                )

        if add_default_schedule:
            schedule.append({"coverage_id": None, "scheduled": planning_date or utcnow()})

        if add_default_updates_schedule:
            updates_schedule.append({"scheduled_update_id": None, "scheduled": planning_date or utcnow()})

        updated_planning.planning_schedule = schedule  # type: ignore[assignment]
        updated_planning.updates_schedule = updates_schedule  # type: ignore[assignment]

    def remove_deleted_coverages(
        self, updated_planning: PlanningResourceModel, original_planning: PlanningResourceModel
    ):
        """
        Removes coverages that exist in the original planning but are no longer present in the updated planning.

        This method compares the coverages in the `updated_planning` against the `original_planning`. For any coverage
        in `original_planning` that is missing in `updated_planning`, all associated scheduled updates and the coverage
        itself are removed using the `validate_and_remove_coverage_entity` method.
        """

        if not updated_planning.coverages:
            return

        for orig_coverage in original_planning.coverages:
            updated_coverage = next(
                (cov for cov in updated_planning.coverages if cov.coverage_id == orig_coverage.coverage_id),
                None,
            )

            if not updated_coverage:
                for scheduled_update in orig_coverage.scheduled_updates:
                    self.validate_and_remove_coverage_entity(scheduled_update, original_planning)

                self.validate_and_remove_coverage_entity(orig_coverage, original_planning)

    def validate_and_remove_coverage_entity(
        self,
        coverage_entity: ScheduledUpdate | PlanningCoverage,
        original_planning: PlanningResourceModel,
        entity_type: str = "coverage",
    ):
        """
        Validates conditions and removes a coverage entity or scheduled update from a planning item.

        - Raises an error if the planning item is cancelled.
        - Raises an error if the coverage entity has an assignment in a state that prevents deletion (draft or cancelled).
        - Proceeds to create or update an assignment
        """
        if original_planning.state == WorkflowStates.CANCELLED:
            raise SuperdeskApiError.badRequestError(f"Cannot remove `{entity_type}` of a cancelled planning item")

        assignment = coverage_entity.assigned_to
        if assignment and assignment.state not in [
            WorkflowStates.DRAFT,
            WorkflowStates.CANCELLED,
            None,
        ]:
            raise SuperdeskApiError.badRequestError(
                f"Assignment already exists. `{entity_type.capitalize()}` cannot be deleted."
            )

        coverage_entity_dict = coverage_entity.to_dict()
        updated_coverage_entity = deepcopy(coverage_entity_dict)
        updated_coverage_entity.pop("assigned_to", None)

        self._create_or_update_assignment(original_planning, {}, updated_coverage_entity, coverage_entity_dict)

    def add_coverages(self, updated_planning: PlanningResourceModel, original: PlanningResourceModel):
        if not updated_planning.coverages:
            return

        planning_date = original.planning_date or updated_planning.planning_date
        original_coverage_ids = [coverage.coverage_id for coverage in original.coverages if coverage.coverage_id]

        for coverage in updated_planning.coverages:
            coverage_id = coverage.coverage_id or ""
            is_temporal_coverage = TEMP_ID_PREFIX in coverage_id

            if not coverage_id or is_temporal_coverage or coverage_id not in original_coverage_ids:
                if "duplicate" in coverage_id or coverage.original_coverage_id:
                    coverage.planning.xmp_file = self.duplicate_xmp_file(coverage.to_dict())

                # coverage to be created
                if not coverage_id or is_temporal_coverage:
                    coverage.coverage_id = generate_guid(type=GUID_NEWSML)

                if coverage.original_coverage_id is None:
                    coverage.original_coverage_id = coverage.coverage_id

                coverage.firstcreated = utcnow()

                # Make sure the coverage has a ``scheduled`` date
                # If none was supplied, fallback to ``planning.planning_date``
                if not coverage.planning.scheduled:
                    coverage.planning.scheduled = planning_date

                coverage.original_creator = get_user().get(ID_FIELD)

                self.set_coverage_active(coverage, updated_planning)
                self.set_slugline_from_xmp(coverage, None)
                self._create_or_update_assignment(original, updated_planning.to_dict(), coverage.to_dict())
                self.add_scheduled_updates(updated_planning, original, coverage)

    def update_coverages(self, updated_planning: PlanningResourceModel, original: PlanningResourceModel):
        if not updated_planning.coverages:
            return

        for coverage in updated_planning.coverages:
            coverage_id = coverage.coverage_id
            original_coverage = next(
                (cov for cov in original.coverages if cov.coverage_id == coverage_id),
                None,
            )
            if not original_coverage:
                continue

            if (
                original_coverage.flags.no_content_linking != coverage.flags.no_content_linking
            ) and coverage.workflow_status != WORKFLOW_STATE.DRAFT:
                raise SuperdeskApiError.badRequestError(
                    "Cannot edit content linking flag of a coverage already in workflow"
                )

            # Make sure the coverage update has a ``scheduled`` date
            # If none was supplied, fallback to ``original.planning.scheduled``
            if coverage.planning.scheduled is None:
                coverage.planning.scheduled = original_coverage.planning.scheduled

            self.set_coverage_active(coverage, updated_planning)
            self.set_slugline_from_xmp(coverage, original_coverage)

            if self.has_coverage_changed(coverage, original_coverage):
                user = get_user()
                if user:
                    # ``version_creator`` cannot be null
                    coverage.version_creator = user.get(ID_FIELD)
                coverage.versioncreated = utcnow()
                contact_id = coverage.contact or original_coverage.assigned_to.contact

                # If the internal note has changed send a notification, except if it's been cancelled
                if (
                    coverage.planning.internal_note != original_coverage.planning.internal_note
                    and coverage.news_coverage_status.qcode != "ncostat:notint"
                ):
                    target_user = coverage.assigned_to.user or original_coverage.assigned_to.user
                    target_desk = coverage.assigned_to.desk or original_coverage.assigned_to.desk

                    PlanningNotifications().notify_assignment(
                        coverage_status=coverage.workflow_status,
                        target_desk=target_desk if target_user is None else None,
                        target_user=target_user,
                        contact_id=contact_id,
                        message="assignment_internal_note_msg",
                        coverage_type=get_coverage_type_name(coverage.planning.g2_content_type),
                        slugline=coverage.planning.slugline or "",
                        internal_note=coverage.planning.internal_note or "",
                    )

                # If the scheduled time for the coverage changes
                if (coverage.planning.scheduled or datetime.min).strftime("%c") != (
                    original_coverage.planning.scheduled or datetime.min
                ).strftime("%c"):
                    target_user = coverage.assigned_to.user or original_coverage.assigned_to.user
                    target_desk = coverage.assigned_to.desk or original_coverage.assigned_to.desk

                    PlanningNotifications().notify_assignment(
                        coverage_status=coverage.workflow_status,
                        target_desk=target_desk if target_user is None else None,
                        target_user=target_user,
                        contact_id=contact_id,
                        message="assignment_due_time_msg",
                        due=utc_to_local(get_app_config("DEFAULT_TIMEZONE"), coverage.planning.scheduled).strftime(
                            "%c"
                        ),
                        coverage_type=get_coverage_type_name(coverage.planning.g2_content_type or ""),
                        slugline=coverage.planning.slugline or "",
                    )

            self.add_scheduled_updates(updated_planning, original, coverage)
            self.update_scheduled_updates(updated_planning, original, coverage, original_coverage)
            self.remove_scheduled_updates(original, coverage, original_coverage)

            self._create_or_update_assignment(
                original, updated_planning.to_dict(), coverage.to_dict(), original_coverage.to_dict()
            )

    def set_coverage_active(
        self,
        coverage: PlanningCoverage | ScheduledUpdate,
        planning: PlanningResourceModel,
        parent_coverage: dict[str, Any] | None = None,
    ) -> None:
        # If the coverage is created and assigned to a desk/user and the PLANNING_AUTO_ASSIGN_TO_WORKFLOW is
        # True the coverage will be created in workflow unless the override flag is set.
        if (
            get_app_config("PLANNING_AUTO_ASSIGN_TO_WORKFLOW", False)
            and (coverage.assigned_to.desk or coverage.assigned_to.user)
            and not planning.flags.overide_auto_assign_to_workflow
            and coverage.workflow_status == WorkflowStates.DRAFT
        ):
            coverage.workflow_status = WorkflowStates.ACTIVE

            # set all scheduled_updates to be activated
            for s in coverage.scheduled_updates:
                if s.assigned_to and s.workflow_status == WorkflowStates.DRAFT:
                    s.workflow_status = WorkflowStates.ACTIVE
            return

        assigned_to = coverage.assigned_to
        is_parent_coverage_status_active = (parent_coverage or {}).get("workflow_status") == WorkflowStates.ACTIVE
        if (assigned_to.state == AssignmentWorkflowState.ASSIGNED) or is_parent_coverage_status_active:
            coverage.workflow_status = WorkflowStates.ACTIVE
            return

    def add_scheduled_updates(
        self, updates: PlanningResourceModel, original: PlanningResourceModel, coverage: PlanningCoverage
    ):
        for s in coverage.scheduled_updates:
            if not get_planning_allow_scheduled_updates():
                raise SuperdeskApiError(message="Not configured to create scheduled updates to a coverage")

            if not s.scheduled_update_id or TEMP_ID_PREFIX in s.scheduled_update_id:
                s.coverage_id = coverage.coverage_id
                s.scheduled_update_id = generate_guid(type=GUID_NEWSML)
                self.set_scheduled_update_active(s, updates, coverage)
                self._create_or_update_assignment(original, updates.to_dict(), s.to_dict(), None, coverage.to_dict())

    def update_scheduled_updates(
        self,
        updates: PlanningResourceModel,
        original: PlanningResourceModel,
        coverage: PlanningCoverage,
        original_coverage: PlanningCoverage,
    ):
        for s in coverage.scheduled_updates:
            original_scheduled_update = next(
                (
                    orig_s
                    for orig_s in original_coverage.scheduled_updates
                    if s.scheduled_update_id == orig_s.scheduled_update_id
                ),
                None,
            )

            if original_scheduled_update:
                if (
                    original_scheduled_update.workflow_status == WORKFLOW_STATE.DRAFT
                    and s.workflow_status == WORKFLOW_STATE.ACTIVE
                ):
                    self.set_scheduled_update_active(s, updates, coverage)

                self._create_or_update_assignment(
                    original, updates.to_dict(), s.to_dict(), original_scheduled_update.to_dict(), coverage.to_dict()
                )

    def remove_scheduled_updates(
        self, original: PlanningResourceModel, coverage: PlanningCoverage, original_coverage: PlanningCoverage
    ):
        for s in original_coverage.scheduled_updates:
            updated_s = next(
                (
                    updated_s
                    for updated_s in coverage.scheduled_updates
                    if updated_s.scheduled_update_id == s.scheduled_update_id
                ),
                None,
            )

            if not updated_s:
                self.validate_and_remove_coverage_entity(s, original)

    def set_scheduled_update_active(
        self, scheduled_update: ScheduledUpdate, planning: PlanningResourceModel, coverage: PlanningCoverage
    ):
        self.set_coverage_active(scheduled_update, planning, coverage.to_dict())

        if (
            coverage.workflow_status == WORKFLOW_STATE.DRAFT
            and scheduled_update.workflow_status == WORKFLOW_STATE.ACTIVE
        ):
            raise SuperdeskApiError(
                message="Cannot add a scheduled update to workflow when original coverage is not in workflow"
            )

    async def _add_planning_to_event_series(
        self, plan: PlanningResourceModel, event: EventResourceModel, update_method: UpdateMethods
    ) -> list[PlanningResourceModel]:
        if update_method not in [UpdateMethods.FUTURE, UpdateMethods.ALL]:
            return []

        recurrence_id = event.recurrence_id
        if not recurrence_id:
            # Not a series of Events, can safely return
            return []

        plan.planning_recurrence_id = generate_guid(type=GUID_NEWSML)

        assert plan.planning_date is not None
        assert event.dates is not None
        assert event.dates.start is not None

        planning_date_relative = plan.planning_date - event.dates.start
        items = []

        historic, past, future = await get_recurring_timeline(event.to_dict())
        event_series = future if update_method == UpdateMethods.FUTURE else historic + past + future

        for series_entry in event_series:
            if series_entry["_id"] == event.id:
                # This is the Event that was provided
                # We assume a Planning item was already created for this Event
                continue

            new_plan = plan.to_dict()

            # Set the Planning & Event IDs for the new item
            new_plan["guid"] = new_plan["_id"] = generate_guid(type=GUID_NEWSML)
            new_plan["related_events"] = [
                RelatedEvent(id=series_entry["_id"], recurrence_id=recurrence_id, link_type=LinkType.PRIMARY)
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

            new_plan_model = PlanningResourceModel.from_dict(new_plan)
            self._handle_coverages(new_plan_model)
            self.set_planning_schedule(new_plan_model)

            items.append(new_plan_model)

        return items

    def _create_or_update_assignment(
        self,
        original_planning: PlanningResourceModel,
        planning_updates: dict[str, Any],
        coverage_updates: dict[str, Any],
        original_coverage: dict[str, Any] | None = None,
        parent_coverage: dict[str, Any] | None = None,
    ):
        """Creates or updates an assignment based on coverage and planning updates.

        - Creates a new assignment if none exists and sufficient details (user/desk) are provided
        - Updates an existing assignment with changes from coverage and planning updates
        - Removes an assignment if coverage is cancelled or in an invalid state
        - Notifies users if required updates are made
        """
        if not original_coverage:
            original_coverage = {}

        if not parent_coverage:
            parent_coverage = {}

        planning = original_planning.clone_with(planning_updates)
        coverage_doc = self._merge_coverage_updates(original_coverage, coverage_updates)
        assigned_to = coverage_updates.get("assigned_to") or original_coverage.get("assigned_to")

        if not assigned_to:
            return

        if not planning.id:
            raise SuperdeskApiError.badRequestError("Planning item is required to create assignments.")

        # Coverage is draft if original was draft and updates is still maintaining that state
        coverage_status = coverage_updates.get("workflow_status", original_coverage.get("workflow_status"))
        is_coverage_draft = coverage_status == WORKFLOW_STATE.DRAFT

        assignment_service = get_resource_service("assignments")
        translated_name, translated_value = self._apply_translations(planning, coverage_doc)

        assignment_id = assigned_to.get("assignment_id", None)
        if assignment_id is None and (assigned_to.get("user") or assigned_to.get("desk")):
            new_assignment_id, new_assigned_state = self._create_new_assignment(
                planning,
                coverage_doc,
                is_coverage_draft,
                assigned_to,
                translated_name,
                translated_value,
                parent_coverage,
            )
            coverage_updates["assigned_to"]["assignment_id"] = new_assignment_id
            coverage_updates["assigned_to"]["state"] = new_assigned_state
        elif assignment_id is not None:
            self.set_xmp_file_info(coverage_updates, original_coverage)

            if not coverage_updates.get("assigned_to"):
                if original_planning.state == WorkflowStates.CANCELLED or coverage_status not in [
                    WorkflowStates.CANCELLED,
                    WorkflowStates.DRAFT,
                ]:
                    raise SuperdeskApiError.badRequestError("Coverage not in correct state to remove assignment.")

                return self._remove_assignment(coverage_doc, original_planning, assignment_id)

            # update the assignment using the coverage details
            original_assignment = assignment_service.find_one(req=None, _id=assignment_id)
            if not original_assignment:
                raise SuperdeskApiError.badRequestError("Assignment related to the coverage does not exists.")

            # check if coverage was cancelled
            is_coverage_cancelled = self._cancel_coverage_if_needed(
                original_coverage, coverage_updates, original_assignment
            )
            if is_coverage_cancelled:
                return

            assignment_updates: dict[str, Any] = {}
            self._set_updates_from_coverage(
                assignment_updates,
                original_coverage,
                coverage_doc,
                coverage_updates,
                original_assignment,
                assigned_to,
                is_coverage_draft,
            )
            self._set_updates_from_planning(
                assignment_updates, planning, original_planning, planning_updates, translated_name, translated_value
            )
            self._notify_desk_users_if_needed(
                planning, original_planning, planning_updates, coverage_updates, assigned_to
            )

            # update only if anything got modified
            if {"planning", "assigned_to", "description_text", "name"} & assignment_updates.keys():
                assignment_service.system_update(ObjectId(assignment_id), assignment_updates, original_assignment)

            if self.is_xmp_updated(coverage_updates, original_coverage):
                PlanningNotifications().notify_assignment(
                    coverage_status=coverage_updates.get("workflow_status"),
                    target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
                    target_user=assigned_to.get("user"),
                    contact_id=assigned_to.get("contact"),
                    message="assignment_planning_xmp_file_msg",
                    meta_message="assignment_details_email",
                    coverage_type=get_coverage_type_name(
                        coverage_updates.get("planning", {}).get("g2_content_type", "")
                    ),
                    slugline=planning.slugline,
                    assignment=assignment_updates,
                )

    @staticmethod
    def _validate_events_links(updates: dict[str, Any]):
        ONLY_ONE_PRIMARY_LINKED_EVENT_ERROR = "Only 1 primary linked event is allowed"
        event_link_method = get_planning_event_link_method()

        if updates.get("related_events"):
            related_events_links = updates.get("related_events", [])
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

    @staticmethod
    async def _populate_planning_from_event(
        planning: PlanningResourceModel, planning_type: ContentProfile
    ) -> EventResourceModel | None:
        """
        Populate planning document information based on a linked event. Retrieves a primary linked event
        for the provided planning document, populates the planning document with relevant details
        (such as `headline` and `recurrence_id`), and returns the event.

        :param dict planning: planning document
        :param dict planning_type: planning type
        """
        from planning.events import EventsAsyncService

        event_id = get_first_related_event_id_for_planning(planning.to_dict(), "primary")
        if not event_id:
            return None

        event = await EventsAsyncService().find_by_id(event_id)
        if not event:
            logger.warning(
                "Failed to find linked event for planning",
                extra=dict(
                    event_id=event_id,
                    plan_id=planning.id,
                ),
            )
            return None

        if event.recurrence_id:
            planning.recurrence_id = event.recurrence_id

        # populate headline using name
        if event.name and is_field_enabled("headline", planning_type) and not planning.headline:
            planning.headline = event.name

        if event.time_to_be_confirmed:
            planning.time_to_be_confirmed = True

        return event

    @staticmethod
    def _create_new_assignment(
        planning: PlanningResourceModel,
        coverage_doc: dict[str, Any],
        is_draft: bool,
        assigned_to: dict[str, Any],
        translated_name: str,
        translated_value: dict[str, Any],
        parent_coverage: dict[str, Any],
    ) -> tuple[str, Any | None]:
        # Creating a new assignment
        assign_state = AssignmentWorkflowState.DRAFT if is_draft else AssignmentWorkflowState.ASSIGNED
        if not is_draft:
            # In case of article_rewrites, this will be 'in_progress' directly
            if assigned_to.get("state") and assigned_to["state"] != AssignmentWorkflowState.DRAFT:
                assign_state = cast(AssignmentWorkflowState, assigned_to.get("state"))

        if translated_value and translated_name and "headline" not in coverage_doc["planning"]:
            coverage_doc["planning"]["headline"] = translated_name

        assignment = {
            "assigned_to": {
                "user": assigned_to.get("user"),
                "desk": assigned_to.get("desk"),
                "contact": assigned_to.get("contact"),
                "state": assign_state,
            },
            "planning_item": planning.id,
            "coverage_item": coverage_doc.get("coverage_id"),
            "planning": deepcopy(coverage_doc.get("planning")),
            "priority": assigned_to.get("priority", DEFAULT_ASSIGNMENT_PRIORITY),
            "description_text": planning.description_text,
        }
        if translated_value and translated_name and assignment.get("name") != translated_value.get("name"):
            assignment["name"] = translated_name

        if coverage_doc.get("scheduled_update_id"):
            assignment["scheduled_update_id"] = coverage_doc["scheduled_update_id"]
            assignment["planning"] = deepcopy(parent_coverage.get("planning"))
            assignment["planning"].update(coverage_doc.get("planning"))

        if "coverage_provider" in assigned_to:
            assignment["assigned_to"]["coverage_provider"] = assigned_to.get("coverage_provider")

        if TO_BE_CONFIRMED_FIELD in coverage_doc:
            assignment["planning"][TO_BE_CONFIRMED_FIELD] = coverage_doc[TO_BE_CONFIRMED_FIELD]

        new_assignment_id = str(get_resource_service("assignments").post([assignment])[0])
        return new_assignment_id, assign_state

    @staticmethod
    def _remove_assignment(
        coverage_doc: dict[str, Any],
        original_planning: PlanningResourceModel,
        assignment_id: str,
    ):
        get_resource_service("assignments").delete(lookup={"_id": assignment_id})
        assignment = {
            "planning_item": original_planning.id,
            "coverage_item": coverage_doc.get("coverage_id"),
        }
        if coverage_doc.get("scheduled_update"):
            assignment["scheduled_update_id"] = coverage_doc.get("scheduled_update_id")

        get_resource_service("assignments_history").on_item_deleted(assignment)

    def _cancel_coverage_if_needed(
        self, original_coverage: dict[str, Any], coverage_updates: dict[str, Any], original_assignment: dict[str, Any]
    ) -> bool:
        """
        Checks in the updates if the coverage has been cancelled and proceeds to do so. Returns either True or False
        accordingly
        """
        coverage_cancel_state = get_coverage_status_from_cv("ncostat:notint")
        coverage_cancel_state.pop("is_active", None)
        workflow_status_changed = original_coverage.get("workflow_status") != coverage_updates.get("workflow_status")
        is_cancelled_the_new_status = coverage_updates.get("workflow_status") == WorkflowStates.CANCELLED

        if workflow_status_changed and is_cancelled_the_new_status:
            self.cancel_coverage(
                coverage_updates,
                coverage_cancel_state,
                original_coverage.get("workflow_status"),
                original_assignment,
                coverage_updates.get("planning", {}).get("workflow_status_reason"),
            )
            return True

        return False

    @staticmethod
    def _notify_desk_users_if_needed(
        planning: PlanningResourceModel,
        original_planning: PlanningResourceModel,
        planning_updates: dict[str, Any],
        coverage_updates: dict[str, Any],
        assigned_to: dict[str, Any],
    ):
        """
        It notifies the assigned users/desk if there has been a change in the planning internal note
        """

        if planning_updates.get("internal_note") and original_planning.internal_note != planning_updates.get(
            "internal_note"
        ):
            PlanningNotifications().notify_assignment(
                coverage_status=coverage_updates.get("workflow_status"),
                target_desk=assigned_to.get("desk") if assigned_to.get("user") is None else None,
                target_user=assigned_to.get("user"),
                contact_id=assigned_to.get("contact"),
                message="assignment_planning_internal_note_msg",
                coverage_type=get_coverage_type_name(coverage_updates.get("planning", {}).get("g2_content_type", "")),
                slugline=planning.slugline,
                internal_note=planning.internal_note or "",
                no_email=True,
            )

    def _set_updates_from_coverage(
        self,
        assignment: dict[str, Any],
        original_coverage: dict[str, Any],
        coverage_doc: dict[str, Any],
        coverage_updates: dict[str, Any],
        original_assignment: dict[str, Any],
        assigned_to: dict[str, Any],
        is_coverage_draft: bool,
    ):
        if self.is_coverage_planning_modified(coverage_updates, original_coverage):
            assignment["planning"] = deepcopy(coverage_doc.get("planning"))

            if TO_BE_CONFIRMED_FIELD in coverage_doc:
                assignment["planning"][TO_BE_CONFIRMED_FIELD] = coverage_doc[TO_BE_CONFIRMED_FIELD]

        if original_assignment.get("assigned_to", {}).get("state") == AssignmentWorkflowState.DRAFT:
            if self.is_coverage_assignment_modified(coverage_updates, original_assignment):
                user = get_user()
                assignment["priority"] = assigned_to.pop("priority", original_assignment.get("priority"))
                assignment["assigned_to"] = assigned_to

                if original_assignment.get("assigned_to", {}).get("desk") != assigned_to.get("desk"):
                    assigned_to["assigned_date_desk"] = utcnow()
                    assigned_to["assignor_desk"] = user.get(ID_FIELD)

                if assigned_to.get("user") and original_coverage.get("assigned_to", {}).get("user") != assigned_to.get(
                    "user"
                ):
                    assigned_to["assigned_date_user"] = utcnow()
                    assigned_to["assignor_user"] = user.get(ID_FIELD)

        # If we made a coverage 'active' - change assignment status to active
        if original_coverage.get("workflow_status") == WorkflowStates.DRAFT and not is_coverage_draft:
            assigned_to["state"] = AssignmentWorkflowState.ASSIGNED
            assignment["assigned_to"] = assigned_to

    @staticmethod
    def _set_updates_from_planning(
        assignment: dict[str, Any],
        planning: PlanningResourceModel,
        original_planning: PlanningResourceModel,
        planning_updates: dict[str, Any],
        translated_name: str,
        translated_value: dict[str, Any],
    ):
        # If the Planning description has been changed
        if original_planning.description_text != planning_updates.get("description_text"):
            assignment["description_text"] = planning.description_text

        # If the Planning name has been changed
        if original_planning.name != planning_updates.get("name"):
            assignment["name"] = planning.name if not translated_value and translated_name else translated_name

    @staticmethod
    def _apply_translations(planning: PlanningResourceModel, coverage_doc: dict[str, Any]) -> tuple[str, dict]:
        """
        Applies translations to the planning document if available.

        Returns:
            tuple: Translated name and value for the planning.
        """

        translated_value: dict[str, Any] = {}
        translated_name = planning.name or planning.headline or ""
        coverage_doc.setdefault("planning", {})

        if planning.translations is not None and coverage_doc["planning"].get("language") is not None:
            translated_value.update(
                {
                    cast(str, entry.field): entry.value
                    for entry in planning.translations
                    if entry.language == coverage_doc["planning"]["language"]
                }
            )
            translated_name = translated_value.get("name", translated_value.get("headline"))
            coverage_doc["planning"].update(
                {
                    key: val
                    for key, val in translated_value.items()
                    if key in ("ednote", "description_text", "headline", "slugline", "authors", "internal_note")
                    and coverage_doc["planning"].get(key) is None
                }
            )

        return translated_name, translated_value

    @staticmethod
    def _merge_coverage_updates(original_coverage: dict[str, Any], coverage_updates: dict[str, Any]) -> dict[str, Any]:
        """
        Merges the original and updated coverage dictionaries.
        """
        doc = deepcopy(original_coverage)
        doc.update(deepcopy(coverage_updates))
        return doc

    def cancel_coverage(
        self,
        coverage,
        coverage_cancel_state,
        original_workflow_status,
        assignment=None,
        reason=None,
        event_cancellation=False,
        event_reschedule=False,
    ):
        self._perform_coverage_cancel(
            coverage,
            coverage_cancel_state,
            original_workflow_status,
            assignment,
            reason,
            event_cancellation,
            event_reschedule,
        )

        for s in coverage.get("scheduled_updates") or []:
            self._perform_coverage_cancel(
                s,
                coverage_cancel_state,
                original_workflow_status,
                None,
                reason,
                event_cancellation,
                event_reschedule,
            )

    @staticmethod
    def _perform_coverage_cancel(
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
                assignment = assignment_service.find_one(req=None, _id=coverage["assigned_to"].get("assignment_id"))

            if assignment:
                assignment_service.cancel_assignment(assignment, coverage, event_cancellation, event_reschedule)

    @staticmethod
    def is_coverage_planning_modified(updates, original) -> bool:
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

    @staticmethod
    def is_coverage_assignment_modified(updates: dict[str, Any], original: dict[str, Any]) -> bool:
        if (updates or {}).get("assigned_to"):
            keys = ["desk", "user", "state", "coverage_provider"]
            for key in keys:
                if key in updates.get("assigned_to", {}) and updates["assigned_to"][key] != (
                    original.get("assigned_to") or {}
                ).get(key):
                    return True

            if updates["assigned_to"].get("priority") and updates["assigned_to"]["priority"] != original.get(
                "priority"
            ):
                return True

        return False

    @staticmethod
    def is_xmp_updated(updates_coverage: dict[str, Any], original_coverage: dict[str, Any] | None = None) -> bool:
        return (
            updates_coverage["planning"].get("xmp_file")
            and ((original_coverage or {}).get("planning") or {}).get("xmp_file")
            != updates_coverage["planning"]["xmp_file"]
        )

    def set_xmp_file_info(self, updates_coverage: dict[str, Any], original_coverage: dict[str, Any]):
        xmp_file = self.get_xmp_file_for_updates(updates_coverage, original_coverage)
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
            get_resource_service("planning_files").patch(
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

    def set_slugline_from_xmp(
        self,
        updates_coverage: PlanningCoverage,
        original_coverage: PlanningCoverage | None = None,
    ):
        original_coverage_dict = {}
        if original_coverage is not None:
            original_coverage_dict = original_coverage.to_dict()

        xmp_file = self.get_xmp_file_for_updates(updates_coverage.to_dict(), original_coverage_dict, for_slugline=True)
        if not xmp_file:
            return

        parsed = etree.parse(xmp_file)
        xmp_slugline_mapping = get_planning_xmp_slugline_mapping()
        tags = parsed.xpath(xmp_slugline_mapping["xpath"], namespaces=xmp_slugline_mapping["namespaces"])
        if tags:
            updates_coverage.planning.slugline = tags[0].text

    def get_xmp_file_for_updates(
        self, updates_coverage: dict[str, Any], original_coverage: dict[str, Any], for_slugline: bool = False
    ) -> Any:
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
        xmp_file = get_resource_service("planning_files").find_one(
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
        # TODO-ASYNC: use new async media and add proper type
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

    def duplicate_xmp_file(self, coverage: dict[str, Any]) -> ObjectId | None:
        cov_plan = coverage.get("planning") or {}
        if not (
            cov_plan.get("xmp_file")
            and get_coverage_type_name(cov_plan.get("g2_content_type")) in ["Picture", "picture"]
        ):
            return None

        file_id = coverage["planning"]["xmp_file"]
        xmp_file = get_resource_service("planning_files").find_one(req=None, _id=file_id)
        coverage_msg = "Duplicating Coverage: {}".format(coverage["coverage_id"])
        if not xmp_file:
            logger.error("XMP File {} attached to coverage not found. {}".format(file_id, coverage_msg))
            return None

        app = get_current_app()
        xmp_file = app.media.get(xmp_file["media"], resource="planning_files")
        if not xmp_file:
            logger.error("Media file for XMP File {} not found. {}".format(file_id, coverage_msg))
            return None

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
            planning_file_ids = get_resource_service("planning_files").post([{"media": media_id}])
            if len(planning_file_ids) > 0:
                return planning_file_ids[0]
        except Exception as e:
            logger.exception("Error creating media file. {}. Exception: {}".format(coverage_msg, e))

        return None
