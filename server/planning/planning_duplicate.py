# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.metadata.utils import item_url, generate_guid
from superdesk.metadata.item import GUID_NEWSML
from flask import request
from .common import ITEM_STATE, WORKFLOW_STATE
from copy import deepcopy


logger = logging.getLogger(__name__)


class PlanningDuplicateResource(Resource):
    endpoint_name = 'planning_duplicate'
    resource_title = endpoint_name

    url = 'planning/<{0}:item_id>/duplicate'.format(item_url)

    resource_methods = ['POST']
    item_methods = []

    privileges = {'POST': 'planning_planning_management'}


class PlanningDuplicateService(BaseService):
    def create(self, docs, **kwargs):
        history_service = get_resource_service('planning_history')
        planning_service = get_resource_service('planning')

        parent_id = request.view_args['item_id']
        parent_plan = planning_service.find_one(req=None, _id=parent_id)
        new_plan = self._duplicate_planning(parent_plan)

        new_coverages = self._duplicate_coverages(parent_id, new_plan['guid'])

        planning_service.on_create([new_plan])
        planning_service.create([new_plan])
        planning_service.sync_coverages(new_coverages)

        history_service.on_duplicate(parent_plan, new_plan)
        history_service.on_duplicate_from(new_plan, parent_id)

        planning_service.on_duplicated(new_plan, parent_id)

        return [new_plan['guid']]

    def _duplicate_planning(self, original):
        new_plan = deepcopy(original)

        for f in ('_id', 'guid', 'lock_user', 'lock_time', 'original_creator', '_coverages'
                  'lock_session', 'lock_action', '_created', '_updated', '_etag', 'pubstatus'):
            new_plan.pop(f, None)

        new_plan[ITEM_STATE] = WORKFLOW_STATE.DRAFT
        new_plan['guid'] = generate_guid(type=GUID_NEWSML)

        return new_plan

    def _duplicate_coverages(self, parent_plan_id, new_plan_id):
        coverage_service = get_resource_service('coverage')
        parent_coverages = list(coverage_service.find(where={'planning_item': parent_plan_id}))

        if len(parent_coverages) == 0:
            return []

        new_coverages = []
        for coverage in parent_coverages:
            new_coverage = deepcopy(coverage)
            for f in ('_id', 'guid', '_created', '_updated', '_etag'):
                new_coverage.pop(f, None)

            new_coverage.get('planning', {}).pop('assigned_to', None)
            new_coverage.get('planning', {}).pop('scheduled', None)
            new_coverage['planning_item'] = new_plan_id
            new_coverages.append(new_coverage)

        coverage_service.on_create(new_coverages)
        coverage_service.create(new_coverages)
        return new_coverages
