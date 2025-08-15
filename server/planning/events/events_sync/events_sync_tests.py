import pytz

from contextlib import ExitStack
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

        vocab_service = MagicMock()
        vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]

        planning_service = MagicMock()
        planning_service.patch_async = AsyncMock()

        def select_resource_service(resource_name: str):
            services = {
                "vocabularies": vocab_service,
                "planning": planning_service,
            }
            return services.get(resource_name, MagicMock())

        with ExitStack() as stack:
            profiles_get = stack.enter_context(
                patch(f"{MODULE}.AllContentProfileData.get", new=AsyncMock(return_value=MagicMock()))
            )
            get_resource_service = stack.enter_context(patch(f"{MODULE}.get_resource_service"))
            create_new_plannings = stack.enter_context(
                patch(f"{MODULE}.create_new_plannings_from_embedded_planning", new=AsyncMock())
            )
            get_existing_plannings = stack.enter_context(
                patch(f"{MODULE}.get_existing_plannings_from_embedded_planning")
            )

            get_resource_service.side_effect = select_resource_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_event,
                embedded_planning=embedded_planning,
                embedded_planning_present=False,
            )

            # Assert expectations for creation path
            create_new_plannings.assert_awaited_once()
            get_existing_plannings.assert_not_called()
            planning_service.patch_async.assert_not_awaited()
            profiles_get.assert_awaited()

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

        vocab_service = MagicMock()
        vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]
        planning_service = MagicMock()
        planning_service.patch_async = AsyncMock()

        def select_resource_service(name: str):
            return {
                "vocabularies": vocab_service,
                "planning": planning_service,
            }.get(name, MagicMock())

        with ExitStack() as stack:
            profiles_get = stack.enter_context(
                patch(f"{MODULE}.AllContentProfileData.get", new=AsyncMock(return_value=MagicMock()))
            )
            get_sync_config = stack.enter_context(
                patch(f"{MODULE}.get_config_event_fields_to_sync_with_planning", return_value=set())
            )
            get_resource_service = stack.enter_context(patch(f"{MODULE}.get_resource_service"))
            create_new_plannings = stack.enter_context(
                patch(f"{MODULE}.create_new_plannings_from_embedded_planning", new=AsyncMock())
            )
            get_existing_plannings = stack.enter_context(
                patch(
                    f"{MODULE}.get_existing_plannings_from_embedded_planning", side_effect=existing_plannings_generator
                )
            )
            get_related_planning = stack.enter_context(
                patch(f"{MODULE}.get_related_planning_for_events", return_value=related_planning)
            )

            get_resource_service.side_effect = select_resource_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_fields,
                embedded_planning=embedded_planning,
                embedded_planning_present=embedded_planning_present,
            )

            # Assert 1) create_new always runs
            create_new_plannings.assert_awaited_once()

            # Assert 2) Embedded updates: only pl2 should be patched for slugline
            planning_service.patch_async.assert_any_await("pl2", {"slugline": "needs-update"})

            # Assert 3) Unlink: pl3 should have event pruned from related_events
            pruned_pl3 = [{"_id": "keep"}]
            planning_service.patch_async.assert_any_await("pl3", {"related_events": pruned_pl3})

            # Ensure no patch for pl1 at all (still embedded + no update required)
            patched_ids = [call.args[0] for call in planning_service.patch_async.await_args_list]
            assert "pl1" not in patched_ids

            get_sync_config.assert_called_once()
            assert get_related_planning.call_count == 2
            profiles_get.assert_awaited()

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

        vocab_service = MagicMock()
        vocab_service.find_one.side_effect = [{"items": []}, {"items": []}]
        planning_service = MagicMock()
        planning_service.patch_async = AsyncMock()

        def select_resource_service(name: str):
            return {
                "vocabularies": vocab_service,
                "planning": planning_service,
            }.get(name, MagicMock())

        with ExitStack() as stack:
            profiles_get = stack.enter_context(
                patch(
                    f"{MODULE}.AllContentProfileData.get",
                    new=AsyncMock(
                        return_value=MagicMock(
                            events=MagicMock(is_multilingual=True),
                            planning=MagicMock(is_multilingual=True),
                        )
                    ),
                )
            )
            get_sync_config = stack.enter_context(
                patch(
                    f"{MODULE}.get_config_event_fields_to_sync_with_planning",
                    return_value={"name", "language"},
                )
            )
            get_resource_service = stack.enter_context(patch(f"{MODULE}.get_resource_service"))
            create_new_plannings = stack.enter_context(
                patch(
                    f"{MODULE}.create_new_plannings_from_embedded_planning",
                    new=AsyncMock(),
                )
            )
            get_existing_plannings = stack.enter_context(
                patch(
                    f"{MODULE}.get_existing_plannings_from_embedded_planning",
                    side_effect=existing_plannings_generator,
                )
            )
            sync_existing_planning_item = stack.enter_context(
                patch(
                    f"{MODULE}.sync_existing_planning_item",
                    side_effect=sync_side_effect,
                )
            )

            get_resource_service.side_effect = select_resource_service

            await sync_event_metadata_with_planning_items(
                original=original_event,
                updates=updated_fields,
                embedded_planning=embedded_planning,
                embedded_planning_present=True,
            )

            # Assert: sync invoked for the single embedded item
            assert sync_existing_planning_item.call_count == 1

            # Assert: patch called once with merged updates from embedded + sync
            planning_service.patch_async.assert_awaited_once_with(
                "pl-sync",
                {"slugline": "from-embedded", "headline": "synced-headline"},
            )

            # Assert: create_new runs first; config and profiles fetched
            create_new_plannings.assert_awaited_once()
            get_sync_config.assert_called_once()
            profiles_get.assert_awaited()
