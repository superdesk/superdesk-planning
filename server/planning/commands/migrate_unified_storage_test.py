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
from click.testing import CliRunner

from superdesk.utc import utcnow

from planning.tests import TestCase
from planning.types.unified import UnifiedPlanningResource
from .migrate_unified_storage import MigrateUnifiedStorageCommand, migrate_unified_storage_command


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
                        {
                            "name": "SPORT",
                            "qcode": "SPORT",
                            "scheme": "belga-keywords",
                            "translations": "",
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
            {"_id": ObjectId(), "event_id": "event1", "operation": "create", "update": {"name": "Event 1"}}
        )
        await self.db["planning_history"].insert_one(
            {"_id": ObjectId(), "planning_id": "plan1", "operation": "create", "update": {"slugline": "plan-1"}}
        )
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
                {"name": "SPORT", "qcode": "SPORT", "scheme": "belga-keywords"},
            ],
        )
        self.assertEqual(
            items["event1"]["translations"], [{"field": "name", "language": "nl", "value": "Slot van de Week"}]
        )
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
            items["plan2"]["_planning_schedule"],
            [
                {"coverage_id": None, "scheduled": now},
                {"coverage_id": "cov1", "scheduled": now + timedelta(hours=3)},
            ],
        )

        # The legacy collections are left untouched
        self.assertEqual(len(await self._find("events")), 2)
        self.assertEqual(len(await self._find("planning")), 2)

    async def test_migrates_history_and_files(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(), 0)

        history = await self._find("planning_history")
        self.assertEqual(len(history), 2)
        self.assertEqual(
            {item["item_id"]: item["item_type"] for item in history}, {"event1": "event", "plan1": "planning"}
        )
        self.assertNotIn("event_id", next(item for item in history if item["item_type"] == "event"))
        self.assertNotIn("planning_id", next(item for item in history if item["item_type"] == "planning"))

        files = await self._find("events_files")
        self.assertEqual({item["media"] for item in files}, {"media1", "media2"})

    async def test_rerun_does_not_duplicate(self):
        async with self.app.app_context():
            await self.command.run()
            await self.command.run()

        self.assertEqual(len(await self._find("unified_planning")), 4)
        self.assertEqual(len(await self._find("planning_history")), 2)
        self.assertEqual(len(await self._find("planning_autosave")), 1)
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

    async def _link_coverage_to_event(self):
        await self.db["planning"].update_one({"_id": "plan2"}, {"$set": {"event_item": "event1"}})
        await self.db["assignments"].insert_many(
            [
                {"_id": ObjectId(), "planning_item": "plan2", "coverage_item": "cov1"},
                {
                    "_id": ObjectId(),
                    "planning_item": "plan2",
                    "coverage_item": "cov1",
                    "scheduled_update_id": "update1",
                },
                {"_id": ObjectId(), "planning_item": "unlinked", "coverage_item": "other"},
            ]
        )
        await self.db["delivery"].insert_many(
            [
                {"_id": ObjectId(), "planning_id": "plan2", "coverage_id": "cov1", "item_id": "article1"},
                {
                    "_id": ObjectId(),
                    "planning_id": "plan2",
                    "coverage_id": "cov1",
                    "scheduled_update_id": "update1",
                    "item_id": "article2",
                },
                {"_id": ObjectId(), "planning_id": "unlinked", "coverage_id": "other"},
            ]
        )

    def test_event_coverages_cli_option(self):
        result = CliRunner().invoke(migrate_unified_storage_command, ["--help"])
        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("--event-coverages", result.output)

    async def test_default_mode_keeps_planning_and_assignment_links(self):
        await self._link_coverage_to_event()
        async with self.app.app_context():
            self.assertEqual(await self.command.run(only=["items"]), 0)
        self.assertIsNotNone(await self.db["unified_planning"].find_one({"_id": "plan2"}))
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(len(await self._find("delivery", planning_id="plan2")), 2)
        self.assertFalse((await self.db["unified_planning"].find_one({"_id": "event1"})).get("coverages"))

    async def test_event_coverages_moves_coverages_and_assignments(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {"$set": {"coverages.0.planning.description_text": "Coverage description"}},
        )
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)

        items = {item["_id"]: item for item in await self._find("unified_planning")}
        self.assertEqual(set(items), {"event1", "event2"})
        self.assertEqual(items["event1"]["coverages"][0]["coverage_id"], "cov1")
        self.assertEqual(items["event1"]["coverages"][0]["planning"]["definition_long"], "Coverage description")
        self.assertIn(
            {"coverage_id": "cov1", "scheduled": now + timedelta(hours=3)},
            items["event1"]["_planning_schedule"],
        )
        assignments = await self._find("assignments")
        self.assertEqual(sum(item["planning_item"] == "event1" for item in assignments), 2)
        self.assertEqual(sum(item["planning_item"] == "unlinked" for item in assignments), 1)
        self.assertEqual(len(await self._find("delivery", planning_id="event1")), 2)
        self.assertEqual(len(await self._find("delivery", planning_id="unlinked")), 1)
        self.assertEqual((await self.db["planning"].find_one({"_id": "plan2"}))["event_item"], "event1")
        self.assertNotIn("coverages", await self.db["events"].find_one({"_id": "event1"}))

    async def test_event_coverages_skips_unlinked_planning(self):
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)
        self.assertEqual({item["_id"] for item in await self._find("unified_planning")}, {"event1", "event2"})
        self.assertFalse((await self.db["unified_planning"].find_one({"_id": "event1"})).get("coverages"))

    async def test_event_coverages_defaults_to_source_planning_date(self):
        await self._link_coverage_to_event()
        planning_date = now + timedelta(days=2)
        coverage = (await self.db["planning"].find_one({"_id": "plan2"}))["coverages"][0]
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {
                "$set": {
                    "planning_date": planning_date,
                    "coverages.0.scheduled_updates": [
                        {
                            "coverage_id": "cov1",
                            "scheduled_update_id": "update1",
                            "news_coverage_status": coverage["news_coverage_status"],
                            "planning": {},
                        }
                    ],
                },
                "$unset": {"coverages.0.planning.scheduled": ""},
            },
        )
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)

        event = await self.db["unified_planning"].find_one({"_id": "event1"})
        coverage = event["coverages"][0]
        self.assertEqual(coverage["planning"]["scheduled"], planning_date)
        self.assertEqual(coverage["scheduled_updates"][0]["planning"]["scheduled"], planning_date)
        self.assertIn({"coverage_id": "cov1", "scheduled": planning_date}, event["_planning_schedule"])
        self.assertEqual(event["_updates_schedule"], [{"scheduled_update_id": "update1", "scheduled": planning_date}])
        source = await self.db["planning"].find_one({"_id": "plan2"})
        self.assertNotIn("scheduled", source["coverages"][0]["planning"])

    async def test_event_coverages_skips_coverages_without_ids(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {"$push": {"coverages": {"planning": {}}}},
        )
        async with self.app.app_context():
            with self.assertLogs("planning.commands.migrate_unified_storage", level="WARNING"):
                self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)

        event = await self.db["unified_planning"].find_one({"_id": "event1"})
        self.assertEqual([coverage["coverage_id"] for coverage in event["coverages"]], ["cov1"])

    async def test_event_coverages_skips_planning_with_no_coverage_ids(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one({"_id": "plan2"}, {"$unset": {"coverages.0.coverage_id": ""}})
        async with self.app.app_context():
            with self.assertLogs("planning.commands.migrate_unified_storage", level="WARNING"):
                self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)

        event = await self.db["unified_planning"].find_one({"_id": "event1"})
        self.assertFalse(event.get("coverages"))
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(len(await self._find("delivery", planning_id="plan2")), 2)

    async def test_event_coverages_merges_multiple_plans_and_reruns(self):
        await self._link_coverage_to_event()
        plan = await self.db["planning"].find_one({"_id": "plan2"})
        plan["_id"] = plan["guid"] = "plan3"
        plan.pop("event_item")
        plan["related_events"] = [{"_id": "event1", "link_type": "primary"}]
        plan["coverages"][0]["coverage_id"] = "cov2"
        await self.db["planning"].insert_one(plan)

        async with self.app.app_context():
            for force in (False, False, True):
                self.assertEqual(
                    await self.command.run(event_coverages=True, only=["items"], batch_size=1, force=force), 0
                )
                event = await self.db["unified_planning"].find_one({"_id": "event1"})
                self.assertEqual([coverage["coverage_id"] for coverage in event["coverages"]], ["cov1", "cov2"])

    async def test_event_coverages_dry_run_writes_nothing(self):
        await self._link_coverage_to_event()
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, dry_run=True, only=["items"]), 0)
        self.assertEqual(await self._find("unified_planning"), [])
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(len(await self._find("delivery", planning_id="plan2")), 2)

    async def test_event_coverages_copies_only_referenced_coverage_files(self):
        await self._link_coverage_to_event()
        attachment_id, xmp_id = ObjectId(), ObjectId()
        await self.db["planning_files"].insert_many(
            [
                {"_id": attachment_id, "media": "coverage-attachment", "mimetype": "image/jpeg"},
                {"_id": xmp_id, "media": "coverage-xmp", "mimetype": "application/xml"},
            ]
        )
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {"$set": {"coverages.0.planning.files": [attachment_id], "coverages.0.planning.xmp_file": xmp_id}},
        )
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, dry_run=True), 0)
            self.assertEqual(self.command.stats["files"].copied, 2)
            self.assertEqual(len(await self._find("delivery", planning_id="plan2")), 2)
            self.assertEqual(len(await self._find("events_files")), 1)
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)
            self.assertEqual(len(await self._find("events_files")), 1)
            for force in (False, False, True):
                self.assertEqual(
                    await self.command.run(event_coverages=True, only=["files"], force=force, batch_size=1), 0
                )
                self.assertEqual(
                    {doc["media"] for doc in await self._find("events_files")},
                    {"media2", "coverage-attachment", "coverage-xmp"},
                )
        self.assertEqual(len(await self._find("delivery", planning_id="event1")), 2)

    async def test_event_coverages_files_dry_run_preserves_storage(self):
        attachment = (await self._find("planning_files"))[0]
        await self.db["unified_planning"].insert_one(
            {"_id": "event1", "type": "event", "coverages": [{"planning": {"files": [attachment["_id"]]}}]}
        )
        files_before = await self._find("events_files")
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["files"], dry_run=True), 0)
        self.assertEqual(await self._find("events_files"), files_before)
        self.assertEqual(self.command.stats["files"].copied, 1)

    async def test_event_coverages_missing_event_is_reported(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one({"_id": "plan2"}, {"$set": {"event_item": "missing"}})
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 1)
        self.assertEqual(self.command.stats["items"].failed_ids, ["plan2"])
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(len(await self._find("delivery", planning_id="plan2")), 2)

    async def test_event_coverages_skips_planning_files_phase(self):
        await self._link_coverage_to_event()
        files_before = await self._find("events_files")
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["files"]), 0)
        self.assertEqual(await self._find("unified_planning"), [])
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(await self._find("events_files"), files_before)
        self.assertEqual(self.command.stats["files"].skipped, 1)

    async def test_event_coverages_leaves_planning_history_untouched(self):
        history_before = await self._find("planning_history")
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["history"]), 0)
        history = await self._find("planning_history")
        self.assertEqual([item for item in history if item["_id"] == history_before[0]["_id"]], history_before)
        event_history = [item for item in history if item.get("item_type") == "event"]
        self.assertEqual(len(event_history), 1)
        self.assertEqual(event_history[0]["item_id"], "event1")
        self.assertEqual(self.command.stats["history"].updated, 0)

    async def test_event_coverages_skips_planning_history_and_files_on_full_run(self):
        history_before = await self._find("planning_history")
        files_before = await self._find("events_files")
        async with self.app.app_context():
            for force in (False, False, True):
                self.assertEqual(await self.command.run(event_coverages=True, force=force), 0)
                self.assertEqual(await self._find("planning_history", planning_id="plan1"), history_before)
                self.assertEqual(len(await self._find("planning_history")), 2)
                self.assertEqual(await self._find("events_files"), files_before)

    async def test_event_coverages_full_dry_run_leaves_history_and_files_untouched(self):
        history_before = await self._find("planning_history")
        files_before = await self._find("events_files")
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, dry_run=True), 0)
        self.assertEqual(await self._find("planning_history"), history_before)
        self.assertEqual(await self._find("events_files"), files_before)
        self.assertEqual(self.command.stats["history"].updated, 0)
        self.assertEqual(self.command.stats["files"].copied, 0)
        self.assertEqual(self.command.stats["files"].skipped, 1)

    async def test_event_coverages_preserves_existing_coverages_and_updates(self):
        await self._link_coverage_to_event()
        plan = await self.db["planning"].find_one({"_id": "plan2"})
        coverage = plan["coverages"][0]
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {
                "$set": {
                    "coverages.0.scheduled_updates": [
                        {
                            "coverage_id": "cov1",
                            "scheduled_update_id": "update1",
                            "news_coverage_status": coverage["news_coverage_status"],
                            "planning": {"scheduled": now + timedelta(hours=4)},
                        }
                    ]
                }
            },
        )
        async with self.app.app_context():
            await self.command.run(only=["items"])
            coverage["coverage_id"] = "existing"
            await self.db["unified_planning"].update_one({"_id": "event1"}, {"$set": {"coverages": [coverage]}})
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)

        event = await self.db["unified_planning"].find_one({"_id": "event1"})
        self.assertEqual([item["coverage_id"] for item in event["coverages"]], ["existing", "cov1"])
        self.assertEqual(
            event["_updates_schedule"],
            [{"scheduled_update_id": "update1", "scheduled": now + timedelta(hours=4)}],
        )
        self.assertEqual(event["coverages"][1]["scheduled_updates"][0]["scheduled_update_id"], "update1")

    async def test_event_coverages_selects_primary_event(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {
                "$set": {
                    "related_events": [
                        {"_id": "event2", "link_type": "secondary"},
                        {"_id": "event1", "link_type": "primary"},
                    ]
                }
            },
        )
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 0)
        self.assertEqual(len(await self._find("assignments", planning_item="event1")), 2)
        self.assertFalse((await self.db["unified_planning"].find_one({"_id": "event2"})).get("coverages"))

    async def test_event_coverages_invalid_coverage_does_not_relink_assignments(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one({"_id": "plan2"}, {"$unset": {"coverages.0.news_coverage_status": ""}})
        async with self.app.app_context():
            self.assertEqual(await self.command.run(event_coverages=True, only=["items"]), 1)
        self.assertEqual(self.command.stats["items"].failed_ids, ["plan2"])
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertFalse((await self.db["unified_planning"].find_one({"_id": "event1"})).get("coverages"))

    async def test_event_coverages_debug_reports_ambiguous_event(self):
        await self._link_coverage_to_event()
        await self.db["planning"].update_one(
            {"_id": "plan2"},
            {
                "$set": {
                    "related_events": [
                        {"_id": "event1", "link_type": "primary"},
                        {"_id": "event2", "link_type": "primary"},
                    ]
                }
            },
        )
        with mock.patch("builtins.print") as mocked_print:
            async with self.app.app_context():
                self.assertEqual(await self.command.run(event_coverages=True, debug=True), 1)
        output = "\n".join(str(call.args[0]) for call in mocked_print.call_args_list if call.args)
        self.assertIn("Failed to migrate 'plan2' from 'planning'", output)
        self.assertIn("Stopped on the first error (--debug)", output)
        self.assertEqual(len(await self._find("assignments", planning_item="plan2")), 2)
        self.assertEqual(len(await self._find("events_files")), 1)
