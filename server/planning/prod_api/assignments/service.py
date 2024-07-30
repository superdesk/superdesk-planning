# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import Union

from superdesk.resource_fields import ID_FIELD, LINKS, ITEMS
from superdesk import get_resource_service
from superdesk.es_utils import get_docs
from prod_api.service import ProdApiService

from planning.types import ArchiveItem, Assignment
from .utils import (
    construct_content_link,
    get_news_item_for_assignment,
    construct_assignment_link,
)
from planning.prod_api.common import excluded_lock_fields
from planning.prod_api.planning.utils import construct_planning_link
from planning.prod_api.events.utils import add_related_event_links


class AssignmentsService(ProdApiService):
    excluded_fields = ProdApiService.excluded_fields | excluded_lock_fields

    def _process_fetched_object(self, doc: Assignment):
        super()._process_fetched_object(doc)

        content_items = get_news_item_for_assignment(doc[ID_FIELD])
        if doc.get(LINKS):
            doc[LINKS]["planning"] = construct_planning_link(doc["planning_item"])
            _add_related_event_links(doc, doc["planning_item"])

            if content_items.count():
                doc[LINKS]["content"] = [construct_content_link(item) for item in get_docs(content_items.hits)]


def on_fetched_resource_archive(docs):
    for doc in docs.get(ITEMS) or []:
        on_fetched_item_archive(doc)


def on_fetched_item_archive(doc: ArchiveItem):
    if not doc.get("assignment_id") or not doc.get(LINKS):
        return

    assignment = get_resource_service("assignments").find_one(req=None, _id=doc["assignment_id"])
    if not assignment:
        return

    doc[LINKS].update(
        {
            "assignment": construct_assignment_link(assignment),
            "planning": construct_planning_link(assignment["planning_item"]),
        }
    )
    _add_related_event_links(doc, assignment["planning_item"])


def _add_related_event_links(doc: Union[ArchiveItem, Assignment], planning_id: str):
    planning = get_resource_service("planning").find_one(req=None, _id=planning_id)
    if planning:
        add_related_event_links(doc, planning)
