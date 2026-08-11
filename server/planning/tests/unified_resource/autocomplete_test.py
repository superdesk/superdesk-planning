from superdesk.flask import g
from superdesk.tests import utils as test_utils, fixtures
from superdesk.utc import utcnow

from planning.types.unified import UnifiedPlanningResource, PlanningItemType
from planning.tests import TestCase, fixtures as planning_fixtures
from planning.search.planning_autocomplete import get_event_suggestions, get_planning_suggestions


class UnifiedResourceAutocompleteTestCase(TestCase):
    app_config = {
        **TestCase.app_config.copy(),
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "ARCHIVE_AUTOCOMPLETE_DAYS": 30,
        "ARCHIVE_AUTOCOMPLETE_HOURS": 0,
        "ARCHIVE_AUTOCOMPLETE_LIMIT": 100,
    }

    async def asyncSetUp(self):
        await super().asyncSetUp()
        self.planning_service = UnifiedPlanningResource.get_service()

        await test_utils.post_items("users", fixtures.users.all_users())
        g.user = fixtures.users.admin().to_dict()
        await test_utils.post_items("vocabularies", planning_fixtures.cvs.all_cvs())
        await test_utils.post_items("desks", fixtures.desks.all_desks())
        await test_utils.post_items("stages", fixtures.stages.all_stages())

    def _event(self, guid, slugline, state="scheduled", pubstatus="usable", language="en"):
        now = utcnow()
        return dict(
            guid=guid,
            type=PlanningItemType.EVENT,
            name=slugline,
            slugline=slugline,
            language=language,
            languages=[language],
            state=state,
            pubstatus=pubstatus,
            dates={"start": now, "end": now},
        )

    def _planning(self, guid, slugline, state="scheduled", pubstatus="usable", language="en", coverages=None):
        item = dict(
            guid=guid,
            type=PlanningItemType.PLANNING,
            name=slugline,
            slugline=slugline,
            language=language,
            languages=[language],
            state=state,
            pubstatus=pubstatus,
            dates={"start": utcnow()},
        )
        if coverages is not None:
            item["coverages"] = coverages
        return item

    def _coverage(self, slugline, language="en"):
        return {
            "planning": {
                "scheduled": "2026-06-30T16:30:55+0000",
                "slugline": slugline,
                "language": language,
                "g2_content_type": "text",
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

    async def _seed(self, items):
        await self.planning_service.create([UnifiedPlanningResource.from_dict(item) for item in items])

    async def test_event_suggestions_read_from_unified_resource(self):
        await self._seed(
            [
                self._event("ev-alpha", "event-alpha"),
                self._event("ev-beta", "event-beta", state="postponed"),
                # excluded: not posted / wrong state / wrong language
                self._event("ev-draft", "event-draft", state="draft", pubstatus=None),
                self._event("ev-cancelled", "event-cancelled", state="cancelled"),
                self._event("ev-de", "event-de", language="de"),
                # a planning item must not leak into event suggestions (shared index, type filter)
                self._planning("pl-alpha", "planning-alpha"),
            ]
        )

        suggestions = await get_event_suggestions("slugline", "en")

        self.assertEqual(suggestions.get("event-alpha"), 1)
        self.assertEqual(suggestions.get("event-beta"), 1)
        self.assertNotIn("event-draft", suggestions)
        self.assertNotIn("event-cancelled", suggestions)
        self.assertNotIn("event-de", suggestions)
        self.assertNotIn("planning-alpha", suggestions)

    async def test_planning_suggestions_read_from_unified_resource(self):
        await self._seed(
            [
                self._planning("pl-alpha", "planning-alpha", coverages=[self._coverage("coverage-slug")]),
                self._planning("pl-beta", "planning-beta", state="rescheduled"),
                self._planning("pl-draft", "planning-draft", state="draft", pubstatus=None),
                # an event must not leak into planning suggestions
                self._event("ev-alpha", "event-alpha"),
            ]
        )

        suggestions = await get_planning_suggestions("slugline", "en")

        self.assertEqual(suggestions.get("planning-alpha"), 1)
        self.assertEqual(suggestions.get("planning-beta"), 1)
        # coverage sluglines are aggregated in as well
        self.assertEqual(suggestions.get("coverage-slug"), 1)
        self.assertNotIn("planning-draft", suggestions)
        self.assertNotIn("event-alpha", suggestions)

    async def test_coverage_language_filter(self):
        # coverage in a different language than requested is excluded
        await self._seed(
            [
                self._planning("pl-alpha", "planning-alpha", coverages=[self._coverage("coverage-de", language="de")]),
            ]
        )

        suggestions = await get_planning_suggestions("slugline", "en")

        self.assertEqual(suggestions.get("planning-alpha"), 1)
        self.assertNotIn("coverage-de", suggestions)
