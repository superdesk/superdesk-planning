from copy import deepcopy

from superdesk.core import json, get_current_app, get_config
from superdesk import get_resource_service
from superdesk.utils import json_serialize_datetime_objectId

from superdesk.publish.formatters import Formatter
from superdesk.publish_async.utils import generate_sequence_number

from apps.archive.common import ARCHIVE

from planning.types import AgendasResourceModel, AssignmentWorkflowState, WorkflowState
from planning.unified.common import convert_unified_planning_to_legacy_format

from .utils import get_matching_products, expand_contact_info
from .json_utils import translate_names


class BaseJsonFormatter(Formatter):
    name = "JSON"
    type = "json"
    format_type = "json"
    resource_type = "event"
    translate_names: set[str] | None = {"subject", "anpa_category", "calendars"}

    include_files: list[tuple[str, str]] | None = None
    include_products: bool = True
    include_coverages: bool = True
    include_contacts: bool = True
    include_agendas: bool = True

    remove_fields: set[str] | None = {
        "lock_time",
        "lock_action",
        "lock_session",
        "lock_user",
        "_etag",
        "_planning_schedule",
        "_updates_schedule",
        "expiry",
        "original_creator",
        "version_creator",
        "_reschedule_from_schedule",
        "_current_version",
    }
    # fields to be removed from coverage
    remove_coverage_fields = (
        "original_creator",
        "version_creator",
        "assigned_to",
        "flags",
    )
    remove_coverage_planning_fields = ("contact_info", "files", "xmp_file")

    def __init__(self):
        self.can_preview = False
        self.can_export = False

    def can_format(self, format_type, article):
        if article.get("flags", {}).get("marked_for_not_publication", False):
            return False
        return format_type == self.format_type and article.get("type") == self.resource_type

    async def format(self, item, subscriber, codes=None):
        output_item = await self._format_item(deepcopy(item))
        await self._enhance_item(output_item)

        return [
            (
                await generate_sequence_number(subscriber),
                json.dumps(output_item, default=json_serialize_datetime_objectId),
            )
        ]

    async def _format_item(self, item: dict, subscribers: list[dict] | None = None) -> dict:
        """Format the item to json planning"""

        # Before any formatting, make sure we're working with the legacy format
        # and not the newer UnifiedPlanning format
        convert_unified_planning_to_legacy_format(item)

        if self.include_products:
            item["products"] = await get_matching_products(item)

        await self._format_files(item)
        await self._format_coverages(item)
        await self._format_agendas(item)

        if self.include_contacts:
            item["event_contact_info"] = await expand_contact_info(item.get("event_contact_info", []))

        return item

    async def _enhance_item(self, item: dict) -> None:
        if self.translate_names:
            translate_names(item, self.translate_names)

        if self.remove_fields is not None:
            for f in self.remove_fields:
                item.pop(f, None)

    async def _format_files(self, item: dict) -> None:
        if not self.include_files:
            item.pop("files", None)
            return

        for field, resource in self.include_files:
            if item.get(field):
                try:
                    item[field] = await self._get_files_for_publish(item, resource)
                except NotImplementedError:
                    #  Current http_push transmitters only support media publish
                    pass

    async def _get_files_for_publish(self, item: dict, resource: str):
        async def format_file_entry(file_id):
            file_resource = await get_resource_service(resource).find_one_async(req=None, _id=file_id)
            app = get_current_app()
            media = app.media.get(file_resource["media"], resource=resource)
            return {
                "media": str(file_resource["media"]),
                "name": media.name,
                "length": media.length,
                "mimetype": media.content_type,
            }

        return [await format_file_entry(file_id) for file_id in item["files"]]

    async def _format_coverages(self, item: dict) -> None:
        if not self.include_coverages:
            return

        for coverage in item.get("coverages") or []:
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

    def _get_coverage_workflow_state(self, assignment_state: str) -> str:
        if assignment_state in {
            AssignmentWorkflowState.SUBMITTED,
            AssignmentWorkflowState.IN_PROGRESS,
        }:
            return WorkflowState.ACTIVE.value
        else:
            return assignment_state

    async def _format_agendas(self, item) -> None:
        """
        Given an item it will scan any agendas, look them up and return the expanded values, if enabled

        :param item:
        :return: Array of expanded agendas
        """

        if not self.include_agendas:
            return

        remove_agenda_fields = {
            "_etag",
            "_type",
            "original_creator",
            "_updated",
            "_created",
            "is_enabled",
        }
        expanded = []
        agenda_service = AgendasResourceModel.get_service()
        for agenda in item.get("agendas") or []:
            agenda_details = await agenda_service.find_by_id_raw(agenda)
            if agenda_details and agenda_details.get("is_enabled"):
                for f in remove_agenda_fields:
                    agenda_details.pop(f, None)
                expanded.append(agenda_details)

        item["agendas"] = expanded

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

        assignment = await get_resource_service("assignments").find_one_async(req=None, _id=assignment_id)
        if not assignment:
            return [], None

        if assignment.get("assigned_to").get("state") not in [
            AssignmentWorkflowState.COMPLETED,
            AssignmentWorkflowState.IN_PROGRESS,
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
