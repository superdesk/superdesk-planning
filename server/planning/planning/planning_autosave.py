# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Planning - Planning Autosaves"""

import logging

from superdesk import Resource
from superdesk.metadata.utils import item_url

from planning.autosave import AutosaveService
from planning.common import WORKFLOW_STATE
from .planning import planning_schema

logger = logging.getLogger(__name__)


class PlanningAutosaveResource(Resource):
    url = 'planning_autosave'
    item_url = item_url

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PUT', 'PATCH', 'DELETE']

    schema = planning_schema
    datasource = {
        'source': 'planning_autosave',
    }

    privileges = {
        'POST': 'planning_planning_management',
        'PUT': 'planning_planning_management',
        'PATCH': 'planning_planning_management',
        'DELETE': 'planning_planning_management'
    }

    mongo_indexes = {
        'planning_autosave_user': ([('lock_user', 1)], {'background': True}),
        'planning_autosave_session': ([('lock_session', 1)], {'background': True})
    }

    merge_nested_documents = True


class PlanningAutosaveService(AutosaveService):
    def on_assignment_removed(self, planning_id, coverage_id):
        item = self.find_one(req=None, _id=planning_id)

        if not item:
            # Item is not currently being edited (No current autosave item)
            return

        coverages = item.get('coverages') or []
        coverage = next(
            (c for c in coverages if c.get('coverage_id') == coverage_id),
            None
        )

        if not coverage:
            logger.warn('Coverage {} not found in autosave for item {}'.format(
                coverage_id,
                planning_id
            ))
            return

        # Remove assignment info from the coverage
        coverage.pop('assigned_to', None)
        coverage['workflow_status'] = WORKFLOW_STATE.DRAFT

        # Remove assignment info from any child scheduled_updates
        for coverage_update in coverage.get('scheduled_updates') or []:
            coverage_update.pop('assigned_to', None)
            coverage_update['workflow_status'] = WORKFLOW_STATE.DRAFT

        self.system_update(
            planning_id,
            {'coverages': coverages},
            item
        )
