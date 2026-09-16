# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2026 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import timedelta
from unittest import mock

from bson import ObjectId

from superdesk.utc import utcnow

from planning.tests import TestCase
from planning.types.unified import UnifiedPlanningResource
from .migrate_unified_storage import MigrateUnifiedStorageCommand


now = utcnow()


class MigrateUnifiedStorageTest(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()

        self.command = MigrateUnifiedStorageCommand()
        self.db = UnifiedPlanningResource.get_service().mongo_async.database
        self.user_id = ObjectId()
        self.contact_id = ObjectId()

        await self.db["events"].insert_many(
            [
                {
                    "_id": "event1",
                    "guid": "event1",
                    "type": "event",
                    "name": "Event 1",
                    "dates": {"start": now, "end": now + timedelta(hours=2), "tz": "Australia/Sydney"},
                    "accreditation_deadline": now,
                    "subject": [
                        {
                            "name": "ENVIRONMENT",
                            "qcode": "ENVIRONMENT",
                            "scheme": "belga-keywords",
                            "translations": {"name": {"fr": "ENVIRONNEMENT", "nl": "MILIEU"}},
                        },
                        {
                            "name": "MANIFESTATION",
                            "qcode": "MANIFESTATION",
                            "scheme": "belga-keywords",
                            "translations": {
                                "0": "[",
                                "1": "o",
                                "2": "b",
                                "3": "j",
                                "name": {"fr": "MANIFESTATION", "nl": "BETOGING"},
                            },
                        },
                    ],
                    "translations": [
                        {"field": "name", "language": "nl", "value": "Slot van de Week"},
                        {"field": "definition_short", "language": "nl", "value": None},
                        {"field": "definition_long", "language": "nl", "value": None},
                    ],
                    "location": [
                        {
                            "name": "Conference Centre",
                            "qcode": "conference-centre",
                            "details": ["Use the north entrance", "Check in at reception"],
                        }
                    ],
                    "calendars": [
                        {
                            "is_active": True,
                            "name": "(3) Economy",
                            "qcode": "Economy",
                            "translations": {"name": {"fr": "(3) Economy", "nl": "(3) Economy"}},
                        },
                        {"is_active": True, "name": "(E) Embargo", "qcode": "Embargo", "translations": ""},
                        {"is_active": True, "name": "(8) Culture", "qcode": "Culture", "translations": None},
                    ],
                },
                {
                    "_id": "event2",
                    "guid": "event2",
                    "type": "event",
                    "name": "Event 2",
                    "dates": {"start": now, "end": now + timedelta(hours=1)},
                    # External contacts are referenced by a plain string ID
                    "event_contact_info": ["893838", self.contact_id],
                },
            ]
        )
        await self.db["planning"].insert_many(
            [
                {
                    "_id": "plan1",
                    "guid": "plan1",
                    "type": "planning",
                    "slugline": "plan-1",
                    "planning_date": now,
                    "description_text": "Some description",
                    "event_item": "event1",
                },
                {
                    "_id": "plan2",
                    "guid": "plan2",
                    "type": "planning",
                    "slugline": "plan-2",
                    "planning_date": now,
                    "coverages": [
                        {
                            "coverage_id": "cov1",
                            "news_coverage_status": {
                                "qcode": "ncostat:int",
                                "name": "coverage intended",
                                "label": "Planned",
                            },
                            "planning": {"g2_content_type": "text", "scheduled": now + timedelta(hours=3)},
                        }
                    ],
                },
            ]
        )
        await self.db["events_history"].insert_one(
            {"_id": ObjectId(), "item_id": "event1", "operation": "create", "update": {"name": "Event 1"}}
        )
        await self.db["planning_history"].insert_one(
            {"_id": ObjectId(), "item_id": "plan1", "operation": "create", "update": {"slugline": "plan-1"}}
        )
        await self.db["event_autosave"].insert_one({"_id": "event1", "type": "event", "lock_user": self.user_id})
        await self.db["planning_autosave"].insert_one({"_id": "plan1", "lock_user": self.user_id})
        await self.db["planning_files"].insert_one({"_id": ObjectId(), "media": "media1", "mimetype": "image/jpeg"})
        await self.db["events_files"].insert_one({"_id": ObjectId(), "media": "media2", "mimetype": "image/png"})

    async def _find(self, collection: str, **lookup):
        return await self.db[collection].find(lookup).sort("_id").to_list(length=100)

    async def test_migrates_items(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(), 0)

        items = {item["_id"]: item for item in await self._find("unified_planning")}
        self.assertEqual(set(items.keys()), {"event1", "event2", "plan1", "plan2"})

        self.assertEqual(items["event1"]["type"], "event")
        self.assertEqual(items["event1"]["dates"]["tz"], "Australia/Sydney")
        self.assertEqual(items["event1"]["accreditation_deadline"], now.date().isoformat())
        self.assertEqual(
            items["event1"]["subject"],
            [
                {
                    "name": "ENVIRONMENT",
                    "qcode": "ENVIRONMENT",
                    "scheme": "belga-keywords",
                    "translations": {"name": {"fr": "ENVIRONNEMENT", "nl": "MILIEU"}},
                },
                {
                    "name": "MANIFESTATION",
                    "qcode": "MANIFESTATION",
                    "scheme": "belga-keywords",
                    "translations": {"name": {"fr": "MANIFESTATION", "nl": "BETOGING"}},
                },
            ],
        )
        self.assertEqual(items["event1"]["translations"], [{"field": "name", "language": "nl", "value": "Slot van de Week"}])
        self.assertEqual(items["event1"]["location"][0]["details"], "Use the north entrance\nCheck in at reception")
        self.assertEqual(
            items["event1"]["calendars"],
            [
                {
                    "is_active": True,
                    "name": "(3) Economy",
                    "qcode": "Economy",
                    "translations": {"name": {"fr": "(3) Economy", "nl": "(3) Economy"}},
                },
                {"is_active": True, "name": "(E) Embargo", "qcode": "Embargo"},
                {"is_active": True, "name": "(8) Culture", "qcode": "Culture"},
            ],
        )
        self.assertEqual(items["event2"]["event_contact_info"], ["893838", self.contact_id])

        plan1 = items["plan1"]
        self.assertEqual(plan1["type"], "planning")
        self.assertEqual(plan1["dates"]["start"], now)
        self.assertEqual(plan1["definition_long"], "Some description")
        self.assertNotIn("planning_date", plan1)
        self.assertNotIn("description_text", plan1)
        self.assertNotIn("event_item", plan1)
        self.assertEqual(plan1["related_events"], [{"_id": "event1", "link_type": "primary"}])
        self.assertEqual(plan1["_planning_schedule"], [{"coverage_id": None, "scheduled": now}])

        self.assertEqual(
            items["plan2"]["_planning_schedule"], [{"coverage_id": "cov1", "scheduled": now + timedelta(hours=3)}]
        )

        # The legacy collections are left untouched
        self.assertEqual(len(await self._find("events")), 2)
        self.assertEqual(len(await self._find("planning")), 2)

    async def test_migrates_history_autosave_and_files(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(), 0)

        history = await self._find("planning_history")
        self.assertEqual(len(history), 2)
        self.assertEqual(
            {item["item_id"]: item["item_type"] for item in history}, {"event1": "event", "plan1": "planning"}
        )

        autosaves = {item["_id"]: item for item in await self._find("planning_autosave")}
        self.assertEqual(set(autosaves.keys()), {"event1", "plan1"})
        self.assertEqual(autosaves["event1"]["type"], "event")
        self.assertEqual(autosaves["plan1"]["type"], "planning")

        files = await self._find("events_files")
        self.assertEqual({item["media"] for item in files}, {"media1", "media2"})

    async def test_rerun_does_not_duplicate(self):
        async with self.app.app_context():
            await self.command.run()
            await self.command.run()

        self.assertEqual(len(await self._find("unified_planning")), 4)
        self.assertEqual(len(await self._find("planning_history")), 2)
        self.assertEqual(len(await self._find("planning_autosave")), 2)
        self.assertEqual(len(await self._find("events_files")), 2)

    async def test_dry_run_writes_nothing(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(dry_run=True), 0)

        self.assertEqual(await self._find("unified_planning"), [])
        self.assertEqual(len(await self._find("planning_history")), 1)
        self.assertEqual(len(await self._find("planning_autosave")), 1)
        self.assertEqual(len(await self._find("events_files")), 1)
        self.assertIsNone((await self.db["planning_autosave"].find_one({"_id": "plan1"})).get("type"))

    async def test_only_single_phase(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(only=["files"]), 0)

        self.assertEqual(await self._find("unified_planning"), [])
        self.assertEqual(len(await self._find("events_files")), 2)

    async def test_aborts_on_id_collision(self):
        await self.db["planning"].insert_one({"_id": "event1", "type": "planning", "planning_date": now})

        async with self.app.app_context():
            self.assertEqual(await self.command.run(), 1)

        self.assertEqual(await self._find("unified_planning"), [])

    async def test_invalid_item_is_reported_and_skipped(self):
        # An Event without an end date cannot be loaded into the unified schema
        await self.db["events"].insert_one({"_id": "event3", "type": "event", "dates": {"start": now}})

        async with self.app.app_context():
            self.assertEqual(await self.command.run(only=["items"]), 1)

        item_ids = {item["_id"] for item in await self._find("unified_planning")}
        self.assertEqual(item_ids, {"event1", "event2", "plan1", "plan2"})

    async def test_debug_stops_on_first_error(self):
        await self.db["events"].insert_one({"_id": "event3", "type": "event", "dates": {"start": now}})

        with mock.patch("builtins.print") as mocked_print:
            async with self.app.app_context():
                self.assertEqual(await self.command.run(debug=True), 1)

        output = "\n".join(str(call.args[0]) for call in mocked_print.call_args_list if call.args)
        self.assertIn("Failed to migrate 'event3' from 'events'", output)
        self.assertIn("Source document:", output)
        self.assertIn("'_id': 'event3'", output)
        self.assertIn("Stopped on the first error (--debug)", output)

        # The later phases are not run once it stops
        self.assertEqual(len(await self._find("planning_autosave")), 1)
