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

from prod_api.service import ProdApiService

from planning.types import Planning
from planning.common import sync_assignment_details_to_coverages
from planning.prod_api.common import excluded_lock_fields
from planning.prod_api.assignments.utils import (
    get_assignment_ids_from_planning,
    construct_assignment_links,
)
from planning.prod_api.events.utils import add_related_event_links


class PlanningService(ProdApiService):
    excluded_fields = (
        {"item_class", "flags", "_planning_schedule", "_updates_schedule"}
        | ProdApiService.excluded_fields
        | excluded_lock_fields
    )

    def _process_fetched_object(self, doc: Planning):
        super()._process_fetched_object(doc)
        sync_assignment_details_to_coverages(doc)

        if doc.get(config.LINKS):
            add_related_event_links(doc, doc)
            assignment_ids = get_assignment_ids_from_planning(doc)
            if len(assignment_ids):
                doc[config.LINKS]["assignments"] = construct_assignment_links(assignment_ids)
