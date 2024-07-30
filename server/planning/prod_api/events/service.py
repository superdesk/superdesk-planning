# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2021 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource_fields import ID_FIELD, LINKS
from prod_api.service import ProdApiService

from planning.prod_api.common import excluded_lock_fields
from planning.prod_api.assignments.utils import (
    get_assignment_ids_from_planning,
    construct_assignment_links,
)
from planning.prod_api.planning.utils import construct_planning_link
from planning.utils import get_related_planning_for_events


class EventsService(ProdApiService):
    excluded_fields = ProdApiService.excluded_fields | excluded_lock_fields

    def _process_fetched_object(self, doc):
        super()._process_fetched_object(doc)

        if not doc.get(LINKS):
            return

        plannings = get_related_planning_for_events([doc[ID_FIELD]], "primary")
        if len(plannings):
            assignment_ids = []
            for plan in plannings:
                assignment_ids.extend(get_assignment_ids_from_planning(plan))

            doc[LINKS]["plannings"] = [construct_planning_link(item[ID_FIELD]) for item in plannings]

            if len(assignment_ids):
                doc[LINKS]["assignments"] = construct_assignment_links(assignment_ids)


class EventsHistoryService(ProdApiService):
    excluded_fields = {
        "update._etag",
        "update._links",
        "update._status",
        "update._updated",
        "update._created",
    } | ProdApiService.excluded_fields


class EventsFilesService(ProdApiService):
    pass
