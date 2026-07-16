# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Creates content based on the assignment"""

from copy import deepcopy

from superdesk.resource_fields import ID_FIELD, VERSION
from quart_babel import gettext as _

from superdesk.flask import request
from superdesk import get_resource_service, Resource
from superdesk.eve_async.service import AsyncBaseService
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utcnow
from superdesk.metadata.item import get_schema

from apps.archive.common import BYLINE
from apps.auth import get_user_id, get_user
from apps.templates.content_templates import get_item_from_template

from .assignments_history_async import AssignmentsHistoryAsyncService
from planning.common import (
    ASSIGNMENT_WORKFLOW_STATE,
    get_coverage_type_name,
    get_next_assignment_status,
    get_coverage_for_assignment,
    get_archive_items_for_assignment,
    assignment_allows_multiple_content_linked,
    get_config_assignment_manual_reassignment_only,
)
from planning.planning_notifications import PlanningNotifications
from planning.archive import create_item_from_template
from planning.signals import assignment_content_create


FIELDS_TO_COPY = ("urgency",)
FIELDS_TO_OVERRIDE = [
    "urgency",
    "slugline",
    "ednote",
    "abstract",
    "headline",
    "language",
]


async def get_item_from_assignment(assignment, template=None):
    from planning.planning_article_export import get_desk_template

    """Get the item from assignment

    :param dict assignment: Assignment document
    :param string template string: name of template to use
    :return dict: item
    """
    item = {}
    translations = {}
    if not assignment:
        return item

    desk_id = assignment.get("assigned_to").get("desk")
    desk = await get_resource_service("desks").find_one_async(req=None, _id=desk_id)
    if template is not None:
        template = get_resource_service("content_templates").find_one(req=None, template_name=template)
    else:
        template = get_desk_template(desk)
    item = get_item_from_template(template)

    planning_data = assignment.get("planning") or {}
    slugline = planning_data.get("slugline")
    language = planning_data.get("language")

    if slugline:
        item["slugline"] = slugline

    user = get_user()
    if user and user.get(BYLINE):
        item[BYLINE] = user[BYLINE]

    ednote = planning_data.get("ednote")

    planning_item = assignment.get("planning_item")
    planning = None
    # we now merge planning data if they are set
    if planning_item is not None:
        planning = await get_resource_service("planning").find_one_async(req=None, _id=planning_item)
        if planning is not None:
            for field in FIELDS_TO_COPY:
                if planning.get(field):
                    item[field] = deepcopy(planning[field])

                await merge_subject(item, planning)
                merge_list("place", item, planning)

                if planning_data.get("anpa_category"):
                    merge_list("anpa_category", item, planning_data)
                else:
                    merge_list("anpa_category", item, planning)

            if assignment.get("description_text"):
                item["abstract"] = "<p>{}</p>".format(assignment["description_text"])

            if planning.get("headline"):
                item["headline"] = planning["headline"]

            if not item.get("flags"):
                item["flags"] = {}

            if planning.get("translations"):
                translations = planning.get("translations")

            item["flags"]["marked_for_not_publication"] = (planning.get("flags") or {}).get(
                "marked_for_not_publication"
            ) or False

    if ednote:
        item["ednote"] = ednote

    genre = planning_data.get("genre")
    if genre:
        item["genre"] = deepcopy(genre)

    keyword = planning_data.get("keyword", [])
    if len(keyword) > 0:
        item["keywords"] = keyword

    item["task"] = {
        "desk": desk["_id"],
        "user": get_user_id(),
        "stage": desk["working_stage"],
    }

    # Load default content profile of the desk to the item
    content_profile_id = template["data"].get("profile", desk.get("default_content_profile", None))
    content_profile = None
    if content_profile_id:
        content_profile = get_resource_service("content_types").find_one(req=None, _id=content_profile_id)
        if content_profile is not None:
            for key in content_profile.get("schema").keys():
                if content_profile["schema"][key] is None:
                    item.pop(key, None)

    # Apply the language after stripping non-content-profile fields
    # as the language field may not be in the content-profile
    if language:
        item["language"] = language

    await assignment_content_create.send(assignment, planning, item, content_profile)
    return item, translations


class AssignmentsContentService(AsyncBaseService):
    async def on_create_async(self, docs):
        for doc in docs:
            await self._validate(doc)

    async def create_async(self, docs, **kwargs):
        ids = []
        archive_service = get_resource_service("archive")
        assignments_service = get_resource_service("assignments")
        for doc in docs:
            assignment = await assignments_service.find_one_async(req=None, _id=doc.pop("assignment_id"))
            item, translations = await get_item_from_assignment(assignment, doc.pop("template_name", None))
            item[VERSION] = 1
            item.setdefault("type", "text")
            item["assignment_id"] = assignment[ID_FIELD]

            if assignment.get("scheduled_update_id"):
                # get the latest archive item to be updated
                archive_item = await self.get_latest_news_item_for_coverage(assignment)

                if not archive_item:
                    raise SuperdeskApiError.badRequestError(_("Archive item not found to create a rewrite."))

                # create a rewrite
                request.view_args["original_id"] = archive_item.get(ID_FIELD)
                ids = await get_resource_service("archive_rewrite").post_async(
                    [{"desk_id": str(item.get("task").get("desk"))}]
                )
                item = await archive_service.find_one_async(_id=ids[0], req=None)
                item["task"]["user"] = get_user_id()

                # link the rewrite
                await get_resource_service("assignments_link").post_async(
                    [
                        {
                            "assignment_id": assignment[ID_FIELD],
                            "item_id": ids[0],
                            "reassign": True,
                        }
                    ]
                )
            else:
                # create content
                item = await create_item_from_template(item, FIELDS_TO_OVERRIDE, translations)

                # create delivery references
                await get_resource_service("delivery").post_async(
                    [
                        {
                            "item_id": item[ID_FIELD],
                            "assignment_id": assignment[ID_FIELD],
                            "planning_id": assignment["planning_item"],
                            "coverage_id": assignment["coverage_item"],
                        }
                    ]
                )

            updates = {"assigned_to": deepcopy(assignment.get("assigned_to"))}

            if not get_config_assignment_manual_reassignment_only():
                updates["assigned_to"]["user"] = str(item.get("task").get("user"))
                updates["assigned_to"]["desk"] = str(item.get("task").get("desk"))
                updates["assigned_to"]["assignor_user"] = str(item.get("task").get("user"))
                updates["assigned_to"]["assigned_date_user"] = utcnow()

            updates["assigned_to"]["state"] = get_next_assignment_status(updates, ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS)

            if not assignment.get("scheduled_update_id"):
                # set the assignment to in progress
                await assignments_service.patch_async(assignment[ID_FIELD], updates)

            doc.update(item)
            ids.append(doc["_id"])

            # Send notification that the work has commenced to the user who assigned the task
            # Get the id of the user who assigned the task
            assignor = assignment.get("assigned_to", {}).get(
                "assignor_user", assignment.get("assigned_to", {}).get("assignor_desk")
            )

            if str(assignor) != str(item.get("task").get("user")):
                # Determine the display name of the assignee
                assigned_to_user = await get_resource_service("users").find_one_async(
                    req=None, _id=str(item.get("task").get("user"))
                )
                assignee = assigned_to_user.get("display_name") if assigned_to_user else "Unknown"
                await PlanningNotifications().notify_assignment(
                    target_desk=None,
                    target_user=assignor,
                    message="assignment_commenced_msg",
                    assignee=assignee,
                    coverage_type=get_coverage_type_name(item.get("type", "")),
                    slugline=item.get("slugline"),
                    omit_user=True,
                    assignment_id=assignment[ID_FIELD],
                    is_link=True,
                    no_email=True,
                )
            # Save history
            await AssignmentsHistoryAsyncService().on_item_start_working(updates, assignment)

        return ids

    async def get_latest_news_item_for_coverage(self, assignment):
        coverage = await get_coverage_for_assignment(assignment)
        assignment_id = (coverage.get("assigned_to") or {}).get("assignment_id")

        if len(coverage.get("scheduled_updates") or []) == 0:
            previous_items = await get_archive_items_for_assignment(assignment_id)
        else:
            previous_items = await get_archive_items_for_assignment(assignment_id)
            for s in coverage.get("scheduled_updates") or []:
                new_items = await get_archive_items_for_assignment((s.get("assigned_to") or {}).get("assignment_id"))
                if await new_items.count() > 0:
                    previous_items = new_items

        try:
            return await previous_items.next()
        except StopAsyncIteration:
            return None

    async def _validate(self, doc):
        """Validate the doc for content creation"""
        assignment_service = get_resource_service("assignments")
        assignment = await assignment_service.find_one_async(req=None, _id=doc.get("assignment_id"))
        if not assignment:
            raise SuperdeskApiError.badRequestError(_("Assignment not found."))

        await assignment_service.validate_assignment_action(assignment)

        try:
            workflow_state = assignment["assigned_to"]["state"]
        except (KeyError, TypeError):
            workflow_state = ASSIGNMENT_WORKFLOW_STATE.DRAFT

        if workflow_state == ASSIGNMENT_WORKFLOW_STATE.DRAFT:
            raise SuperdeskApiError.badRequestError(_("Cannot create content from a draft Assignment."))
        elif not assignment_allows_multiple_content_linked(assignment):
            if workflow_state != ASSIGNMENT_WORKFLOW_STATE.ASSIGNED:
                raise SuperdeskApiError.badRequestError(_("Assignment workflow started. Cannot create content."))

            delivery_service = get_resource_service("delivery")
            if await delivery_service.count_async({"assignment_id": assignment.get(ID_FIELD)}) > 0:
                raise SuperdeskApiError.badRequestError(
                    _("Content already exists for the assignment. Cannot create content.")
                )
        elif workflow_state not in [
            ASSIGNMENT_WORKFLOW_STATE.ASSIGNED,
            ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
            ASSIGNMENT_WORKFLOW_STATE.SUBMITTED,
        ]:
            raise SuperdeskApiError.badRequestError(_("Assignment workflow completed. Cannot create content."))

        # Handle schedule_updates validation
        if assignment.get("scheduled_update_id"):
            # Make sure all previous content is linked
            coverage = await get_coverage_for_assignment(assignment)

            allowed_states = [
                ASSIGNMENT_WORKFLOW_STATE.IN_PROGRESS,
                ASSIGNMENT_WORKFLOW_STATE.COMPLETED,
            ]
            if (coverage.get("assigned_to") or {}).get("state") not in allowed_states:
                raise SuperdeskApiError.badRequestError(_("Coverage not linked to news item yet."))

            # Since scheduled_updates are cronologically indexed, check all previous scheduled_updates
            for s in coverage.get("scheduled_updates") or []:
                if s.get("scheduled_update_id") == assignment["scheduled_update_id"]:
                    break

                if (s.get("assigned_to") or {}).get("state") not in allowed_states:
                    raise SuperdeskApiError.badRequestError(_("Previous scheduled update not linked to news item yet."))


class AssignmentsContentResource(Resource):
    endpoint_name = "assignments_content"
    resource_title = endpoint_name
    url = "assignments/content"
    schema = get_schema(versioning=True)
    schema.update(
        {
            "assignment_id": {"type": "string", "required": True},
            "template_name": {"type": "string", "required": False},
        }
    )
    resource_methods = ["POST"]
    item_methods = []

    privileges = {"POST": "archive"}


async def merge_subject(item, planning):
    if not planning.get("subject"):
        return
    subject = item.setdefault("subject", [])
    vocabularies = []
    async for vocabulary in await get_resource_service("vocabularies").get_from_mongo_async(
        req=None, lookup={"selection_type": "single selection"}, projection={"_id": 1}
    ):
        vocabularies.append(vocabulary)

    single_value_vocabularies = set([v["_id"] for v in vocabularies])
    for s in planning["subject"]:
        if s.get("scheme") in single_value_vocabularies:
            if find_subject(subject, s.get("scheme")):
                continue
        elif find_subject(subject, s.get("scheme"), s.get("qcode")):
            continue

        subject.append(s)


def merge_list(field, item, planning):
    if not planning.get(field):
        return
    item_values = item.setdefault(field, [])
    for value in planning.get(field):
        if value.get("qcode") not in set([v.get("qcode") for v in item_values]):
            item_values.append(value)


def find_subject(subject, scheme, qcode=None):
    for s in subject:
        if s.get("scheme") == scheme and (qcode is None or s.get("qcode") == qcode):
            return s
