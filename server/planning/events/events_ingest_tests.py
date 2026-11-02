import pytest
from superdesk import get_resource_service
from datetime import datetime, timedelta
from planning.tests import TestCase
from superdesk.flask import g

from planning.history.planning import UnifiedPlanningHistoryService
from planning.types import UnifiedPlanningResource


class EventIngestTestCase(TestCase):
    async def test_ingest_uses_guid_as_id(self):
        for item_type in ("event", "planning"):
            service = get_resource_service("events" if item_type == "event" else "planning")
            start = datetime.now()
            guid = f"external-{item_type}-id"
            item = {
                "_id": f"generated-{item_type}-id",
                "guid": guid,
                "type": item_type,
                "name": "Ingested item",
                "dates": {"start": start, "end": start + timedelta(hours=1)},
                "planning_date": start,
            }

            ids = await service.post_in_mongo([item])

            self.assertEqual(ids, [guid])
            self.assertEqual(item["_id"], guid)
            stored_item = await UnifiedPlanningResource.get_service().find_by_id(guid)
            self.assertIsNotNone(stored_item)
            self.assertEqual(stored_item.guid, guid)
            self.assertEqual(stored_item.to_dict()["_id"], guid)
            self.assertIsNone(await UnifiedPlanningResource.get_service().find_by_id(f"generated-{item_type}-id"))

    # TODO-ASYNC: Understand the logic and figure out why it is failing
    @pytest.mark.skip(reason="Figure out why it fails")
    async def test_ingest_updated_event(self):
        async with self.app.app_context():
            events_service = get_resource_service("events")
            events_history_service = UnifiedPlanningHistoryService()
            dates = {"start": datetime.now(), "end": datetime.now() + timedelta(days=1)}
            old_event = {
                "guid": "1",
                "name": "bar",
                "ednote": "ednote1",
                "dates": dates,
                "state": "ingested",
                "versioncreated": datetime.now() - timedelta(hours=1),
                "anpa_category": [{"name": "C1", "qcode": "c1"}],
            }

            # event is created
            events_service.post_in_mongo([old_event])
            history_count = await events_history_service.count({"item_id": "1"})
            assert 1 == history_count

            # user updates the event
            updates = {
                "definition_short": "manual",
                "ednote": "manual",
                "anpa_category": [{"name": "C2", "qcode": "c2"}],
            }

            g.user = {"_id": "test"}
            events_service.patch(old_event["_id"], updates)
            await events_history_service.on_item_updated(updates, old_event, "edited")

            history_count = await events_history_service.count({"item_id": "1"})
            assert 2 == history_count

            new_event = {
                "guid": "1",
                "name": "updated",
                "ednote": "updated",
                "dates": dates,
                "definition_short": "updated",
                "versioncreated": datetime.now() - timedelta(minutes=30),
                "anpa_category": [{"name": "C1", "qcode": "c1"}],
            }
            old_event = events_service.find_one(req=None, guid="1")

            assert events_service.should_update(old_event, new_event, {})

            # event is updated via ingest
            await events_service.patch_in_mongo(new_event["guid"], new_event, old_event)
            updated_event = events_service.find_one(req=None, _id="1")

            assert updated_event is not None
            assert updated_event["name"] == "updated"
            assert updated_event["ednote"] == "manual"
            assert updated_event["definition_short"] == "manual"
            assert updated_event["anpa_category"] == [{"name": "C2", "qcode": "c2"}]
