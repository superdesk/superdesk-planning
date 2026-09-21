# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import traceback
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import date, datetime
from pprint import pformat
from typing import Any, AsyncGenerator, Callable, Sequence

import click
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase

from superdesk.commands import cli
from superdesk.core import get_config

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.unified.common import convert_legacy_planning_to_unified_format, set_planning_schedule


logger = logging.getLogger(__name__)

PHASE_ITEMS = "items"
PHASE_HISTORY = "history"
PHASE_FILES = "files"
PHASES = (PHASE_ITEMS, PHASE_HISTORY, PHASE_FILES)

UNIFIED_COLLECTION = "unified_planning"
HISTORY_COLLECTION = "planning_history"
# Event & Planning attachments share the one collection, named after the Events one
FILES_COLLECTION = "events_files"

DEFAULT_BATCH_SIZE = 500


@dataclass
class PhaseStats:
    copied: int = 0
    updated: int = 0
    skipped: int = 0
    failed: int = 0
    failed_ids: list[Any] = field(default_factory=list)

    def __str__(self) -> str:
        return f"copied={self.copied} updated={self.updated} skipped={self.skipped} failed={self.failed}"


class MigrationAborted(Exception):
    """Raised to stop the migration on the first failure, when running with ``--debug``"""


@cli.command("planning:migrate_unified_storage")
@click.option("--dry-run", "-d", is_flag=True, default=False, help="Don't write anything, just report what would run")
@click.option("--batch-size", default=DEFAULT_BATCH_SIZE, show_default=True, help="Number of documents per batch")
@click.option("--only", multiple=True, type=click.Choice(PHASES), help="Run only the given phase(s)")
@click.option("--force", is_flag=True, default=False, help="Overwrite documents already present in the target")
@click.option("--debug", is_flag=True, default=False, help="Stop on the first error, printing it and the source item")
async def migrate_unified_storage_command(
    dry_run: bool, batch_size: int, only: tuple[str, ...], force: bool, debug: bool
):
    """Migrate the legacy Event & Planning collections into the unified ones

    Copies documents from the legacy per-type collections into the collections used by the
    unified storage. The legacy collections are left untouched, and re-running the command
    skips documents that were already migrated.

    ======================  ======================
    Legacy collection       Target collection
    ======================  ======================
    ``events``              ``unified_planning``
    ``planning``            ``unified_planning``
    ``events_history``      ``planning_history``
    ``planning_files``      ``events_files``
    ======================  ======================

    This only migrates MongoDB. Once it has completed, rebuild the Elastic indices with::

        python manage.py app:index_from_mongo --from=unified_planning
        python manage.py app:index_from_mongo --from=planning_history

    Usage::

        # python manage.py planning:migrate_unified_storage

    Options:

    -d, --dry-run     Don't update, just print what would be migrated
    --batch-size      Number of documents to process per batch (default 500)
    --only            Run only the given phase(s): items, history, files
    --force           Overwrite documents that already exist in the target collection
    --debug           Stop on the first error, printing the traceback and the source document
    """

    failed = await MigrateUnifiedStorageCommand().run(
        dry_run=dry_run,
        batch_size=batch_size,
        only=list(only),
        force=force,
        debug=debug,
    )

    if failed:
        raise SystemExit(1)


class MigrateUnifiedStorageCommand:
    async def run(
        self,
        dry_run: bool = False,
        batch_size: int = DEFAULT_BATCH_SIZE,
        only: Sequence[str] | None = None,
        force: bool = False,
        debug: bool = False,
    ) -> int:
        """Run the migration, returning the number of documents that failed to migrate"""

        self.dry_run = dry_run
        self.batch_size = batch_size or DEFAULT_BATCH_SIZE
        self.force = force
        self.debug = debug
        self.phases = list(only) if only else list(PHASES)
        self.stats: dict[str, PhaseStats] = {}
        self.db: AsyncIOMotorDatabase = UnifiedPlanningResource.get_service().mongo_async.database

        print("Migrating Events & Planning to the unified storage")
        if self.dry_run:
            print("DRY RUN - no changes will be written")
        print(f"Phases: {', '.join(self.phases)}")

        if not await self.check_for_collisions():
            print("Aborting, resolve the ID collisions listed above before running the migration")
            return 1

        runners: dict[str, Callable] = {
            PHASE_ITEMS: self.migrate_items,
            PHASE_HISTORY: self.migrate_history,
            PHASE_FILES: self.migrate_files,
        }

        try:
            for phase in PHASES:
                if phase in self.phases:
                    await runners[phase]()
        except MigrationAborted:
            print("")
            print("Stopped on the first error (--debug)")

        print("")
        print("Done.")
        for phase, phase_stats in self.stats.items():
            print(f"  {phase}: {phase_stats}")
            for item_id in phase_stats.failed_ids:
                print(f"    failed: {item_id}")

        return sum(phase_stats.failed for phase_stats in self.stats.values())

    # ------------------------------------------------------------------ phases

    async def check_for_collisions(self) -> bool:
        """Make sure no two source collections use the same ID, as they merge into the one target"""

        if PHASE_ITEMS not in self.phases:
            # ``events_files`` is both a source and the target of the files phase, so its IDs
            # legitimately overlap with ``planning_files`` once a migration has run
            return True

        collisions = await self.find_duplicate_ids("events", "planning")
        if not collisions:
            return True

        print(f"Found {len(collisions)} duplicate ID(s) between 'events' and 'planning':")
        for item_id in collisions[:20]:
            print(f"  {item_id}")
        if len(collisions) > 20:
            print(f"  ... and {len(collisions) - 20} more")

        return False

    async def migrate_items(self) -> PhaseStats:
        print("")
        print(f"Migrating 'events' and 'planning' into '{UNIFIED_COLLECTION}'")
        stats = self.stats.setdefault(PHASE_ITEMS, PhaseStats())
        target = self.db[UNIFIED_COLLECTION]

        for source, item_type in (("events", PlanningItemType.EVENT), ("planning", PlanningItemType.PLANNING)):
            await self.copy_documents(
                source=self.db[source],
                target=target,
                stats=stats,
                transform=lambda doc, item_type=item_type: self.normalise_item(doc, item_type),
            )

        print(f"  {stats}")
        return stats

    async def migrate_history(self) -> PhaseStats:
        print("")
        print(f"Migrating 'events_history' into '{HISTORY_COLLECTION}'")
        stats = self.stats.setdefault(PHASE_HISTORY, PhaseStats())
        target = self.db[HISTORY_COLLECTION]

        stats.updated += await self.rename_field(target, "planning_id", "item_id")
        stats.updated += await self.set_missing_field(target, "item_type", PlanningItemType.PLANNING.value)
        await self.copy_documents(
            source=self.db["events_history"],
            target=target,
            stats=stats,
            transform=self.normalise_event_history,
        )

        print(f"  {stats}")
        return stats

    async def migrate_files(self) -> PhaseStats:
        print("")
        print(f"Migrating 'planning_files' into '{FILES_COLLECTION}'")
        stats = self.stats.setdefault(PHASE_FILES, PhaseStats())

        await self.copy_documents(
            source=self.db["planning_files"],
            target=self.db[FILES_COLLECTION],
            stats=stats,
        )

        print(f"  {stats}")
        return stats

    # ----------------------------------------------------------------- helpers

    @staticmethod
    def normalise_event_history(doc: dict[str, Any]) -> dict[str, Any]:
        doc["item_id"] = doc.pop("event_id", doc.get("item_id"))
        doc["item_type"] = PlanningItemType.EVENT.value
        return doc

    def normalise_item(self, doc: dict[str, Any], item_type: PlanningItemType) -> dict[str, Any]:
        """Convert a legacy Event or Planning document to the unified schema"""

        doc["type"] = item_type.value
        if not doc.get("guid"):
            doc["guid"] = doc["_id"]

        doc.pop("family_id", None)
        doc.pop("_type", None)
        self.clean_calendar_translations(doc)
        self.clean_subject_translations(doc)
        self.clean_translations(doc)
        self.normalise_accreditation_deadline(doc)
        self.normalise_location_details(doc)

        if item_type == PlanningItemType.PLANNING:
            self.convert_deprecated_event_item(doc)
            convert_legacy_planning_to_unified_format(doc)

        self.normalise_languages(doc)
        for coverage in doc.get("coverages") or []:
            self.normalise_languages(coverage.get("planning") or {})

        # Raises if the document cannot be loaded into the unified schema
        item = UnifiedPlanningResource.from_dict(doc)

        if not doc.get("_planning_schedule") or not doc.get("_updates_schedule"):
            set_planning_schedule(item)
            item_dict = item.to_dict()
            doc["_planning_schedule"] = item_dict.get("_planning_schedule")
            doc["_updates_schedule"] = item_dict.get("_updates_schedule")

        return doc

    @staticmethod
    def normalise_languages(doc: dict[str, Any]) -> None:
        languages = [lang for lang in doc.get("languages") or [] if lang]
        if not languages:
            languages = [doc.get("language") or get_config(str, "DEFAULT_LANGUAGE") or "en"]
        doc["languages"] = languages
        if not doc.get("language"):
            doc["language"] = languages[0]

    @staticmethod
    def clean_calendar_translations(doc: dict[str, Any]) -> None:
        for calendar in doc.get("calendars") or []:
            if not isinstance(calendar.get("translations"), dict):
                calendar.pop("translations", None)

    @staticmethod
    def clean_subject_translations(doc: dict[str, Any]) -> None:
        for subject in doc.get("subject") or []:
            translations = subject.get("translations")
            if not isinstance(translations, dict):
                subject.pop("translations", None)
                continue

            for key in list(translations.keys()):
                if str(key).isdigit():
                    translations.pop(key, None)

    @staticmethod
    def clean_translations(doc: dict[str, Any]) -> None:
        if not doc.get("translations"):
            return

        doc["translations"] = [
            translation for translation in doc["translations"] if translation.get("value") is not None
        ]

    @staticmethod
    def normalise_accreditation_deadline(doc: dict[str, Any]) -> None:
        deadline = doc.get("accreditation_deadline")
        if isinstance(deadline, datetime):
            doc["accreditation_deadline"] = deadline.date().isoformat()
        elif isinstance(deadline, date):
            doc["accreditation_deadline"] = deadline.isoformat()

    @staticmethod
    def normalise_location_details(doc: dict[str, Any]) -> None:
        for location in doc.get("location") or []:
            details = location.get("details")
            if isinstance(details, str) or details is None:
                continue

            if isinstance(details, list):
                location["details"] = "\n".join(str(detail) for detail in details if detail)
                if not location["details"]:
                    location.pop("details", None)
            else:
                location.pop("details", None)

    @staticmethod
    def convert_deprecated_event_item(doc: dict[str, Any]) -> None:
        event_id = doc.pop("event_item", None)
        if not event_id or doc.get("related_events"):
            return

        related_event: dict[str, Any] = {"_id": event_id, "link_type": "primary"}
        if doc.get("recurrence_id"):
            related_event["recurrence_id"] = doc["recurrence_id"]
        doc["related_events"] = [related_event]

    async def copy_documents(
        self,
        source: AsyncIOMotorCollection,
        target: AsyncIOMotorCollection,
        stats: PhaseStats,
        transform: Callable[[dict[str, Any]], dict[str, Any]] | None = None,
    ) -> None:
        async for batch in self.iter_batches(source):
            existing_ids = await self.get_existing_ids(target, [doc["_id"] for doc in batch])
            to_insert: list[dict[str, Any]] = []
            to_replace: list[dict[str, Any]] = []

            for doc in batch:
                if doc["_id"] in existing_ids and not self.force:
                    stats.skipped += 1
                    continue

                original = deepcopy(doc) if self.debug else doc
                try:
                    # ``transform`` mutates the document, so keep the original around to print on failure
                    migrated = transform(doc) if transform is not None else doc
                except Exception as err:
                    stats.failed += 1
                    stats.failed_ids.append(doc["_id"])
                    logger.warning("Failed to migrate %s: %s", doc["_id"], err)
                    if self.debug:
                        self.print_failure(source.name, original)
                        raise MigrationAborted() from err
                    continue

                if doc["_id"] in existing_ids:
                    to_replace.append(migrated)
                else:
                    to_insert.append(migrated)

            if self.dry_run:
                stats.copied += len(to_insert)
                stats.updated += len(to_replace)
                continue

            if to_insert:
                await target.insert_many(to_insert, ordered=False)
                stats.copied += len(to_insert)

            for migrated in to_replace:
                await target.replace_one({"_id": migrated["_id"]}, migrated, upsert=True)
                stats.updated += 1

            print(".", end="", flush=True)

    @staticmethod
    def print_failure(source_name: str, doc: dict[str, Any]) -> None:
        print("")
        print(f"Failed to migrate '{doc['_id']}' from '{source_name}'")
        traceback.print_exc()
        print("Source document:")
        print(pformat(doc))

    async def set_missing_field(self, collection: AsyncIOMotorCollection, name: str, value: Any) -> int:
        lookup = {name: {"$exists": False}}
        if self.dry_run:
            return await collection.count_documents(lookup)

        response = await collection.update_many(lookup, {"$set": {name: value}})
        return response.modified_count

    async def rename_field(self, collection: AsyncIOMotorCollection, old_name: str, new_name: str) -> int:
        lookup = {old_name: {"$exists": True}, new_name: {"$exists": False}}
        if self.dry_run:
            return await collection.count_documents(lookup)

        response = await collection.update_many(lookup, {"$rename": {old_name: new_name}})
        return response.modified_count

    async def iter_batches(self, collection: AsyncIOMotorCollection) -> AsyncGenerator[list[dict[str, Any]], None]:
        last_id = None
        while True:
            lookup = {} if last_id is None else {"_id": {"$gt": last_id}}
            batch = await collection.find(lookup).sort("_id").limit(self.batch_size).to_list(length=self.batch_size)
            if not batch:
                break

            yield batch
            last_id = batch[-1]["_id"]

    async def get_existing_ids(self, collection: AsyncIOMotorCollection, ids: list[Any]) -> set[Any]:
        cursor = collection.find({"_id": {"$in": ids}}, {"_id": 1})
        return {doc["_id"] async for doc in cursor}

    async def find_duplicate_ids(self, source_a: str, source_b: str) -> list[Any]:
        duplicates: list[Any] = []
        async for batch in self.iter_batches(self.db[source_a]):
            ids = [doc["_id"] for doc in batch]
            duplicates.extend(await self.get_existing_ids(self.db[source_b], ids))

        return duplicates
