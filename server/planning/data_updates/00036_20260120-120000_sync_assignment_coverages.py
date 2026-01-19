# -*- coding: utf-8; -*-
# This file is part of Superdesk.
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
#

from __future__ import annotations

import logging
from copy import deepcopy
from typing import Any

from bson import ObjectId

from superdesk.commands.data_updates import BaseDataUpdate
from superdesk import get_resource_service

from planning.common import copy_assignment_details_to_coverage

logger = logging.getLogger(__name__)


class DataUpdate(BaseDataUpdate):
    resource = "planning"

    def forwards(self, mongodb_collection, mongodb_database):
        assignments_collection = mongodb_database["assignments"]
        planning_service = get_resource_service("planning")

        cursor = mongodb_collection.find(
            {
                "$or": [
                    {"coverages.assigned_to.assignment_id": {"$exists": True}},
                    {"coverages.scheduled_updates.assigned_to.assignment_id": {"$exists": True}},
                ]
            }
        )

        for planning in cursor:
            coverages = planning.get("coverages") or []
            assignment_ids: list[ObjectId] = []

            def _collect_assignment_id(value: Any) -> None:
                if not value:
                    return
                if isinstance(value, ObjectId):
                    assignment_ids.append(value)
                    return
                try:
                    obj_id = ObjectId(str(value))
                except Exception:
                    return
                assignment_ids.append(obj_id)

            for coverage in coverages:
                assigned_to = coverage.get("assigned_to") or {}
                _collect_assignment_id(assigned_to.get("assignment_id"))

                for scheduled_update in coverage.get("scheduled_updates") or []:
                    scheduled_assigned_to = scheduled_update.get("assigned_to") or {}
                    _collect_assignment_id(scheduled_assigned_to.get("assignment_id"))

            if not assignment_ids:
                continue

            assignments = {
                str(doc.get("_id")): doc for doc in assignments_collection.find({"_id": {"$in": assignment_ids}})
            }

            updated = False

            def _sync_assigned_to(target: dict[str, Any], assignment: dict[str, Any]) -> bool:
                target.setdefault("assigned_to", {})
                assigned_to = target["assigned_to"]
                before = deepcopy(assigned_to)
                copy_assignment_details_to_coverage(assignment, target)
                return before != assigned_to

            for coverage in coverages:
                assigned_to = coverage.get("assigned_to") or {}
                assignment_id = assigned_to.get("assignment_id")
                if assignment_id is not None:
                    assignment = assignments.get(str(assignment_id))
                    if assignment and _sync_assigned_to(coverage, assignment):
                        updated = True

                for scheduled_update in coverage.get("scheduled_updates") or []:
                    scheduled_assigned_to = scheduled_update.get("assigned_to") or {}
                    scheduled_assignment_id = scheduled_assigned_to.get("assignment_id")
                    if scheduled_assignment_id is None:
                        continue
                    assignment = assignments.get(str(scheduled_assignment_id))
                    if assignment and _sync_assigned_to(scheduled_update, assignment):
                        updated = True

            if updated:
                planning_service.backend.system_update(
                    planning_service.datasource,
                    planning.get("_id"),
                    {"coverages": coverages},
                    planning,
                )

    def backwards(self, mongodb_collection, mongodb_database):
        pass
