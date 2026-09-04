# This file is part of Superdesk.
#
# Copyright 2013, 2020 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from typing import Literal
from dateutil import tz, parser
from bson import ObjectId
from bson.errors import InvalidId
from pydantic import BaseModel, ValidationError

from superdesk.core import get_app_config
from superdesk.core.auth.privilege_rules import required_privilege_rule
from superdesk.core.resources import fields
from superdesk.core.resources.validators import convert_pydantic_validation_error_for_response
from superdesk.core.types import Request, Response
from superdesk.core.web import EndpointGroup
from superdesk.resource_fields import VERSION
from superdesk.flask import render_template_string, render_template

from quart_babel import gettext as _

from superdesk.utc import utc_to_local, get_timezone_offset, utcnow
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError

from apps.auth import get_user_id
from apps.templates.content_templates import get_item_from_template

from planning.types import UnifiedPlanningResource, SearchItemType, PlanningItemType
from planning.types.unified import RelatedEventLinkType
from planning.common import (
    WORKFLOW_STATE,
    format_address,
    get_contacts_from_item,
    ASSIGNMENT_WORKFLOW_STATE,
    get_first_paragraph_text,
)
from planning.unified.agenda import AgendasAsyncService
from planning.unified.common import get_related_planning_for_events, get_first_related_event_id
from planning.archive import create_item_from_template
from planning.utils import get_json_or_400_async


logger = logging.getLogger(__name__)
PLACEHOLDER_TEXT = r"{{content}}"
PLACEHOLDER_HTML = "<p>%s</p>" % PLACEHOLDER_TEXT
EXPORT_FETCH_PAGE_SIZE = 1000


planning_article_export_endpoints = EndpointGroup("planning_article_export", __name__)


class ArticleExportRequest(BaseModel):
    """Request body for exporting Event and/or Planning items as an Article"""

    items: list[str]
    desk: fields.ObjectId | None = None
    template: str | None = None
    type: Literal["planning", "event", "combined"] = "planning"
    article_template: fields.ObjectId | None = None


async def get_items(ids, resource_type):
    service = UnifiedPlanningResource.get_service()
    ids_string = [str(item_id) for item_id in ids]

    query: dict = {"_id": {"$in": ids}}
    if resource_type and resource_type != SearchItemType.COMBINED.value:
        query["type"] = "event" if resource_type == SearchItemType.EVENT.value else resource_type

    cursor = await service.find(query, use_mongo=True, max_results=EXPORT_FETCH_PAGE_SIZE)
    models = sorted([item async for item in cursor], key=lambda item: ids_string.index(str(item.id)))

    items = []
    for model in models:
        item = model.to_dict()

        if model.item_type == PlanningItemType.PLANNING:
            event_id = get_first_related_event_id(model, RelatedEventLinkType.PRIMARY)
            if event_id:
                event = await service.find_by_id(event_id)
                if not event:
                    logger.error(
                        "Failed to find Event linked to the Planning item",
                        extra=dict(
                            planning_id=model.id,
                            event_id=event_id,
                        ),
                    )
                else:
                    item["event"] = event.to_dict()
        elif model.item_type == PlanningItemType.EVENT:
            plannings = await get_related_planning_for_events(
                [model.id], RelatedEventLinkType.PRIMARY, max_results=EXPORT_FETCH_PAGE_SIZE
            )
            item["plannings"] = [plan.to_dict() async for plan in plannings]
            item["coverages"] = [coverage for plan in item["plannings"] for coverage in plan.get("coverages") or []]

        items.append(item)

    return items


async def group_items_by_agenda(items):
    """
    Returns an array with all agendas for the provided items.

    Each agenda will have an attribute 'items'.
    An extra agenda with id: 'unassigned' is returned
        containing items without any agenda.
    Each item.agenda will be converted from an id to
        the actual agenda object
    """
    if len(items) == 0:
        return []

    agendas = [{"_id": "unassigned", "name": "No Agenda Assigned", "items": []}]
    for item in items:
        if item["type"] != "planning":
            continue

        item_agendas = item.get("agendas", [])
        if len(item_agendas) == 0:
            item_agendas = ["unassigned"]
        for agenda_id in item_agendas:
            agenda_in_array = [a for a in agendas if a["_id"] == agenda_id]
            if len(agenda_in_array) > 0:
                agenda_in_array[0]["items"].append(item)
            else:
                agenda = await AgendasAsyncService().find_by_id_raw(str(agenda_id))
                if agenda is not None and agenda["is_enabled"]:
                    agenda["items"] = [item]
                    agendas.append(agenda)

    # replace each agenda id with the actual object
    for item in items:
        if item["type"] != "planning":
            continue

        item_agendas_ids = item.get("agendas", [])
        item_agendas = []
        for agenda_id in item_agendas_ids:
            agenda_in_array = [a for a in agendas if a["_id"] == ObjectId(agenda_id)]
            if len(agenda_in_array) > 0:
                item_agendas.append(agenda_in_array[0])
        item["agendas"] = item_agendas

    return agendas


async def inject_internal_coverages(items):
    coverage_labels = {}
    cv = await get_resource_service("vocabularies").find_one_async(req=None, _id="g2_content_type")
    if cv:
        coverage_labels = {_type["qcode"]: _type["name"] for _type in cv["items"]}

    for item in items:
        if item.get("coverages"):
            item["internal_coverages"] = []
            for coverage in item.get("coverages"):
                user = None
                assigned_to = coverage.get("assigned_to") or {}

                if assigned_to.get("coverage_provider"):
                    user = assigned_to["coverage_provider"]
                elif assigned_to.get("user"):
                    user = await get_resource_service("users").find_one_async(req=None, _id=assigned_to.get("user"))

                coverage_type = coverage.get("planning").get("g2_content_type")
                label = coverage_labels.get(coverage_type, coverage_type)
                if user is not None:
                    item["internal_coverages"].append({"user": user, "type": label})
                else:
                    item["internal_coverages"].append({"type": label})


async def _enhance_assigned_provider(coverage, item, assigned_to):
    """
    Enhances the text_assignees with the contact details if it's assigned to an external provider
    """

    if assigned_to.get("contact"):
        provider_contact = await get_resource_service("contacts").find_one_async(
            req=None, _id=assigned_to.get("contact")
        )

        if (coverage.get("planning", {})).get("slugline", ""):
            slug_str = "({0}) - ".format((coverage.get("planning", {})).get("slugline", ""))
        else:
            slug_str = ""

        assignee_str = "{0}{1} - {2} {3} ".format(
            slug_str,
            assigned_to["coverage_provider"]["name"],
            provider_contact.get("first_name", ""),
            provider_contact.get("last_name", ""),
        )
        phone_number = [
            n.get("number") for n in provider_contact.get("mobile", []) + provider_contact.get("contact_phone", [])
        ]
        if len(phone_number):
            assignee_str += " ({0})".format(phone_number[0])

        # If there is an internal note on the coverage that is different to the internal note
        # on the planning
        if (coverage.get("planning", {})).get("internal_note", "") and item.get("internal_note", "") != (
            coverage.get("planning", {})
        ).get("internal_note", ""):
            assignee_str += " ({0})".format((coverage.get("planning", {})).get("internal_note", ""))

        item["text_assignees"].append(assignee_str)
    else:
        item["text_assignees"].append(assigned_to["coverage_provider"]["name"])


async def enhance_coverage(planning, item, users, desks, text_users, text_desks):
    for c in planning.get("coverages") or []:
        is_text = c.get("planning", {}).get("g2_content_type", "") == "text"
        completed = (c.get("assigned_to") or {}).get("state") == ASSIGNMENT_WORKFLOW_STATE.COMPLETED
        assigned_to = c.get("assigned_to") or {}
        user = None
        desk = None
        if assigned_to.get("coverage_provider"):
            item["assignees"].append(assigned_to["coverage_provider"]["name"])
            if is_text and not completed:
                await _enhance_assigned_provider(c, item, assigned_to)
        elif assigned_to.get("user"):
            user = assigned_to["user"]
            users.append(user)
        elif assigned_to.get("desk"):
            desk = assigned_to.get("desk")
            desks.append(desk)

        # Get abstract from related text item if coverage is 'complete'
        if is_text:
            if completed:
                results = await get_resource_service("archive").get_from_mongo_async(
                    req=None,
                    lookup={
                        "assignment_id": ObjectId(c["assigned_to"]["assignment_id"]),
                        "state": {"$in": ["published", "corrected"]},
                        "pubstatus": "usable",
                        "rewrite_of": None,
                    },
                )
                try:
                    archive_item = await results.next()
                except StopAsyncIteration:
                    archive_item = None

                if archive_item:
                    item["published_archive_items"].append(
                        {
                            "archive_text": get_first_paragraph_text(archive_item.get("abstract")) or "",
                            "archive_slugline": archive_item.get("slugline") or "",
                        }
                    )
            elif c.get("news_coverage_status", {}).get("qcode") == "ncostat:int":
                if user:
                    internal_note = (c.get("planning") or {}).get("internal_note") or ""
                    text_users.append(
                        {
                            "user": user,
                            "note": internal_note if internal_note != item.get("internal_note") else None,
                            "slugline": (c.get("planning") or {}).get("slugline") or "",
                        }
                    )
                else:
                    text_desks.append({"desk": desk, "slugline": (c.get("planning", {})).get("slugline", "")})

    item["contacts"] = await (await get_contacts_from_item(item)).to_list()


async def generate_text_item(items, template_name, resource_type):
    template = await get_resource_service("planning_export_templates").get_export_template(template_name, resource_type)
    if not template:
        raise SuperdeskApiError.badRequestError(_("Invalid template selected"))

    for item in items:
        # Create list of assignee with preference to coverage_provider, if not, assigned user
        item["published_archive_items"] = []
        item["assignees"] = []
        item["text_assignees"] = []
        item["contacts"] = []
        text_users = []
        text_desks = []
        users = []
        desks = []

        if item["type"] == "planning":
            await enhance_coverage(item, item, users, desks, text_users, text_desks)
        else:
            for p in item.get("plannings") or []:
                await enhance_coverage(p, item, users, desks, text_users, text_desks)

        cursor_users = await get_resource_service("users").find_async(where={"_id": {"$in": users}})
        users = await cursor_users.to_list()

        cursor_desks = await get_resource_service("desks").find_async(where={"_id": {"$in": desks}})
        desks = await cursor_desks.to_list()

        for u in text_users:
            user = next((_i for _i in users if str(_i.get("_id")) == u["user"]) or [], None)
            if user:
                name = user.get("display_name", "{0} {1}".format(user.get("first_name"), user.get("last_name")))
                item["assignees"].append(name)
                ta_str = "({0}) - ".format(u.get("slugline")) if u.get("slugline") else ""
                ta_str = ta_str + ("{0} ({1})".format(name, u.get("note")) if u.get("note") else "{0}".format(name))
                item["text_assignees"].append(ta_str)

        for d in text_desks:
            desk = next((_i for _i in desks if str(_i.get("_id")) == d.get("desk")) or [], None)
            if desk:
                item["assignees"].append(desk["name"])
                item["text_assignees"].append(
                    "({0}) - {1}".format(d.get("slugline"), desk["name"]) if d.get("slugline") else desk["name"]
                )

        set_item_place(item)

        event = item.get("event") or {}
        item["description_text"] = (
            item.get("description_text") or item.get("definition_long") or event.get("definition_short")
        )
        item["slugline"] = item.get("slugline") or event.get("name")

        # Handle dates and remote time-zones (Planning items linked to an Event use the Event's dates)
        dates = event.get("dates") or item.get("dates")
        if dates:
            default_timezone = get_app_config("DEFAULT_TIMEZONE")
            start = dates.get("start")
            utc_dt = parser.parse(start) if isinstance(start, str) else start
            item["schedule"] = utc_to_local(default_timezone, utc_dt)
            if get_timezone_offset(default_timezone, utcnow()) != get_timezone_offset(dates.get("tz"), utcnow()):
                item["schedule"] = "{} ({})".format(item["schedule"].strftime("%H%M"), item["schedule"].tzname())
            else:
                item["schedule"] = item["schedule"].strftime("%H%M")

    agendas = await group_items_by_agenda(items)
    await inject_internal_coverages(items)

    labels = {}
    cv = await get_resource_service("vocabularies").find_one_async(req=None, _id="g2_content_type")
    if cv:
        labels = {_type["qcode"]: _type["name"] for _type in cv["items"]}

    for item in items:
        item["coverages"] = [
            labels.get(
                (coverage.get("planning") or {}).get("g2_content_type"),
                (coverage.get("planning") or {}).get("g2_content_type"),
            )
            + (" (cancelled)" if coverage.get("workflow_status", "") == "cancelled" else "")
            for coverage in item.get("coverages", [])
            if (coverage.get("planning") or {}).get("g2_content_type")
        ]

    article = {}

    for key, value in template.items():
        if value.endswith(".html"):
            article[key.replace("_template", "")] = await render_template(value, items=items, agendas=agendas)
        else:
            article[key] = await render_template_string(value, items=items, agendas=agendas)

    return article


async def get_desk_template(desk):
    default_content_template = desk.get("default_content_template")
    if default_content_template:
        return await get_resource_service("content_templates").find_one_async(req=None, _id=default_content_template)

    return {}


def set_item_place(item):
    item["place"] = item.get("place") or (item.get("event") or {}).get("place")
    item["place"] = [p.get("name") for p in item["place"]] if item.get("place") else None


async def export_items_to_article(export_request: ArticleExportRequest) -> dict:
    """Creates a text Archive item on the given desk, rendering the requested items through an export template"""

    item_type = export_request.type
    item_list = await get_items(export_request.items, item_type)

    desk = {}
    if export_request.desk:
        desk = await get_resource_service("desks").find_one_async(req=None, _id=export_request.desk)
        if not desk:
            raise SuperdeskApiError.badRequestError(_("Desk not found"))

    if export_request.article_template:
        content_template = await get_resource_service("content_templates").find_one_async(
            req=None, _id=export_request.article_template
        )
        if not content_template:
            raise SuperdeskApiError.badRequestError(_("Article template not found"))
    else:
        content_template = await get_desk_template(desk)

    item = get_item_from_template(content_template)
    item[VERSION] = 1
    item.setdefault("type", "text")

    if item_type == "planning":
        item.setdefault("slugline", "Planning")
    elif item_type == "event":
        item.setdefault("slugline", "Event")
    else:
        item.setdefault("slugline", "Events and Planning")

    item["task"] = {
        "desk": desk.get("_id"),
        "user": get_user_id(),
        "stage": desk.get("working_stage"),
    }
    item_from_template = await generate_text_item(item_list, export_request.template, item_type)
    fields_to_override = []
    for key, val in item_from_template.items():
        if item.get(key):
            fields_to_override.append(key)

            placeholder = PLACEHOLDER_HTML if "_html" in key else PLACEHOLDER_TEXT
            if placeholder in item[key]:
                # The placeholder is found in the current field
                # So replace {{content}} with the generated text
                item[key] = item[key].replace(placeholder, val)
            else:
                # Otherwise append the generated text to the field
                item[key] += val
        else:
            item[key] = val

    return await create_item_from_template(item, fields_to_override)


@planning_article_export_endpoints.endpoint(
    "planning_article_export",
    name="planning_article_export",
    methods=["POST"],
    auth=[required_privilege_rule("planning")],
)
async def export_as_article_endpoint(request: Request) -> Response:
    data = await get_json_or_400_async(request)
    try:
        export_request = ArticleExportRequest.model_validate(data)
    except ValidationError as error:
        return Response(convert_pydantic_validation_error_for_response(error), 400)
    except InvalidId as error:
        # ``fields.ObjectId`` raises bson's InvalidId for malformed ids instead of a pydantic error
        raise SuperdeskApiError.badRequestError(str(error))

    item = await export_items_to_article(export_request)
    item["_status"] = "OK"
    item["_links"] = {"self": {"title": "Archive", "href": f"archive/{item['_id']}"}}
    return Response(item, 201)


async def export_events_to_text(items, template, tz_offset=None):
    for item in items:
        item["formatted_state"] = (
            item["state"]
            if item.get("state")
            in [
                WORKFLOW_STATE.CANCELLED,
                WORKFLOW_STATE.RESCHEDULED,
                WORKFLOW_STATE.POSTPONED,
            ]
            else None
        )
        location = item["location"][0] if len(item.get("location") or []) > 0 else None
        if location:
            format_address(location)
            item["formatted_location"] = (
                location.get("name")
                if not location.get("formatted_address")
                else "{0}, {1}".format(location.get("name"), location["formatted_address"])
            )

        item["contacts"] = []
        async for contact in await get_contacts_from_item(item):
            contact_info = ["{0} {1}".format(contact.get("first_name"), contact.get("last_name"))]
            phone = None
            if contact.get("job_title"):
                contact_info[0] = contact_info[0] + " ({})".format(contact["job_title"])
            if (len(contact.get("contact_email") or [])) > 0:
                contact_info.append(contact["contact_email"][0])

            if (len(contact.get("contact_phone") or [])) > 0:
                phone = next((p for p in contact["contact_phone"] if p.get("public")), None)
            elif len(contact.get("mobile") or []) > 0:
                phone = next((m for m in contact["mobile"] if m.get("public")), None)

            if phone:
                contact_info.append(phone.get("number"))

            item["contacts"].append(", ".join(contact_info))

        date_time_format = "%a %d %b %Y, %H:%M"
        default_timezone = get_app_config("DEFAULT_TIMEZONE")
        item["dates"]["start"] = utc_to_local(default_timezone, item["dates"]["start"])
        item["dates"]["end"] = utc_to_local(default_timezone, item["dates"]["end"])
        item["schedule"] = "{0}-{1}".format(
            item["dates"]["start"].strftime(date_time_format),
            item["dates"]["end"].strftime("%H:%M"),
        )
        if ((item["dates"]["end"] - item["dates"]["start"]).total_seconds() / 60) >= (24 * 60):
            item["schedule"] = "{0} to {1}".format(
                item["dates"]["start"].strftime(date_time_format),
                item["dates"]["end"].strftime(date_time_format),
            )

        if tz_offset:
            tz_browser = tz.tzoffset("", int(tz_offset))
            item["browser_start"] = (item["dates"]["start"]).astimezone(tz_browser)
            item["browser_end"] = (item["dates"]["end"]).astimezone(tz_browser)

        set_item_place(item)

    return (await render_template(template, items=items)).encode()
