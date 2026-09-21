from bson import ObjectId

from superdesk.tests import utils as test_utils

from planning.types import DEFAULT_PROFILE_ID, PlanningProfileResource, PlanningProfileType
from planning.content_profiles.utils import get_coverage_schema
from planning.tests import TestCase


class PlanningProfilesTestCase(TestCase):
    async def test_get_coverage_schema(self):
        unknown_id = ObjectId()

        # Default CoverageProfile defined in code
        self.assertEqual((await get_coverage_schema(None)).id, DEFAULT_PROFILE_ID)
        self.assertEqual((await get_coverage_schema(unknown_id)).id, DEFAULT_PROFILE_ID)

        # Create some profiles in the DB
        default_profile_db = PlanningProfileResource(
            id=ObjectId(),
            item_type=PlanningProfileType.COVERAGE,
            name="Default Coverage",
        )
        text_profile = PlanningProfileResource(
            id=ObjectId(),
            item_type=PlanningProfileType.COVERAGE,
            name="Text Coverage",
            content_type="text",
        )
        await test_utils.post_items("planning_types", [default_profile_db, text_profile])

        # Default DB is returned when requesting by ID, or when falling back to default
        self.assertEqual((await get_coverage_schema(default_profile_db.id)).id, default_profile_db.id)
        self.assertEqual((await get_coverage_schema(None)).id, default_profile_db.id)

        # Content-specific profile is returned
        self.assertEqual((await get_coverage_schema(text_profile.id)).id, text_profile.id)

        # If content-specific profile is not found in DB, return default
        self.assertEqual((await get_coverage_schema(unknown_id)).id, default_profile_db.id)
