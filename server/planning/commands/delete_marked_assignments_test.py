# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015, 2016, 2017, 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .delete_marked_assignments import DeleteMarkedAssignments
from planning.tests import TestCase
from planning.utils import get_service
from superdesk.flask import g
from superdesk.utc import utcnow
from datetime import timedelta
from bson import ObjectId

now = utcnow()

a1_id = ObjectId()
a2_id = ObjectId()
a3_id = ObjectId()


class DeleteMarkedAssignmentsTest(TestCase):
    users = [{"_id": ObjectId(), "username": "u1"}, {"_id": ObjectId(), "username": "u2"}]

    auth = [
        {"_id": ObjectId(), "user": users[0]["_id"]},
        {"_id": ObjectId(), "user": users[1]["_id"]},
    ]

    assignments = [
        {"_id": a1_id, "_to_delete": True, "planning_item": "p1", "coverage_item": "c1"},
        {"_id": a2_id, "_to_delete": True, "planning_item": "p2", "coverage_item": "c1"},
        {"_id": a3_id, "planning_item": "p3"},
    ]
    plans = [{"_id": "p1"}, {"_id": "p2"}, {"_id": "p3"}]

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.assignment_service = get_service("assignments")

    async def assertAssignmentDeleted(self, assignment_ids, not_deleted=False):
        for assignment_id in assignment_ids:
            assignment = await self.assignment_service.find_by_id(assignment_id)
            if not_deleted:
                self.assertIsNotNone(assignment)
            else:
                self.assertIsNone(assignment)

    async def test_delete_marked_assignments(self):
        async with self.app.app_context():
            self.app.data.insert("users", self.users)
            self.app.data.insert("auth", self.auth)
            # Assignments still reference planning items in the legacy resource (SDBELGA-1122)
            await get_service("planning").create([{**plan, "planning_date": now} for plan in self.plans])
            await self.assignment_service.create(self.assignments)
            client = self.assignment_service.elastic
            await client.elastic.indices.refresh(index=client.config.index)

            g.user = self.users[0]
            g.auth = self.auth[0]

            await DeleteMarkedAssignments().run()

            await self.assertAssignmentDeleted([a1_id, a2_id])
            await self.assertAssignmentDeleted([a3_id], True)
