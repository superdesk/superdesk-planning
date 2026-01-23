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

import click
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.core import get_current_app

from planning.common import copy_assignment_details_to_coverage
from .async_cli import planning_cli

logger = logging.getLogger(__name__)


@planning_cli.command("planning:sync_assignment_coverages")
@click.option("--dry-run", "-d", is_flag=True, default=False)
async def sync_assignment_coverages_command(dry_run: bool) -> None:
    """Sync assignment details into planning coverages.

    This updates the `assigned_to` fields on coverages and scheduled updates
    based on the linked assignment records.

    Usage::

        $ python manage.py planning:sync_assignment_coverages

    Options:

    -d, --dry-run  Print planning ids that would be updated without writing
    """
    await SyncAssignmentCoveragesCommand().run(dry_run)


class SyncAssignmentCoveragesCommand:
    async def run(self, dry_run: bool) -> None:
        print("Syncing assignment details into planning coverages")
        updated = 0
        for planning in self.iter_planning():
            coverages = planning.get("coverages") or []
            assignment_ids = self.collect_assignment_ids(coverages)
            if not assignment_ids:
                continue

            assignments = self.fetch_assignments(assignment_ids)
            if not assignments:
                continue

            changed = self.sync_coverages(coverages, assignments)
            if not changed:
                continue

            updated += 1
            if dry_run:
                print(f"update {planning.get('_id')}")
            else:
                planning_service = get_resource_service("planning")
                planning_service.backend.system_update(
                    planning_service.datasource,
                    planning.get("_id"),
                    {"coverages": coverages},
                    planning,
                )
                print(".", end="")

        if not dry_run and updated:
            print("")
        print(f"Done. Updated {updated} planning items")

    def iter_planning(self):
        planning_service = get_resource_service("planning")
        query = {
            "$or": [
                {"coverages.assigned_to.assignment_id": {"$exists": True}},
                {"coverages.scheduled_updates.assigned_to.assignment_id": {"$exists": True}},
            ]
        }
        projection = {"_id": 1, "coverages": 1, "type": 1}
        page_size = 500
        offset = 0

        while True:
            cursor = planning_service.get_from_mongo(req=None, lookup=query, projection=projection)
            docs = list(cursor.skip(offset).limit(page_size))
            if not docs:
                break
            for planning in docs:
                yield planning
            offset += page_size

    def collect_assignment_ids(self, coverages: list[dict[str, Any]]) -> list[Any]:
        assignment_ids: list[Any] = []

        def _collect(value: Any) -> None:
            if not value:
                return
            if isinstance(value, ObjectId):
                assignment_ids.append(value)
                return
            try:
                assignment_ids.append(ObjectId(str(value)))
            except Exception:
                assignment_ids.append(str(value))

        for coverage in coverages:
            assigned_to = coverage.get("assigned_to") or {}
            _collect(assigned_to.get("assignment_id"))

            for scheduled_update in coverage.get("scheduled_updates") or []:
                scheduled_assigned_to = scheduled_update.get("assigned_to") or {}
                _collect(scheduled_assigned_to.get("assignment_id"))

        return assignment_ids

    def fetch_assignments(self, assignment_ids: list[ObjectId]) -> dict[str, dict[str, Any]]:
        assignments_service = get_resource_service("assignments")
        query_ids = self.build_assignment_query_ids(assignment_ids)
        cursor = assignments_service.get_from_mongo(req=None, lookup={"_id": {"$in": list(query_ids)}})
        return {str(doc.get("_id")): doc for doc in cursor}

    def sync_coverages(self, coverages: list[dict[str, Any]], assignments: dict[str, dict[str, Any]]) -> bool:
        updated = False

        def _sync_assigned_to(target: dict[str, Any], assignment: dict[str, Any]) -> bool:
            before = deepcopy(target.get("assigned_to") or {})
            target["assigned_to"] = {}
            copy_assignment_details_to_coverage(assignment, target)
            return before != target.get("assigned_to")

        for coverage in coverages:
            assigned_to = coverage.get("assigned_to") or {}
            assignment_id = assigned_to.get("assignment_id")
            if assignment_id is not None:
                assignment = assignments.get(str(assignment_id))
                if assignment is None:
                    assignment = self.find_assignment_by_id(assignment_id)
                    if assignment is not None:
                        assignments[str(assignment.get("_id"))] = assignment
                if assignment and _sync_assigned_to(coverage, assignment):
                    updated = True

            for scheduled_update in coverage.get("scheduled_updates") or []:
                scheduled_assigned_to = scheduled_update.get("assigned_to") or {}
                scheduled_assignment_id = scheduled_assigned_to.get("assignment_id")
                if scheduled_assignment_id is None:
                    continue
                assignment = assignments.get(str(scheduled_assignment_id))
                if assignment is None:
                    assignment = self.find_assignment_by_id(scheduled_assignment_id)
                    if assignment is not None:
                        assignments[str(assignment.get("_id"))] = assignment
                if assignment and _sync_assigned_to(scheduled_update, assignment):
                    updated = True

        return updated

    def find_assignment_by_id(self, assignment_id: Any) -> dict[str, Any] | None:
        assignments_service = get_resource_service("assignments")
        query_ids = self.build_assignment_query_ids([assignment_id])
        cursor = assignments_service.get_from_mongo(req=None, lookup={"_id": {"$in": list(query_ids)}})
        for doc in cursor:
            return doc
        return None

    def build_assignment_query_ids(self, assignment_ids: list[Any]) -> set[Any]:
        query_ids: set[Any] = set()
        for assignment_id in assignment_ids:
            if assignment_id is None:
                continue
            query_ids.add(assignment_id)
            if isinstance(assignment_id, ObjectId):
                query_ids.add(str(assignment_id))
            else:
                try:
                    query_ids.add(ObjectId(str(assignment_id)))
                except Exception:
                    pass
            query_ids.add(str(assignment_id))
        return query_ids
