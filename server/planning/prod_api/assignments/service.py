# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from eve.utils import config

from superdesk import get_resource_service
from superdesk.es_utils import get_docs
from prod_api.service import ProdApiService

from .utils import (
    construct_content_link,
    get_news_item_for_assignment,
    construct_assignment_link,
)
from planning.prod_api.common import excluded_lock_fields
from planning.prod_api.planning.utils import construct_planning_link
from planning.prod_api.events.utils import construct_event_link


class AssignmentsService(ProdApiService):
    excluded_fields = ProdApiService.excluded_fields | excluded_lock_fields

    def _process_fetched_object(self, doc):
        super()._process_fetched_object(doc)

        content_items = get_news_item_for_assignment(doc[config.ID_FIELD])
        if doc.get(config.LINKS):
            doc[config.LINKS]["planning"] = construct_planning_link(doc["planning_item"])

            planning = get_resource_service("planning").find_one(req=None, _id=doc["planning_item"])
            if planning.get("event_item"):
                doc[config.LINKS]["event"] = construct_event_link(planning["event_item"])

            if content_items.count():
                doc[config.LINKS]["content"] = [construct_content_link(item) for item in get_docs(content_items.hits)]


def on_fetched_resource_archive(docs):
    for doc in docs.get(config.ITEMS) or []:
        on_fetched_item_archive(doc)


def on_fetched_item_archive(doc):
    if doc.get("assignment_id"):
        assignment = get_resource_service("assignments").find_one(req=None, _id=doc["assignment_id"])
        if assignment:
            if doc.get(config.LINKS):
                doc[config.LINKS].update(
                    {
                        "assignment": construct_assignment_link(assignment),
                        "planning": construct_planning_link(assignment["planning_item"]),
                    }
                )

                planning = get_resource_service("planning").find_one(req=None, _id=assignment["planning_item"])
                if planning.get("event_item"):
                    doc[config.LINKS]["event"] = construct_event_link(planning["event_item"])
