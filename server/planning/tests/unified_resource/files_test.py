from bson import ObjectId

from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.unified.files import delete_item_files
from planning.tests import TestCase, fixtures as planning_fixtures


class UnifiedResourceFilesTestCase(TestCase):
    """Event & Planning files are merged into one shared service over the single
    ``events_files`` collection. The delete guard and ``delete_item_files`` must
    consider the unified resource for BOTH item types, including files referenced
    by a Coverage (``coverages.planning.files`` / ``xmp_file``).
    """

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.planning_service = UnifiedPlanningResource.get_service()
        self.events_files_service = get_resource_service("events_files")
        self.planning_files_service = get_resource_service("planning_files")

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    def _insert_file(self) -> ObjectId:
        file_id = ObjectId()
        self.app.data.insert(
            "events_files",
            [{"_id": file_id, "media": "some-media", "mimetype": "image/jpeg"}],
        )
        return file_id

    async def _create_event_with_files(self, files):
        event = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.EVENT,
                name="Event with files",
                dates={"start": "2026-06-30T15:30:55+0000", "end": "2026-06-30T17:30:55+0000"},
                files=files,
            )
        )
        return (await self.planning_service.create([event]))[0]

    async def _create_planning_with_xmp(self, xmp_file):
        planning = UnifiedPlanningResource.from_dict(
            dict(
                type=PlanningItemType.PLANNING,
                name="Planning with coverage file",
                dates={"start": "2026-06-30T15:30:55+0000"},
                coverages=[
                    {
                        "planning": {
                            "scheduled": "2026-06-30T16:30:55+0000",
                            "slugline": "test slugline",
                            "g2_content_type": "picture",
                            "xmp_file": xmp_file,
                        },
                        "workflow_status": "draft",
                        "news_coverage_status": {
                            "qcode": "ncostat:int",
                            "name": "Intended",
                            "label": "Coverage Intended",
                        },
                        "assigned_to": {
                            "desk": fixtures.desks.SPORTS_DESK_ID,
                            "user": fixtures.users.ADMIN_USER_ID,
                        },
                    }
                ],
            )
        )
        return (await self.planning_service.create([planning]))[0]

    async def test_both_endpoints_share_the_same_collection(self):
        file_id = self._insert_file()
        # Both endpoints resolve to the shared service over the events_files collection
        self.assertIsNotNone(await self.events_files_service.find_one_async(req=None, _id=file_id))
        self.assertIsNotNone(await self.planning_files_service.find_one_async(req=None, _id=file_id))

    async def test_delete_blocked_while_used_by_event(self):
        file_id = self._insert_file()
        await self._create_event_with_files([file_id])

        with self.assertRaises(SuperdeskApiError) as ctx:
            await self.events_files_service.on_delete_async({"_id": file_id})
        self.assertEqual(403, ctx.exception.status_code)

    async def test_delete_blocked_while_used_by_coverage_xmp_file(self):
        # A file referenced only by a Coverage must block deletion, regardless of
        # which endpoint the delete comes through (this is the merged behaviour —
        # the old events_files service only checked event `files`).
        file_id = self._insert_file()
        await self._create_planning_with_xmp(file_id)

        with self.assertRaises(SuperdeskApiError) as ctx:
            await self.events_files_service.on_delete_async({"_id": file_id})
        self.assertEqual(403, ctx.exception.status_code)

    async def test_delete_allowed_when_unreferenced(self):
        file_id = self._insert_file()
        # No item references it -> guard passes (does not raise)
        await self.events_files_service.on_delete_async({"_id": file_id})

    async def test_delete_item_files_keeps_referenced_removes_orphan(self):
        orphan_id = self._insert_file()
        referenced_id = self._insert_file()
        # referenced_id is used by a coverage; orphan_id is used by nothing
        await self._create_planning_with_xmp(referenced_id)

        await delete_item_files(PlanningItemType.PLANNING, [orphan_id, referenced_id])

        self.assertIsNone(await self.events_files_service.find_one_async(req=None, _id=orphan_id))
        self.assertIsNotNone(await self.events_files_service.find_one_async(req=None, _id=referenced_id))
