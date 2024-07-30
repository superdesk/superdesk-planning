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
from .replace_deprecated_event_item_attribute import ReplaceDeprecatedEventItemAttributeCommand


now = utcnow()


class ReplaceDeprecatedEventItemAttributeTest(TestCase):
    def setUp(self):
        super().setUp()
        self.command = ReplaceDeprecatedEventItemAttributeCommand()
        self.app.data.insert(
            "events",
            [
                {
                    "_id": "event1",
                    "name": "Event1",
                    "dates": {"start": now, "end": now + timedelta(days=1), "tz": "Australia/Sydney"},
                }
            ],
        )
        self.app.data.insert(
            "planning",
            [
                {
                    "_id": "plan1",
                    "slugline": "test-plan-1",
                    "planning_date": now,
                    "event_item": "event1",
                },
                {
                    "_id": "plan2",
                    "slugline": "test-plan-2",
                    "planning_date": now,
                },
            ],
        )

    def _get_planning_item(self, plan_id):
        return self.app.data.mongo.pymongo("planning").db["planning"].find_one({"_id": plan_id})

    def test_get_items(self):
        # Test original data
        self.assertEqual([item["_id"] for item in self.command.get_items(True)], ["plan1"])
        self.assertEqual([item["_id"] for item in self.command.get_items(False)], [])

        # Test after data upgrade
        self.command.run(dry_run=False, revert=False)
        self.assertEqual([item["_id"] for item in self.command.get_items(True)], [])
        self.assertEqual([item["_id"] for item in self.command.get_items(False)], ["plan1"])

        # Test after data downgrade
        self.command.run(dry_run=False, revert=True)
        self.assertEqual([item["_id"] for item in self.command.get_items(True)], ["plan1"])
        self.assertEqual([item["_id"] for item in self.command.get_items(False)], [])

    def test_dry_run(self):
        # Upgrade data
        self.command.run(dry_run=True, revert=False)
        plan1 = self._get_planning_item("plan1")
        self.assertEqual(plan1["event_item"], "event1")
        self.assertIsNone(plan1.get("related_events"))

        # Downgrade data
        self.command.run(dry_run=True, revert=True)
        plan1 = self._get_planning_item("plan1")
        self.assertEqual(plan1["event_item"], "event1")
        self.assertIsNone(plan1.get("related_events"))

    def test_upgrade_and_downgrade_planning(self):
        # Upgrade data
        self.command.run(dry_run=False, revert=False)
        plan1 = self._get_planning_item("plan1")
        self.assertIsNone(plan1["event_item"])
        self.assertEqual(plan1["related_events"], [PlanningRelatedEventLink(_id="event1", link_type="primary")])

        # Downgrade data
        self.command.run(dry_run=False, revert=True)
        plan1 = self._get_planning_item("plan1")
        self.assertEqual(plan1["event_item"], "event1")
        self.assertEqual(plan1["related_events"], [])
