from copy import deepcopy
from types import SimpleNamespace

import pytest
from bson import ObjectId

from planning.planning import planning as planning_module

from planning.planning.planning import PlanningService
from planning.history.planning import UnifiedPlanningHistoryService
from planning import common as common_module


class DummyPlanningService(PlanningService):
    async def validate_on_update(self, updates, original, user):  # type: ignore[override]
        return None

    async def _set_coverage(self, updates, original=None):  # type: ignore[override]
        return None

    def set_planning_schedule(self, updates, original=None):  # type: ignore[override]
        return None

    async def _update_recurring_planning_items(self, updates, original, update_method):  # type: ignore[override]
        return None


class RecordingPlanningHistoryService(UnifiedPlanningHistoryService):
    def __init__(self):
        super().__init__()
        self.entries = []

    async def _save_history(self, planning, update, operation):  # type: ignore[override]
        self.entries.append({"operation": operation, "update": deepcopy(update)})


@pytest.mark.asyncio
async def test_planning_edit_updates_version_creator(monkeypatch):
    service = DummyPlanningService()
    admin_id = ObjectId()
    original = {
        "_id": "planning-id",
        "slugline": "Original",
        "version_creator": ObjectId(),
    }
    updates = {"slugline": "Updated"}
    monkeypatch.setattr(planning_module, "get_user", lambda: {"_id": admin_id})

    await service.on_update_async(updates, deepcopy(original))
    assert updates["version_creator"] == admin_id, "Planning field edit should set version_creator"
    assert "versioncreated" in updates, "Planning field edit should set versioncreated"


@pytest.mark.asyncio
async def test_coverage_only_edit_skips_version_creator(monkeypatch):
    service = DummyPlanningService()
    admin_id = ObjectId()
    brian_id = ObjectId()
    coverage_id = "cov-planning"
    original = {
        "_id": "planning-id",
        "slugline": "Test Item",
        "version_creator": brian_id,
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {"headline": "Original headline"},
            }
        ],
    }
    updates = {
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {"headline": "Updated headline"},
            }
        ]
    }
    monkeypatch.setattr(planning_module, "get_user", lambda: {"_id": admin_id})

    await service.on_update_async(updates, deepcopy(original))
    assert "version_creator" not in updates, "Coverage-only edit should not set version_creator"
    assert "versioncreated" not in updates, "Coverage-only edit should not set versioncreated"


@pytest.mark.asyncio
async def test_mixed_planning_and_coverage_edit_updates_version_creator(monkeypatch):
    service = DummyPlanningService()
    admin_id = ObjectId()
    coverage_id = "cov-planning"
    original = {
        "_id": "planning-id",
        "slugline": "Original",
        "description_text": "Original description",
        "version_creator": ObjectId(),
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {"headline": "Original headline"},
            }
        ],
    }
    updates = {
        "slugline": "Updated",
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {"headline": "Updated headline"},
            }
        ],
    }
    monkeypatch.setattr(planning_module, "get_user", lambda: {"_id": admin_id})

    await service.on_update_async(updates, deepcopy(original))
    assert updates["version_creator"] == admin_id, "Mixed edit should set version_creator"
    assert "versioncreated" in updates, "Mixed edit should set versioncreated"


@pytest.mark.asyncio
async def test_system_fields_only_skip_version_creator(monkeypatch):
    service = DummyPlanningService()
    admin_id = ObjectId()
    original = {
        "_id": "planning-id",
        "slugline": "Test Item",
        "state": "draft",
        "version_creator": ObjectId(),
    }
    updates = {
        "state": "scheduled",
        "pubstatus": "usable",
    }
    monkeypatch.setattr(planning_module, "get_user", lambda: {"_id": admin_id})

    await service.on_update_async(updates, deepcopy(original))
    assert "version_creator" not in updates, "System field changes should not set version_creator"
    assert "versioncreated" not in updates, "System field changes should not set versioncreated"


@pytest.mark.asyncio
async def test_should_update_version_creator_helper_method():
    service = DummyPlanningService()
    original = {
        "_id": "planning-id",
        "slugline": "Original",
        "coverages": [],
    }
    updates_planning = {"slugline": "Updated"}
    assert (
        service._should_update_version_creator(updates_planning, original) is True
    ), "Planning field change should return True"

    updates_coverage = {"coverages": [{"coverage_id": "new-cov"}]}
    assert (
        service._should_update_version_creator(updates_coverage, original) is False
    ), "Coverage-only change should return False"

    updates_system = {"state": "scheduled", "pubstatus": "usable"}
    assert (
        service._should_update_version_creator(updates_system, original) is False
    ), "System field change should return False"

    updates_multiple = {"slugline": "Updated", "description_text": "New description"}
    assert (
        service._should_update_version_creator(updates_multiple, original) is True
    ), "Multiple planning field changes should return True"

    updates_mixed = {"slugline": "Updated", "coverages": [{"coverage_id": "new-cov"}]}
    assert (
        service._should_update_version_creator(updates_mixed, original) is True
    ), "Mixed planning and coverage change should return True"


@pytest.mark.asyncio
async def test_history_records_only_coverage_operations(monkeypatch):
    history_service = RecordingPlanningHistoryService()
    # stub_planning_service = SimpleNamespace(
    #     is_coverage_planning_modified=lambda new, old: new.get("planning") != old.get("planning"),
    #     is_coverage_assignment_modified=lambda new, old: new.get("assigned_to") != old.get("assigned_to"),
    # )

    # monkeypatch.setattr(history_module, "get_resource_service", lambda name: stub_planning_service)
    # monkeypatch.setattr(history_module, "request", SimpleNamespace(args={}))

    coverage_id = "cov-planning"
    original = {
        "_id": "planning-id",
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {
                    "headline": "Original headline",
                    "slugline": "Test Item",
                },
                "assigned_to": {
                    "desk": "desk1",
                    "state": "assigned",
                },
            }
        ],
    }

    updates = {
        "coverages": [
            {
                "coverage_id": coverage_id,
                "planning": {
                    "headline": "Updated headline",
                    "slugline": "Test Item",
                },
                "assigned_to": {
                    "desk": "desk1",
                    "state": "assigned",
                },
            }
        ]
    }

    await history_service.on_item_updated(deepcopy(updates), deepcopy(original))

    operations = [entry["operation"] for entry in history_service.entries]

    assert "edited" not in operations, "Coverage-only changes should not create planning-level 'edited' entries"
    assert operations.count("coverage_edited") == 1, "Coverage history should capture modification"


@pytest.mark.asyncio
async def test_ingest_patch_does_not_modify_version_creator(monkeypatch):
    """Ingest patches should not modify version_creator/versioncreated fields"""
    service = DummyPlanningService()
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
