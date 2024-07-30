# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List
from bson import ObjectId
from eve.utils import ParsedRequest
from eve_elastic.elastic import ElasticCursor

from superdesk.core import json
from superdesk.resource_fields import ID_FIELD
from superdesk import get_resource_service

from prod_api.items import ItemsResource

from .resource import AssignmentsResource


def construct_assignment_link(assignment):
    return {
        "title": AssignmentsResource.resource_title,
        "href": f"{AssignmentsResource.url}/{assignment[ID_FIELD]}",
        "state": (assignment.get("assigned_to") or {}).get("state"),
        "scheduled": (assignment.get("planning") or {}).get("scheduled"),
        "content_type": (assignment.get("planning") or {}).get("g2_content_type"),
    }


def construct_content_link(content):
    return {
        "title": ItemsResource.resource_title,
        "href": f"{ItemsResource.url}/{content[ID_FIELD]}",
        "state": content["state"],
        "pubstatus": content["pubstatus"],
    }


def construct_assignment_links(assignment_ids: List[ObjectId]):
    req = ParsedRequest()
    req.args = {
        "source": json.dumps(
            {
                "query": {
                    "bool": {"must": [{"terms": {"_id": [str(assignment_id) for assignment_id in assignment_ids]}}]}
                }
            }
        )
    }
    req.sort = '[("planning.scheduled", 1)]'
    assignments = get_resource_service("assignments").get(req=req, lookup=None)
    content_items = {content["assignment_id"]: content for content in get_news_items_for_assignments(assignment_ids)}

    links = []
    for assignment in assignments:
        link = construct_assignment_link(assignment)
        if content_items.get(str(assignment[ID_FIELD])):
            content_item = content_items[str(assignment[ID_FIELD])]

            if content_item:
                content_link = construct_content_link(content_item)
                link["content_href"] = content_link["href"]
                link["content_state"] = content_link["state"]
                link["content_pubstatus"] = content_link["pubstatus"]

        links.append(link)

    return links


def get_news_item_for_assignment(assignment_id: ObjectId) -> ElasticCursor:
    req = ParsedRequest()
    req.args = {
        "source": json.dumps({"query": {"bool": {"must": {"term": {"assignment_id": str(assignment_id)}}}}}),
    }
    return get_resource_service("archive").get(req=req, lookup=None)


def get_news_items_for_assignments(assignment_ids: List[ObjectId]) -> ElasticCursor:
    req = ParsedRequest()
    req.args = {
        "source": json.dumps(
            {
                "query": {
                    "bool": {
                        "must": [{"terms": {"assignment_id": [str(assignment_id) for assignment_id in assignment_ids]}}]
                    }
                }
            }
        ),
    }
    return get_resource_service("archive").get(req=req, lookup=None)


def get_assignment_ids_from_planning(item):
    assignment_ids = []
    for coverage in item.get("coverages") or []:
        if (coverage.get("assigned_to") or {}).get("assignment_id"):
            assignment_ids.append(coverage["assigned_to"]["assignment_id"])

        for coverage_update in coverage.get("scheduled_updates") or []:
            if (coverage_update.get("assigned_to") or {}).get("assignment_id"):
                assignment_ids.append(coverage_update["assigned_to"]["assignment_id"])

    return assignment_ids
