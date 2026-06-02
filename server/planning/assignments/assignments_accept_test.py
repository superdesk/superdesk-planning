# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Superdesk Assignments"""

from time import sleep
from bson import ObjectId

from planning.tests import TestCase
from superdesk import get_resource_service
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures


class AssignmentAcceptTestCase(TestCase):
    async def test_accept(self):
        assignment_id = ObjectId("5b20652a1d41c812e24aa49e")
        assignment = {
            "_id": assignment_id,
            "planning_item": "plan1",
            "coverage_item": "cov1",
            "assigned_to": {
                "state": "assigned",
                "user": fixtures.users.ADMIN_USER_ID,
                "desk": "test",
                "assignor_user": fixtures.users.FOOBAR_USER_ID,
            },
            "planning": {"g2_content_type": "picture", "slugline": "Accept Test"},
        }

        g.user = {"_id": fixtures.users.ADMIN_USER_ID}
        await test_utils.post_items("users", fixtures.users.all_users())
        await test_utils.post_items("assignments", [assignment])

        # Sleep for 1 second before accepting the assignment
        # to ensure the activity and history records are sorted correctly
        sleep(1)

        await get_resource_service("assignments").accept_assignment(assignment_id, fixtures.users.ADMIN_USER_ID)
        assignment = await test_utils.find_by_id("assignments", assignment_id)
        self.assertTrue(assignment.get("accepted"))

        activity = (await test_utils.find_many("activity", {"resource": "assignments"}))[0]
        self.assertDictEqual(
            activity.get("data"),
            {
                "coverage_type": "picture",
                "news_coverage_status": "",
                "user": "Foo Bar",
                "omit_user": True,
                "slugline": "Accept Test",
            },
        )

        history = await test_utils.find_many("assignments_history")
        self.assertEqual(history[0].get("operation"), "create")
        self.assertEqual(history[1].get("operation"), "accepted")

    async def test_external(self):
        assignment_id = "5b20652a1d41c812e24aa49e"
        contact = {"_id": ObjectId(), "first_name": "Name", "last_name": "McName Face"}

        assignment = {
            "_id": ObjectId(assignment_id),
            "planning_item": "plan1",
            "coverage_item": "cov1",
            "assigned_to": {
                "state": "assigned",
                "user": None,
                "desk": "test",
                "assignor_user": fixtures.users.ADMIN_USER_ID,
                "contact": contact.get("_id"),
            },
            "planning": {"g2_content_type": "picture", "slugline": "Accept Test"},
        }

        g.user = {"_id": fixtures.users.ADMIN_USER_ID}
        await test_utils.post_items("users", fixtures.users.all_users())
        await test_utils.post_items("assignments", [assignment])
        await test_utils.post_items("contacts", [contact])

        # Sleep for 1 second before accepting the assignment
        # to ensure the activity and history records are sorted correctly
        sleep(1)

        await get_resource_service("assignments").accept_assignment(ObjectId(assignment_id), contact.get("_id"))
        assignment = await test_utils.find_by_id("assignments", assignment_id)
        self.assertTrue(assignment.get("accepted"))

        history = await test_utils.find_many("assignments_history")
        self.assertEqual(history[0].get("operation"), "create")
        self.assertEqual(history[1].get("operation"), "accepted")
