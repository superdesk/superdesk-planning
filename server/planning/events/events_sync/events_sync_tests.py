import pytz

from datetime import datetime
from copy import deepcopy
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from planning.events.events_tests import EventsBaseTestCase
from planning.events.events_sync import sync_event_metadata_with_planning_items
from planning.events.events import get_events_embedded_planning


MODULE = "planning.events.events_sync"


class SyncEventMetadataWithPlanningItemsTest(EventsBaseTestCase):
    def get_base_event(self) -> dict[str, Any]:
        return {
            "_id": "evt1",
            "name": "evt1",
            "dates": {
                "start": datetime(2099, 1, 1, 12, 0, tzinfo=pytz.UTC),
                "end": datetime(2099, 1, 1, 13, 0, tzinfo=pytz.UTC),
            },
            "translations": [],
        }

    def build_embedded_planning(self, updates: dict[str, Any], plans: list[dict] | None = None):
        plans = plans or [
            {
                "planning_id": "pl1",
                "coverages": [],
            }
        ]
        tmp = deepcopy(updates)
        tmp["embedded_planning"] = plans
        return get_events_embedded_planning(deepcopy(tmp))

    async def test_creation_path_early_return(self):
        """
        CASE 1: When original is empty function should call create_new_plannings_from_embedded_planning once
        and do an early return
        """
        original_event = {}  # new event ( will go down the creation path)
        updated_event = deepcopy(self.get_base_event())
        embedded_planning = self.build_embedded_planning(updated_event)

        # Mocks for dependencies inside the module under test
        with patch(
            f"{MODULE}.AllContentProfileData.get", new=AsyncMock(return_value=MagicMock())
        ) as profiles_get_mock, patch(f"{MODULE}.get_resource_service") as get_resource_service_mock, patch(
            f"{MODULE}.create_new_plannings_from_embedded_planning", new=AsyncMock()
        ) as create_new_plannings_mock, patch(
            f"{MODULE}.get_existing_plannings_from_embedded_planning"
        ) as get_existing_plannings_mock:
            vocab_service = MagicMock()
            vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]
            planning_service = MagicMock()
            planning_service.patch_async = AsyncMock()

            def select_resource_service(resource_name: str):
                if resource_name == "vocabularies":
                    return vocab_service
                if resource_name == "planning":
                    return planning_service
                return MagicMock()

            get_resource_service_mock.side_effect = select_resource_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_event,
                embedded_planning=embedded_planning,
                embedded_planning_present=False,
            )

            # Assert expectations for creation path
            create_new_plannings_mock.assert_awaited_once()
            get_existing_plannings_mock.assert_not_called()
            planning_service.patch_async.assert_not_awaited()
            profiles_get_mock.assert_awaited()

    async def test_no_sync_fields_embedded_updates_and_unlink(self):
        """
        CASE 2: When no sync fields are present, we update only embedded items that need updates
        and unlink any planning items linked to the event but not present in embedded list
        """
        original_event = self.get_base_event()
        updated_fields = {"name": "updated title"}  # not part of sync set
        embedded_planning = self.build_embedded_planning(
            updates=original_event,
            plans=[
                {"planning_id": "pl1", "coverages": [{}]},
                {"planning_id": "pl2", "coverages": [{}]},
            ],
        )
        embedded_planning_present = True

        # Two embedded items: only pl2 requires update
        def existing_plannings_generator(*_args, **_kwargs):
            yield (
                {"_id": "pl1", "related_events": [{"_id": original_event["_id"]}]},
                {"slugline": "no-op"},
                False,  # update_required
            )
            yield (
                {"_id": "pl2", "related_events": [{"_id": original_event["_id"]}]},
                {"slugline": "needs-update"},
                True,  # update_required
            )

        # Linked planning also includes pl3 (not embedded) which should be unlinked from evt1
        related_planning = [
            {"_id": "pl1", "related_events": [{"_id": original_event["_id"]}, {"_id": "other"}]},
            {"_id": "pl2", "related_events": [{"_id": original_event["_id"]}]},
            {"_id": "pl3", "related_events": [{"_id": original_event["_id"]}, {"_id": "keep"}]},
        ]

        with patch(
            f"{MODULE}.AllContentProfileData.get", new=AsyncMock(return_value=MagicMock())
        ) as profiles_get_mock, patch(
            f"{MODULE}.get_config_event_fields_to_sync_with_planning", return_value=set()
        ) as get_sync_config_mock, patch(
            f"{MODULE}.get_resource_service"
        ) as get_resource_service_mock, patch(
            f"{MODULE}.create_new_plannings_from_embedded_planning", new=AsyncMock()
        ) as create_new_plannings_mock, patch(
            f"{MODULE}.get_existing_plannings_from_embedded_planning", side_effect=existing_plannings_generator
        ), patch(
            f"{MODULE}.get_related_planning_for_events", return_value=related_planning
        ) as get_related_planning_mock:
            vocab_service = MagicMock()
            vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]
            planning_service = MagicMock()
            planning_service.patch_async = AsyncMock()

            def select_resouce_service(resource_name: str):
                if resource_name == "vocabularies":
                    return vocab_service
                if resource_name == "planning":
                    return planning_service
                return MagicMock()

            get_resource_service_mock.side_effect = select_resouce_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_fields,
                embedded_planning=embedded_planning,
                embedded_planning_present=embedded_planning_present,
            )

            # 1) create_new always runs
            create_new_plannings_mock.assert_awaited_once()

            # 2) Embedded updates: only pl2 should be patched
            planning_service.patch_async.assert_any_await("pl2", {"slugline": "needs-update"})

            # 3) Unlink: pl3 is linked but not embedded so patch related_events to prune evt1
            # Build expected pruned list for pl3
            pruned_pl3 = [{"_id": "keep"}]  # original had evt1 + keep, we remove evt1
            planning_service.patch_async.assert_any_await("pl3", {"related_events": pruned_pl3})

            # Ensure we didn't patch pl1 (no update required and still embedded)
            # We can check that there's no patch call for pl1 with slugline or related_events removing evt1
            calls_str = [str(c) for c in planning_service.patch_async.await_args_list]
            assert not any("('pl1'," in s and "slugline" in s for s in calls_str)

            get_sync_config_mock.assert_called_once()
            get_related_planning_mock.assert_called_once()
            profiles_get_mock.assert_awaited()

    async def test_sync_fields_present_embedded_item(self):
        """
        CASE 3: When sync fields are present
          - We call sync_existing_planning_item for embedded items
          - If it sets update_planning=True, we patch the item
          - It also covers both update_required=True and False paths
        """
        original_event = self.get_base_event()
        updated_fields = {"name": "new title", "languages": ["en"]}  # intersects configured sync fields
        embedded_planning = self.build_embedded_planning(
            updates=original_event,
            plans=[{"planning_id": "pl-sync", "coverages": [{}]}],
        )

        # Yield one embedded item with update_required=False (sync logic may still set update_planning=True)
        def existing_plannings_generator(*_args, **_kwargs):
            yield (
                {"_id": "pl-sync", "translations": []},
                {"slugline": "from-embedded"},
                False,  # update_required
            )

        # Side-effect: emulate sync deciding that planning needs updating
        def sync_side_effect(sync_data, sync_fields, profiles, coverage_sync_fields):
            sync_data.update_planning = True
            updates_dict = sync_data.planning.updates or {}
            updates_dict["headline"] = "synced-headline"
            sync_data.planning.updates = updates_dict

        with patch(
            f"{MODULE}.AllContentProfileData.get",
            new=AsyncMock(
                return_value=MagicMock(
                    events=MagicMock(is_multilingual=True),
                    planning=MagicMock(is_multilingual=True),
                )
            ),
        ) as profiles_get_mock, patch(
            f"{MODULE}.get_config_event_fields_to_sync_with_planning", return_value={"name", "language"}
        ) as get_sync_config_mock, patch(
            f"{MODULE}.get_resource_service"
        ) as get_resource_service_mock, patch(
            f"{MODULE}.create_new_plannings_from_embedded_planning", new=AsyncMock()
        ) as create_new_plannings_mock, patch(
            f"{MODULE}.get_existing_plannings_from_embedded_planning", side_effect=existing_plannings_generator
        ), patch(
            f"{MODULE}.sync_existing_planning_item", side_effect=sync_side_effect
        ) as sync_existing_planning_item_mock:
            vocab_service = MagicMock()
            vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]
            planning_service = MagicMock()
            planning_service.patch_async = AsyncMock()

            def select_resource_service(resource_name: str):
                if resource_name == "vocabularies":
                    return vocab_service
                if resource_name == "planning":
                    return planning_service
                return MagicMock()

            get_resource_service_mock.side_effect = select_resource_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_fields,
                embedded_planning=embedded_planning,
                embedded_planning_present=True,
            )

            # sync should have been invoked for our single embedded item
            assert sync_existing_planning_item_mock.call_count == 1

            # Patch must be called since sync_data.update_planning=True in side_effect
            planning_service.patch_async.assert_awaited_once_with(
                "pl-sync",
                {"slugline": "from-embedded", "headline": "synced-headline"},
            )

            # create_new always runs first
            create_new_plannings_mock.assert_awaited_once()
            get_sync_config_mock.assert_called_once()
            profiles_get_mock.assert_awaited()
