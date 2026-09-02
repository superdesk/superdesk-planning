from unittest import mock

from planning.tests import TestCase
from planning.types.unified import UnifiedPlanningResource
from planning.planning_article_export import get_items, EXPORT_FETCH_PAGE_SIZE


class PlanningArticleExportTest(TestCase):
    async def test_get_items_uses_export_page_size(self):
        planning = UnifiedPlanningResource.from_dict(
            {"_id": "plan1", "type": "planning", "slugline": "plan", "dates": {"start": "2026-06-30T15:30:55+0000"}}
        )

        async def async_iterator():
            yield planning

        service = mock.MagicMock()
        service.find = mock.AsyncMock(return_value=async_iterator())

        with mock.patch.object(UnifiedPlanningResource, "get_service", return_value=service):
            items = await get_items(["plan1"], "planning")

        self.assertEqual(["plan1"], [item["_id"] for item in items])
        service.find.assert_awaited_once_with(
            {"_id": {"$in": ["plan1"]}, "type": "planning"},
            use_mongo=True,
            max_results=EXPORT_FETCH_PAGE_SIZE,
        )
