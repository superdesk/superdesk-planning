import pytest

from planning import common as common_module


class StubPostService:
    def __init__(self):
        self.calls = []

    async def post_async(self, docs):
        self.calls.append(docs)
        return ["ok"]


@pytest.mark.asyncio
async def test_update_post_item_skips_repost_for_lock_only_updates(monkeypatch):
    post_service = StubPostService()
    monkeypatch.setattr(common_module, "get_resource_service", lambda _name: post_service)

    original = {
        "_id": "planning-id",
        "type": "planning",
        "pubstatus": "usable",
        "lock_user": "user-1",
        "lock_session": "session-1",
        "lock_time": "2026-07-23T09:44:47+0000",
        "lock_action": "edit",
        "coverages": [{"coverage_id": "cov1", "planning": {"slugline": "A"}}],
    }

    updates = {
        "lock_user": None,
        "lock_session": None,
        "lock_time": None,
        "lock_action": None,
        "_etag": "new-etag",
        # Planning services populate coverages before calling update_post_item.
        "coverages": original["coverages"],
    }

    result = await common_module.update_post_item(updates, original)

    assert result is None
    assert post_service.calls == []


@pytest.mark.asyncio
async def test_update_post_item_reposts_for_meaningful_changes(monkeypatch):
    post_service = StubPostService()
    monkeypatch.setattr(common_module, "get_resource_service", lambda _name: post_service)

    original = {
        "_id": "planning-id",
        "type": "planning",
        "pubstatus": "usable",
        "name": "Old headline",
    }

    updates = {
        "name": "New headline",
        "_etag": "new-etag",
    }

    result = await common_module.update_post_item(updates, original)

    assert result == ["ok"]
    assert len(post_service.calls) == 1
    assert post_service.calls[0][0]["planning"] == "planning-id"
    assert post_service.calls[0][0]["pubstatus"] == "usable"


@pytest.mark.asyncio
async def test_update_post_item_honors_explicit_pubstatus(monkeypatch):
    post_service = StubPostService()
    monkeypatch.setattr(common_module, "get_resource_service", lambda _name: post_service)

    original = {
        "_id": "planning-id",
        "type": "planning",
        "pubstatus": "usable",
        "lock_user": "user-1",
    }

    updates = {
        "lock_user": None,
        "pubstatus": "cancelled",
        "_etag": "new-etag",
    }

    result = await common_module.update_post_item(updates, original)

    assert result == ["ok"]
    assert len(post_service.calls) == 1
    assert post_service.calls[0][0]["pubstatus"] == "cancelled"
