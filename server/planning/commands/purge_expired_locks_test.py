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

from planning.utils import get_service
from superdesk.utc import utcnow
from planning.tests import TestCase
from planning.types.unified import UnifiedPlanningResource
from .purge_expired_locks import purge_expired_locks_handler

LOCK_FIELDS = ("lock_user", "lock_session", "lock_time", "lock_action")


def lock_service(resource):
    if resource in ("events", "planning"):
        return UnifiedPlanningResource.get_service()
    return get_service(resource)


now = utcnow()
assignment_1_id = ObjectId()
assignment_2_id = ObjectId()


# TODO: Add Assignments
class PurgeExpiredLocksTest(TestCase):
    async def asyncSetUp(self) -> None:
        await super().asyncSetUp()

        async with self.app.app_context():
            self.setup_test_user()

            await self.insert(
                "events",
                [
                    {
                        "_id": "active_event_1",
                        "guid": "active_event_1",
                        "dates": {"start": now, "end": now + timedelta(days=1)},
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=23),
                        "lock_action": "edit",
                    },
                    {
                        "_id": "expired_event_1",
                        "guid": "expired_event_1",
                        "dates": {"start": now, "end": now + timedelta(days=1)},
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=25),
                        "lock_action": "edit",
                    },
                ],
            )
            await self.insert(
                "planning",
                [
                    {
                        "_id": "active_plan_1",
                        "guid": "active_plan_1",
                        "planning_date": now,
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=23),
                        "lock_action": "edit",
                    },
                    {
                        "_id": "expired_plan_1",
                        "guid": "expired_plan_1",
                        "planning_date": now,
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=25),
                        "lock_action": "edit",
                    },
                ],
            )
            await self.insert(
                "assignments",
                [
                    {
                        "_id": assignment_1_id,
                        "guid": assignment_1_id,
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=23),
                        "lock_action": "edit",
                    },
                    {
                        "_id": assignment_2_id,
                        "guid": assignment_2_id,
                        "lock_user": ObjectId(),
                        "lock_session": ObjectId(),
                        "lock_time": now - timedelta(hours=25),
                        "lock_action": "edit",
                    },
                ],
            )
            await self.assertLockState(
                [
                    ("events", "active_event_1", True),
                    ("events", "expired_event_1", True),
                    ("planning", "active_plan_1", True),
                    ("planning", "expired_plan_1", True),
                    ("assignments", assignment_1_id, True),
                    ("assignments", assignment_2_id, True),
                ]
            )

    async def insert(self, item_type, items):
        if item_type == "assignments":
            # Assignments still reference a planning item in the legacy resource (SDBELGA-1122)
            legacy_planning = get_service("planning")
            await legacy_planning.create([{"_id": "legacy_plan", "guid": "legacy_plan", "planning_date": now}])
            for item in items:
                item["planning_item"] = "legacy_plan"
            service = get_service(item_type)
            await service.create(items)
            client = service.elastic
            await client.elastic.indices.refresh(index=client.config.index)
            return

        # Unified create validates lock_user/lock_session as data relations, so create the
        # items unlocked and set the lock fields via system_update (a raw, unvalidated write)
        service = UnifiedPlanningResource.get_service()
        item_type_value = "event" if item_type == "events" else "planning"
        locks_by_id = {}
        for item in items:
            item["type"] = item_type_value
            if "planning_date" in item:
                item["dates"] = {"start": item.pop("planning_date")}
            locks_by_id[item["_id"]] = {field: item.pop(field) for field in LOCK_FIELDS if field in item}

        await service.create(items)
        for item_id, locks in locks_by_id.items():
            if locks:
                await service.system_update(item_id, locks)

        client = service.elastic
        await client.elastic.indices.refresh(index=client.config.index)

    async def assertLockState(self, item_tests: List[Tuple[str, Union[str, ObjectId], bool]]):
        for resource, item_id, is_locked in item_tests:
            service = lock_service(resource)
            item = await service.find_by_id_raw(item_id)
            if not item:
                raise AssertionError(f"{resource} item with ID {item_id} not found")

            if is_locked:
                self.assertIsNotNone(item.get("lock_user"), f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item.get("lock_session"), f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item.get("lock_time"), f"{resource} item {item_id} is NOT locked, item={item}")
                self.assertIsNotNone(item.get("lock_action"), f"{resource} item {item_id} is NOT locked, item={item}")
            else:
                self.assertIsNone(item.get("lock_user"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_session"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_time"), f"{resource} item {item_id} is locked, item={item}")
                self.assertIsNone(item.get("lock_action"), f"{resource} item {item_id} is locked, item={item}")

    async def test_invalid_resource(self):
        with self.assertRaises(ValueError):
            await purge_expired_locks_handler("blah")

    async def test_purge_event_locks(self):
        async with self.app.app_context():
            await purge_expired_locks_handler("events")
            await self.assertLockState(
                [
                    ("events", "active_event_1", True),
                    ("events", "expired_event_1", False),
                    ("planning", "active_plan_1", True),
                    ("planning", "expired_plan_1", True),
                    ("assignments", assignment_1_id, True),
                    ("assignments", assignment_2_id, True),
                ]
            )

    async def test_purge_planning_locks(self):
        async with self.app.app_context():
            await purge_expired_locks_handler("planning")
            await self.assertLockState(
                [
                    ("events", "active_event_1", True),
                    ("events", "expired_event_1", True),
                    ("planning", "active_plan_1", True),
                    ("planning", "expired_plan_1", False),
                    ("assignments", assignment_1_id, True),
                    ("assignments", assignment_2_id, True),
                ]
            )

    async def test_purge_assignment_locks(self):
        async with self.app.app_context():
            await purge_expired_locks_handler("assignments")
            await self.assertLockState(
                [
                    ("events", "active_event_1", True),
                    ("events", "expired_event_1", True),
                    ("planning", "active_plan_1", True),
                    ("planning", "expired_plan_1", True),
                    ("assignments", assignment_1_id, True),
                    ("assignments", assignment_2_id, False),
                ]
            )

    async def test_purge_all_locks(self):
        async with self.app.app_context():
            await purge_expired_locks_handler("all")
            await self.assertLockState(
                [
                    ("events", "active_event_1", True),
                    ("events", "expired_event_1", False),
                    ("planning", "active_plan_1", True),
                    ("planning", "expired_plan_1", False),
                    ("assignments", assignment_1_id, True),
                    ("assignments", assignment_2_id, False),
                ]
            )

    async def test_purge_all_locks_with_custom_expiry(self):
        async with self.app.app_context():
            await purge_expired_locks_handler("all", 2)
            await self.assertLockState(
                [
                    ("events", "active_event_1", False),
                    ("events", "expired_event_1", False),
                    ("planning", "active_plan_1", False),
                    ("planning", "expired_plan_1", False),
                    ("assignments", assignment_1_id, False),
                    ("assignments", assignment_2_id, False),
                ]
            )
