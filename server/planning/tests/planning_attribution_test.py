from copy import deepcopy
from datetime import timedelta
from types import SimpleNamespace
from unittest import mock

import pytest
from bson import ObjectId

from superdesk.flask import g
from superdesk.tests import fixtures, utils as test_utils

from planning import common as common_module
from planning.history.planning import UnifiedPlanningHistoryService
from planning.planning import planning as planning_module
from planning.planning.planning import PlanningService
from planning.tests import TestCase, fixtures as planning_fixtures
from planning.types import UnifiedPlanningResource


class PlanningAttributionTestCase(TestCase):
    async def asyncSetUp(self):
        await super().asyncSetUp()
        await test_utils.post_items("users", fixtures.users.all_users())
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        self.service = UnifiedPlanningResource.get_service()
        g.user = fixtures.users.foobar().to_dict()
        created = await self.service.create(
            [
                {
                    "_id": "planning-id",
                    "type": "planning",
                    "dates": {"start": "2099-10-12T14:00:00+0000"},
                    "slugline": "Original",
                    "coverages": [
                        {
                            "coverage_id": "cov-planning",
                            "planning": {"headline": "Original headline"},
                            "news_coverage_status": {
                                "qcode": "ncostat:int",
                                "name": "coverage intended",
                                "label": "Planned",
                            },
                        }
                    ],
                }
            ]
        )
        self.original = await self.service.find_by_id(created[0].id)
        self.assertIsNotNone(self.original)
        self.assertEqual(self.original.version_creator, fixtures.users.FOOBAR_USER_ID)
        self.assertEqual(self.original.coverages[0].version_creator, fixtures.users.FOOBAR_USER_ID)
        self.edit_time = self.original.versioncreated + timedelta(minutes=1)
        g.user = fixtures.users.admin().to_dict()

    def updated_coverage(self):
        coverage = self.original.coverages[0].to_dict()
        coverage["planning"]["headline"] = "Updated headline"
        return coverage

    async def update_planning(self, updates):
        with mock.patch("planning.unified.service.utcnow", return_value=self.edit_time):
            return await self.service.update(self.original.id, updates)

    async def test_planning_edit_updates_version_creator(self):
        updated = await self.update_planning({"slugline": "Updated"})

        self.assertEqual(updated.version_creator, fixtures.users.ADMIN_USER_ID)
        self.assertEqual(updated.versioncreated, self.edit_time)
        stored = await self.service.find_by_id(updated.id)
        self.assertEqual(stored.version_creator, fixtures.users.ADMIN_USER_ID)
        self.assertEqual(stored.versioncreated, self.edit_time)

    async def test_coverage_only_edit_skips_version_creator(self):
        updated = await self.update_planning({"coverages": [self.updated_coverage()]})

        self.assertEqual(updated.version_creator, self.original.version_creator)
        self.assertEqual(updated.versioncreated, self.original.versioncreated)
        self.assertEqual(updated.coverages[0].version_creator, fixtures.users.ADMIN_USER_ID)
        self.assertEqual(updated.coverages[0].planning.headline, "Updated headline")
        stored = await self.service.find_by_id(updated.id)
        self.assertEqual(stored.version_creator, self.original.version_creator)
        self.assertEqual(stored.versioncreated, self.original.versioncreated)

    async def test_mixed_planning_and_coverage_edit_updates_version_creator(self):
        updated = await self.update_planning(
            {"slugline": "Updated", "coverages": [self.updated_coverage()]},
        )

        self.assertEqual(updated.version_creator, fixtures.users.ADMIN_USER_ID)
        self.assertEqual(updated.versioncreated, self.edit_time)
        self.assertEqual(updated.coverages[0].version_creator, fixtures.users.ADMIN_USER_ID)

    async def test_system_fields_only_skip_version_creator(self):
        with mock.patch("planning.unified.planning.update_post_item", new_callable=mock.AsyncMock, return_value=False):
            updated = await self.update_planning({"state": "scheduled", "pubstatus": "usable"})

        self.assertEqual(updated.version_creator, self.original.version_creator)
        self.assertEqual(updated.versioncreated, self.original.versioncreated)
        self.assertEqual(updated.state, "scheduled")
        self.assertEqual(updated.pubstatus, "usable")

    async def test_should_update_version_creator_helper_method(self):
        for updates, expected in (
            ({"slugline": "Updated"}, True),
            ({"slugline": "Original"}, False),
            ({"coverages": [self.updated_coverage()]}, False),
            ({"state": "scheduled", "pubstatus": "usable"}, False),
            ({"slugline": "Updated", "definition_long": "New description"}, True),
            ({"slugline": "Updated", "coverages": [self.updated_coverage()]}, True),
        ):
            with self.subTest(updates=updates):
                self.assertEqual(self.service._should_update_version_creator(updates, self.original), expected)

    async def test_history_records_only_coverage_operations(self):
        history_service = UnifiedPlanningHistoryService()
        updates = {"coverages": [self.updated_coverage()]}

        await history_service.on_item_updated(updates, self.original.to_dict())

        history = await history_service.find({"item_id": self.original.id}, use_mongo=True)
        entries = [entry async for entry in history]
        operations = [entry.operation for entry in entries]
        self.assertNotIn("edited", operations)
        self.assertEqual(operations.count("coverage_edited"), 1)
        coverage_entry = next(entry for entry in entries if entry.operation == "coverage_edited")
        self.assertEqual(coverage_entry.user_id, fixtures.users.ADMIN_USER_ID)
        self.assertEqual(coverage_entry.update["coverage_id"], "cov-planning")
        self.assertEqual(coverage_entry.update["planning"]["headline"], "Updated headline")


@pytest.mark.asyncio
async def test_ingest_patch_does_not_modify_version_creator(monkeypatch):
    """Ingest patches should not modify version_creator/versioncreated fields"""
    service = PlanningService()
    captured_document = {}

    class StubBackend:
        async def update_in_mongo_async(self, datasource, item_id, document, original):
            captured_document.update(document)
            return deepcopy(document)

    async def stub_on_updated_async(document, original, from_ingest=False):
        return None

    async def stub_planning_ingested_send(document, original):
        return None

    backend = StubBackend()
    service.backend = backend
    service.datasource = "planning"

    monkeypatch.setattr(planning_module, "planning_ingested", SimpleNamespace(send=stub_planning_ingested_send))
    monkeypatch.setattr(service, "on_updated_async", stub_on_updated_async)

    user_id = ObjectId()
    original = {
        "_id": "planning-id",
        "slugline": "Test Item",
        "version_creator": user_id,
    }

    ingest_patch = {
        "slugline": "Updated by ingest",
        "description_text": "System updated",
    }

    await service.patch_in_mongo(original["_id"], ingest_patch, deepcopy(original))
    assert "version_creator" not in captured_document, "Ingest should not modify version_creator"
    assert "versioncreated" not in captured_document, "Ingest should not modify versioncreated"
    assert "ingest_versioncreated" in captured_document, "Ingest should set ingest_versioncreated"


@pytest.mark.asyncio
async def test_async_service_lock_only_update_skips_repost(monkeypatch):
    original = {
        "_id": "planning-id",
        "type": "planning",
        "pubstatus": "usable",
        "lock_user": "user-1",
        "lock_session": "session-1",
        "lock_time": "2026-07-23T09:44:47+0000",
        "lock_action": "edit",
        "coverages": [{"coverage_id": "cov-1", "planning": {"slugline": "Coverage"}}],
    }

    updates = {
        "lock_user": None,
        "lock_session": None,
        "lock_time": None,
        "lock_action": None,
        "_etag": "etag-2",
        "coverages": original["coverages"],
    }

    def should_not_repost(_resource_name):
        raise AssertionError("Lock-only updates must not invoke repost resource lookup")

    monkeypatch.setattr(common_module, "get_resource_service", should_not_repost)

    result = await common_module.update_post_item(updates, original)

    assert result is None, "Lock-only/system-only updates should not repost"
