from copy import deepcopy
from types import SimpleNamespace

import pytest
from bson import ObjectId

from planning.planning import planning as planning_module
from planning.planning import planning_history as history_module
from planning.planning.planning import PlanningService
from planning.planning.planning_history import PlanningHistoryService


class DummyPlanningService(PlanningService):
    """Minimal PlanningService that bypasses DB-specific logic for unit tests."""

    async def validate_on_update(self, updates, original, user):  # type: ignore[override]
        return None

    async def _set_coverage(self, updates, original=None):  # type: ignore[override]
        return None

    def set_planning_schedule(self, updates, original=None):  # type: ignore[override]
        return None

    async def _update_recurring_planning_items(self, updates, original, update_method):  # type: ignore[override]
        return None


class RecordingPlanningHistoryService(PlanningHistoryService):
    """Collects history entries instead of touching the database."""

    def __init__(self):
        super().__init__()
        self.entries = []

    def _save_history(self, planning, update, operation):  # type: ignore[override]
        self.entries.append({"operation": operation, "update": deepcopy(update)})


@pytest.mark.asyncio
async def test_planning_edit_updates_last_planning_editor(monkeypatch):
    """Test that planning-level field edits update last_planning_editor"""
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

    assert updates["last_planning_editor"] == admin_id, "Planning field edit should set last_planning_editor"
    assert "last_planning_edit_at" in updates, "Planning field edit should set last_planning_edit_at"
    assert updates["version_creator"] == admin_id, "version_creator should also be set"


@pytest.mark.asyncio
async def test_coverage_only_edit_skips_last_planning_editor(monkeypatch):
    """Test that coverage-only edits do NOT update last_planning_editor"""
    service = DummyPlanningService()
    admin_id = ObjectId()
    brian_id = ObjectId()

    coverage_id = "cov-planning"
    original = {
        "_id": "planning-id",
        "slugline": "Test Item",
        "version_creator": brian_id,
        "last_planning_editor": brian_id,
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

    assert updates["version_creator"] == admin_id, "version_creator should track any modification"
    assert "last_planning_editor" not in updates, "Coverage-only edit should not set last_planning_editor"
    assert "last_planning_edit_at" not in updates, "Coverage-only edit should not set last_planning_edit_at"


@pytest.mark.asyncio
async def test_mixed_planning_and_coverage_edit_updates_last_planning_editor(monkeypatch):
    """Test that edits to both planning and coverage fields update last_planning_editor"""
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

    assert updates["last_planning_editor"] == admin_id, "Mixed edit should set last_planning_editor"
    assert "last_planning_edit_at" in updates, "Mixed edit should set last_planning_edit_at"
    assert updates["version_creator"] == admin_id, "version_creator should also be set"


@pytest.mark.asyncio
async def test_system_fields_only_skip_last_planning_editor(monkeypatch):
    """Test that updates to system-only fields do NOT update last_planning_editor"""
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

    assert updates["version_creator"] == admin_id
    assert "last_planning_editor" not in updates, "System field changes should not set last_planning_editor"
    assert "last_planning_edit_at" not in updates, "System field changes should not set last_planning_edit_at"


@pytest.mark.asyncio
async def test_should_update_planning_editor_helper_method():
    """Test the _should_update_planning_editor helper method"""
    service = DummyPlanningService()

    original = {
        "_id": "planning-id",
        "slugline": "Original",
        "coverages": [],
    }

    updates_planning = {"slugline": "Updated"}
    assert (
        service._should_update_planning_editor(updates_planning, original) is True
    ), "Planning field change should return True"

    updates_coverage = {"coverages": [{"coverage_id": "new-cov"}]}
    assert (
        service._should_update_planning_editor(updates_coverage, original) is False
    ), "Coverage-only change should return False"

    updates_system = {"state": "scheduled", "pubstatus": "usable"}
    assert (
        service._should_update_planning_editor(updates_system, original) is False
    ), "System field change should return False"

    updates_multiple = {"slugline": "Updated", "description_text": "New description"}
    assert (
        service._should_update_planning_editor(updates_multiple, original) is True
    ), "Multiple planning field changes should return True"

    updates_mixed = {"slugline": "Updated", "coverages": [{"coverage_id": "new-cov"}]}
    assert (
        service._should_update_planning_editor(updates_mixed, original) is True
    ), "Mixed planning and coverage change should return True"


def test_history_records_only_coverage_operations(monkeypatch):
    """Test that coverage-only edits don't create planning-level 'edited' history entries"""
    history_service = RecordingPlanningHistoryService()

    stub_planning_service = SimpleNamespace(
        is_coverage_planning_modified=lambda new, old: new.get("planning") != old.get("planning"),
        is_coverage_assignment_modified=lambda new, old: new.get("assigned_to") != old.get("assigned_to"),
    )

    monkeypatch.setattr(history_module, "get_resource_service", lambda name: stub_planning_service)
    monkeypatch.setattr(history_module, "request", SimpleNamespace(args={}))

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

    history_service.on_item_updated(deepcopy(updates), deepcopy(original))

    operations = [entry["operation"] for entry in history_service.entries]

    assert "edited" not in operations, "Coverage-only changes should not create planning-level 'edited' entries"
    assert operations.count("coverage_edited") == 1, "Coverage history should capture the modification"


@pytest.mark.asyncio
async def test_ingest_patch_clears_planning_editor(monkeypatch):
    """Test that ingest patches clear last_planning_editor when updating planning fields"""
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
        "last_planning_editor": user_id,
    }

    ingest_patch = {
        "slugline": "Updated by ingest",
        "description_text": "System updated",
    }

    await service.patch_in_mongo(original["_id"], ingest_patch, deepcopy(original))

    assert captured_document["last_planning_editor"] is None, "Ingest should clear last_planning_editor"
    assert captured_document["last_planning_edit_at"] is None, "Ingest should clear last_planning_edit_at"


@pytest.mark.asyncio
async def test_ingest_patch_coverage_only_skips_clearing(monkeypatch):
    """Test that ingest patches with coverage-only changes don't affect planning editor fields"""
    service = DummyPlanningService()

    class StubBackend:
        async def update_in_mongo_async(self, datasource, item_id, document, original):
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
        "last_planning_editor": user_id,
        "coverages": [],
    }

    ingest_patch = {
        "coverages": [
            {
                "coverage_id": "new-cov",
                "planning": {"headline": "New coverage"},
            }
        ]
    }

    await service.patch_in_mongo(original["_id"], deepcopy(ingest_patch), deepcopy(original))

    assert "last_planning_editor" not in ingest_patch, "Coverage-only ingest should not modify last_planning_editor"
    assert "last_planning_edit_at" not in ingest_patch, "Coverage-only ingest should not modify last_planning_edit_at"
