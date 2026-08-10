# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2024 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta

from superdesk.utc import utcnow

from planning.tests import TestCase
from planning.types import PlanningRelatedEventLink
from planning.types.unified import UnifiedPlanningResource
from .replace_deprecated_event_item_attribute import ReplaceDeprecatedEventItemAttributeCommand


now = utcnow()


class ReplaceDeprecatedEventItemAttributeTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

        self.command = ReplaceDeprecatedEventItemAttributeCommand()
        service = UnifiedPlanningResource.get_service()
        await service.create(
            [
                {
                    "_id": "event1",
                    "type": "event",
                    "name": "Event1",
                    "dates": {"start": now, "end": now + timedelta(days=1), "tz": "Australia/Sydney"},
                },
                {"_id": "plan1", "type": "planning", "slugline": "test-plan-1", "dates": {"start": now}},
                {"_id": "plan2", "type": "planning", "slugline": "test-plan-2", "dates": {"start": now}},
            ]
        )
        # event_item is off-schema (deprecated), so add it with a raw mongo write
        await service.mongo_async.update_one({"_id": "plan1"}, {"$set": {"event_item": "event1"}})

    async def _get_planning_item(self, plan_id):
        return await UnifiedPlanningResource.get_service().mongo_async.find_one({"_id": plan_id})

    async def _item_ids(self, for_upgrade):
        return [item["_id"] async for item in self.command.get_items(for_upgrade)]

    async def test_get_items(self):
        async with self.app.app_context():
            # Test original data
            self.assertEqual(await self._item_ids(True), ["plan1"])
            self.assertEqual(await self._item_ids(False), [])

            # Test after data upgrade
            await self.command.run(dry_run=False, revert=False)
            self.assertEqual(await self._item_ids(True), [])
            self.assertEqual(await self._item_ids(False), ["plan1"])

            # Test after data downgrade
            await self.command.run(dry_run=False, revert=True)
            self.assertEqual(await self._item_ids(True), ["plan1"])
            self.assertEqual(await self._item_ids(False), [])

    async def test_dry_run(self):
        async with self.app.app_context():
            # Upgrade data
            await self.command.run(dry_run=True, revert=False)
            plan1 = await self._get_planning_item("plan1")
            self.assertEqual(plan1["event_item"], "event1")
            self.assertIsNone(plan1.get("related_events"))

            # Downgrade data
            await self.command.run(dry_run=True, revert=True)
            plan1 = await self._get_planning_item("plan1")
            self.assertEqual(plan1["event_item"], "event1")
            self.assertIsNone(plan1.get("related_events"))

    async def test_upgrade_and_downgrade_planning(self):
        async with self.app.app_context():
            # Upgrade data
            await self.command.run(dry_run=False, revert=False)
            plan1 = await self._get_planning_item("plan1")
            self.assertIsNone(plan1["event_item"])
            self.assertEqual(plan1["related_events"], [PlanningRelatedEventLink(_id="event1", link_type="primary")])

            # Downgrade data
            await self.command.run(dry_run=False, revert=True)
            plan1 = await self._get_planning_item("plan1")
            self.assertEqual(plan1["event_item"], "event1")
            self.assertEqual(plan1["related_events"], [])
