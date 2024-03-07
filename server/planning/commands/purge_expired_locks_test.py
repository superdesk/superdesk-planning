# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2024 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from typing import List, Tuple, Union
from datetime import timedelta
from bson import ObjectId

from superdesk.utc import utcnow
from planning.tests import TestCase

from .purge_expired_locks import PurgeExpiredLocks

now = utcnow()
assignment_1_id = ObjectId()
assignment_2_id = ObjectId()


# TODO: Add Assignments
class PurgeExpiredLocksTest(TestCase):
    def setUp(self) -> None:
        super().setUp()
        self.app.data.insert(
            "events",
            [
                {
                    "_id": "active_event_1",
                    "dates": {"start": now, "end": now + timedelta(days=1)},
                    "lock_user": "user1",
                    "lock_session": "session1",
                    "lock_time": now - timedelta(hours=23),
                    "lock_action": "edit",
                },
                {
                    "_id": "expired_event_1",
                    "dates": {"start": now, "end": now + timedelta(days=1)},
                    "lock_user": "user2",
                    "lock_session": "session2",
                    "lock_time": now - timedelta(hours=25),
                    "lock_action": "edit",
                },
            ],
        )
        self.app.data.insert(
            "planning",
            [
                {
                    "_id": "active_plan_1",
                    "planning_date": now,
                    "lock_user": "user3",
                    "lock_session": "session3",
                    "lock_time": now - timedelta(hours=23),
                    "lock_action": "edit",
                },
                {
                    "_id": "expired_plan_1",
                    "planning_date": now,
                    "lock_user": "user4",
                    "lock_session": "session4",
                    "lock_time": now - timedelta(hours=25),
                    "lock_action": "edit",
                },
            ],
        )
        self.app.data.insert(
            "assignments",
            [
                {
                    "_id": assignment_1_id,
                    "lock_user": "user5",
                    "lock_session": "session5",
                    "lock_time": now - timedelta(hours=23),
                    "lock_action": "edit",
                },
                {
                    "_id": assignment_2_id,
                    "lock_user": "user6",
                    "lock_session": "session6",
                    "lock_time": now - timedelta(hours=25),
                    "lock_action": "edit",
                },
            ],
        )
        self.assertLockState(
            [
                ("events", "active_event_1", True),
                ("events", "expired_event_1", True),
                ("planning", "active_plan_1", True),
                ("planning", "expired_plan_1", True),
                ("assignments", assignment_1_id, True),
                ("assignments", assignment_2_id, True),
            ]
        )

    def test_invalid_resource(self):
        with self.assertRaises(ValueError):
            PurgeExpiredLocks().run("blah")

    def assertLockState(self, item_tests: List[Tuple[str, Union[str, ObjectId], bool]]):
        for resource, item_id, is_locked in item_tests:
            item = self.app.data.find_one(resource, req=None, _id=item_id)
            if is_locked:
                self.assertIsNotNone(item["lock_user"], f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item["lock_session"], f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item["lock_time"], f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item["lock_action"], f"{resource} item {item_id} is NOT locked, item={item}")
            else:
                self.assertIsNone(item.get("lock_user"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_session"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_time"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_action"), f"{resource} item {item_id} is locked, item={item}")

    def test_purge_event_locks(self):
        PurgeExpiredLocks().run("events")
        self.assertLockState(
            [
                ("events", "active_event_1", True),
                ("events", "expired_event_1", False),
                ("planning", "active_plan_1", True),
                ("planning", "expired_plan_1", True),
                ("assignments", assignment_1_id, True),
                ("assignments", assignment_2_id, True),
            ]
        )

    def test_purge_planning_locks(self):
        PurgeExpiredLocks().run("planning")
        self.assertLockState(
            [
                ("events", "active_event_1", True),
                ("events", "expired_event_1", True),
                ("planning", "active_plan_1", True),
                ("planning", "expired_plan_1", False),
                ("assignments", assignment_1_id, True),
                ("assignments", assignment_2_id, True),
            ]
        )

    def test_purge_assignment_locks(self):
        PurgeExpiredLocks().run("assignments")
        self.assertLockState(
            [
                ("events", "active_event_1", True),
                ("events", "expired_event_1", True),
                ("planning", "active_plan_1", True),
                ("planning", "expired_plan_1", True),
                ("assignments", assignment_1_id, True),
                ("assignments", assignment_2_id, False),
            ]
        )

    def test_purge_all_locks(self):
        PurgeExpiredLocks().run("all")
        self.assertLockState(
            [
                ("events", "active_event_1", True),
                ("events", "expired_event_1", False),
                ("planning", "active_plan_1", True),
                ("planning", "expired_plan_1", False),
                ("assignments", assignment_1_id, True),
                ("assignments", assignment_2_id, False),
            ]
        )

    def test_purge_all_locks_with_custom_expiry(self):
        PurgeExpiredLocks().run("all", 2)
        self.assertLockState(
            [
                ("events", "active_event_1", False),
                ("events", "expired_event_1", False),
                ("planning", "active_plan_1", False),
                ("planning", "expired_plan_1", False),
                ("assignments", assignment_1_id, False),
                ("assignments", assignment_2_id, False),
            ]
        )
